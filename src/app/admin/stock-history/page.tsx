import { prisma } from "@/lib/prisma";
import type { AdjustmentReason, Prisma } from "@/generated/prisma/client";
import { StockHistoryView, type StockHistoryRow } from "./StockHistoryView";

const VALID_REASONS: AdjustmentReason[] = [
  "RECEIVING",
  "CORRECTION",
  "DAMAGE",
  "IMPORT",
  "ORDER",
  "ORDER_CANCELLED",
];

export default async function StockHistoryPage(props: {
  searchParams: Promise<{
    reason?: string;
    item?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const params = await props.searchParams;
  const reason = VALID_REASONS.includes(params.reason as AdjustmentReason)
    ? (params.reason as AdjustmentReason)
    : undefined;
  const itemId = params.item || undefined;
  const isoDate = /^\d{4}-\d{2}-\d{2}$/;
  const from = isoDate.test(params.from ?? "") ? params.from : undefined;
  const to = isoDate.test(params.to ?? "") ? params.to : undefined;

  const where: Prisma.StockAdjustmentWhereInput = {
    ...(reason && { reason }),
    ...(itemId && { itemId }),
    ...((from || to) && {
      createdAt: {
        ...(from && { gte: new Date(`${from}T00:00:00`) }),
        ...(to && { lte: new Date(`${to}T23:59:59.999`) }),
      },
    }),
  };

  const [adjustments, items, totalWarehouseStock] = await Promise.all([
    prisma.stockAdjustment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        item: {
          select: {
            id: true,
            name: true,
            sku: true,
            product: { select: { name: true } },
          },
        },
        user: { select: { name: true } },
      },
    }),
    prisma.item.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true },
    }),
    prisma.item.aggregate({ _sum: { stockCases: true } }),
  ]);

  const rows: StockHistoryRow[] = adjustments.map((a) => ({
    id: a.id,
    createdAt: a.createdAt.toISOString(),
    deltaCases: a.deltaCases,
    reason: a.reason,
    note: a.note,
    byName: a.user?.name ?? null,
    itemId: a.item.id,
    itemName: a.item.name,
    itemSku: a.item.sku,
    productName: a.item.product.name,
  }));

  const totalIn = adjustments
    .filter((a) => a.deltaCases > 0)
    .reduce((sum, a) => sum + a.deltaCases, 0);
  const totalOut = adjustments
    .filter((a) => a.deltaCases < 0)
    .reduce((sum, a) => sum + a.deltaCases, 0);

  const warehouseUnits = totalWarehouseStock._sum.stockCases ?? 0;

  return (
    <StockHistoryView
      rows={rows}
      items={items}
      totalIn={totalIn}
      totalOut={totalOut}
      warehouseUnits={warehouseUnits}
    />
  );
}
