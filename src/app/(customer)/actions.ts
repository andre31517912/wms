"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireApprovedCustomer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { drainBatchesFifo } from "@/lib/batch";

export type CartActionState = { error: string } | { success: string } | null;

const cartLineSchema = z.object({
  itemId: z.string().min(1),
  qtyCases: z.coerce.number().int("Cases must be a whole number").positive(),
});

// ---------- Cart ----------

export async function addToCart(
  _prev: CartActionState,
  formData: FormData
): Promise<CartActionState> {
  const user = await requireApprovedCustomer();
  const parsed = cartLineSchema.safeParse({
    itemId: formData.get("itemId"),
    qtyCases: formData.get("qtyCases"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { itemId, qtyCases } = parsed.data;

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { isActive: true, minOrderCases: true, stockCases: true, name: true },
  });
  if (!item || !item.isActive) return { error: "This item is not available" };
  if (qtyCases < item.minOrderCases) {
    return { error: `Minimum order is ${item.minOrderCases} cases` };
  }

  const line = await prisma.cartLine.upsert({
    where: { userId_itemId: { userId: user.id, itemId } },
    create: { userId: user.id, itemId, qtyCases },
    update: { qtyCases: { increment: qtyCases } },
  });

  // Advisory ceiling: don't let the cart quietly exceed available stock
  if (line.qtyCases > item.stockCases) {
    await prisma.cartLine.update({
      where: { id: line.id },
      data: { qtyCases: Math.max(item.stockCases, item.minOrderCases) },
    });
    if (item.stockCases < item.minOrderCases) {
      await prisma.cartLine.delete({ where: { id: line.id } });
      return { error: "Not enough stock available for this item right now" };
    }
    revalidatePath("/cart");
    return {
      success: `Added — capped at ${item.stockCases} cases (available stock)`,
    };
  }

  revalidatePath("/cart");
  return { success: `Added ${qtyCases} case(s) to cart` };
}

export async function updateCartLine(
  _prev: CartActionState,
  formData: FormData
): Promise<CartActionState> {
  const user = await requireApprovedCustomer();
  const parsed = cartLineSchema.safeParse({
    itemId: formData.get("itemId"),
    qtyCases: formData.get("qtyCases"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { itemId, qtyCases } = parsed.data;

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { minOrderCases: true },
  });
  if (!item) return { error: "Item not found" };
  if (qtyCases < item.minOrderCases) {
    return { error: `Minimum order is ${item.minOrderCases} cases` };
  }

  await prisma.cartLine.updateMany({
    where: { userId: user.id, itemId },
    data: { qtyCases },
  });
  revalidatePath("/cart");
  return { success: "Quantity updated" };
}

export async function removeCartLine(itemId: string): Promise<void> {
  const user = await requireApprovedCustomer();
  await prisma.cartLine.deleteMany({ where: { userId: user.id, itemId } });
  revalidatePath("/cart");
}

// ---------- Checkout ----------

type LockedItem = {
  id: string;
  name: string;
  is_active: boolean;
  stock_cases: number;
  min_order_cases: number;
};

export async function placeOrder(
  _prev: CartActionState,
  formData: FormData
): Promise<CartActionState> {
  const user = await requireApprovedCustomer();
  const note = String(formData.get("note") ?? "").trim().slice(0, 500) || null;

  let orderId: string;
  try {
    orderId = await prisma.$transaction(async (tx) => {
      const cartLines = await tx.cartLine.findMany({
        where: { userId: user.id },
        include: {
          item: { include: { product: { select: { name: true } } } },
        },
        orderBy: { itemId: "asc" }, // deterministic lock order → no deadlocks
      });
      if (cartLines.length === 0) throw new Error("EMPTY_CART");

      const itemIds = cartLines.map((l) => l.itemId);
      const locked = await tx.$queryRaw<LockedItem[]>`
        SELECT id, name, is_active, stock_cases, min_order_cases
        FROM items WHERE id = ANY(${itemIds}) ORDER BY id FOR UPDATE`;
      const lockedById = new Map(locked.map((i) => [i.id, i]));

      const problems: string[] = [];
      for (const line of cartLines) {
        const item = lockedById.get(line.itemId);
        if (!item || !item.is_active) {
          problems.push(`${line.item.name}: no longer available`);
        } else if (line.qtyCases < item.min_order_cases) {
          problems.push(
            `${item.name}: minimum order is ${item.min_order_cases} cases`
          );
        } else if (line.qtyCases > item.stock_cases) {
          problems.push(
            `${item.name}: only ${item.stock_cases} case(s) in stock`
          );
        }
      }
      if (problems.length > 0) {
        throw new Error(`VALIDATION:${problems.join(" · ")}`);
      }

      const [{ n }] = await tx.$queryRaw<{ n: bigint }[]>`
        SELECT nextval('order_number_seq') AS n`;
      const orderNumber = `W-${String(n).padStart(5, "0")}`;

      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: user.id,
          note,
          lines: {
            create: cartLines.map((line) => ({
              itemId: line.itemId,
              qtyCases: line.qtyCases,
              snapshotName: line.item.name,
              snapshotSku: line.item.sku,
              snapshotProductName: line.item.product.name,
              snapshotPiecesPerCase: line.item.piecesPerCase,
            })),
          },
        },
      });

      const createdLines = await tx.orderLine.findMany({
        where: { orderId: order.id },
        select: { id: true, itemId: true, qtyCases: true },
      });

      for (const line of createdLines) {
        await tx.item.update({
          where: { id: line.itemId },
          data: { stockCases: { decrement: line.qtyCases } },
        });
        await tx.stockAdjustment.create({
          data: {
            itemId: line.itemId,
            userId: user.id,
            deltaCases: -line.qtyCases,
            reason: "ORDER",
            note: orderNumber,
          },
        });

        const drained = await drainBatchesFifo(tx, line.itemId, line.qtyCases);
        for (const d of drained) {
          await tx.batchAllocation.create({
            data: {
              batchId: d.batchId,
              orderLineId: line.id,
              qtyCases: d.qtyCases,
            },
          });
        }
      }

      await tx.cartLine.deleteMany({ where: { userId: user.id } });
      return order.id;
    });
  } catch (e) {
    if (e instanceof Error && e.message === "EMPTY_CART") {
      return { error: "Your cart is empty" };
    }
    if (e instanceof Error && e.message.startsWith("VALIDATION:")) {
      return { error: e.message.slice("VALIDATION:".length) };
    }
    throw e;
  }

  revalidatePath("/cart");
  revalidatePath("/orders");
  revalidatePath("/catalog");
  redirect(`/orders/${orderId}?placed=1`);
}
