import type { PrismaClient } from "@/generated/prisma/client";

type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

export async function nextBatchNumber(tx: Tx, itemId: string): Promise<string> {
  const last = await tx.batch.findFirst({
    where: { itemId },
    orderBy: { batchNumber: "desc" },
    select: { batchNumber: true },
  });
  const n = last ? parseInt(last.batchNumber.replace("B-", ""), 10) + 1 : 1;
  return `B-${String(n).padStart(5, "0")}`;
}

export async function createBatch(
  tx: Tx,
  opts: { itemId: string; cases: number; userId: string | null; note?: string }
): Promise<string> {
  const batchNumber = await nextBatchNumber(tx, opts.itemId);
  const batch = await tx.batch.create({
    data: {
      batchNumber,
      itemId: opts.itemId,
      initialCases: opts.cases,
      remainingCases: opts.cases,
      userId: opts.userId,
      note: opts.note ?? null,
    },
  });
  return batch.id;
}

/**
 * Drain `cases` from the oldest batches of `itemId` (FIFO).
 * Returns the list of (batchId, qty) pairs consumed.
 * Throws if total remaining across batches is insufficient.
 */
export async function drainBatchesFifo(
  tx: Tx,
  itemId: string,
  cases: number
): Promise<{ batchId: string; qtyCases: number }[]> {
  const batches = await tx.batch.findMany({
    where: { itemId, remainingCases: { gt: 0 } },
    orderBy: { importedAt: "asc" },
    select: { id: true, remainingCases: true },
  });

  let remaining = cases;
  const drained: { batchId: string; qtyCases: number }[] = [];

  for (const batch of batches) {
    if (remaining <= 0) break;
    const take = Math.min(batch.remainingCases, remaining);
    await tx.batch.update({
      where: { id: batch.id },
      data: { remainingCases: { decrement: take } },
    });
    drained.push({ batchId: batch.id, qtyCases: take });
    remaining -= take;
  }

  if (remaining > 0) {
    throw new Error("BATCH_SHORTFALL");
  }

  return drained;
}

/**
 * Restore batch quantities from allocations tied to an order's lines.
 */
export async function restoreBatchAllocations(
  tx: Tx,
  orderLineIds: string[]
): Promise<void> {
  const allocations = await tx.batchAllocation.findMany({
    where: { orderLineId: { in: orderLineIds } },
  });

  for (const alloc of allocations) {
    await tx.batch.update({
      where: { id: alloc.batchId },
      data: { remainingCases: { increment: alloc.qtyCases } },
    });
  }

  await tx.batchAllocation.deleteMany({
    where: { orderLineId: { in: orderLineIds } },
  });
}
