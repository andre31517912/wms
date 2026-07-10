"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  productSchema,
  itemSchema,
  stockAdjustmentSchema,
} from "@/lib/validation";
import { ORDER_STATUS_TRANSITIONS } from "@/lib/orderStatus";
import { Prisma, type OrderStatus } from "@/generated/prisma/client";

export type ActionState = { error: string } | { success: string } | null;

// ---------- Customers ----------

export async function setCustomerStatus(
  userId: string,
  status: "APPROVED" | "DISABLED"
): Promise<void> {
  await requireAdmin();
  // Admins cannot demote/disable other admins from this screen
  await prisma.user.updateMany({
    where: { id: userId, role: "CUSTOMER" },
    data: { accountStatus: status },
  });
  if (status === "DISABLED") {
    // Kill their active sessions immediately
    await prisma.session.deleteMany({ where: { userId } });
  }
  revalidatePath("/admin/customers");
}

// ---------- Products (groupings of items) ----------

function productInput(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder") || "0",
  });
}

export async function createProduct(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = productInput(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.product.create({ data: parsed.data });
  revalidatePath("/admin/products");
  return { success: "Product created" };
}

export async function updateProduct(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = productInput(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.product.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/products");
  return { success: "Product updated" };
}

export async function deleteProduct(id: string): Promise<ActionState> {
  await requireAdmin();
  const itemCount = await prisma.item.count({ where: { productId: id } });
  if (itemCount > 0) {
    return {
      error: `Cannot delete: ${itemCount} item(s) still under this product`,
    };
  }
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/products");
  return { success: "Product deleted" };
}

// ---------- Items (orderable SKUs) ----------

function itemInput(formData: FormData) {
  return itemSchema.safeParse({
    productId: formData.get("productId"),
    sku: formData.get("sku"),
    name: formData.get("name"),
    detail: formData.get("detail"),
    unitWeightG: formData.get("unitWeightG"),
    piecesPerCase: formData.get("piecesPerCase"),
    caseLengthCm: formData.get("caseLengthCm"),
    caseWidthCm: formData.get("caseWidthCm"),
    caseHeightCm: formData.get("caseHeightCm"),
    minOrderCases: formData.get("minOrderCases") || "1",
    lowStockThreshold: formData.get("lowStockThreshold") || "10",
    isActive: formData.get("isActive") === "on",
  });
}

export async function createItem(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = itemInput(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const item = await prisma.item.create({ data: parsed.data });
  revalidatePath("/admin/items");
  redirect(`/admin/items/${item.id}`);
}

export async function updateItem(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = itemInput(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.item.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/items");
  revalidatePath(`/admin/items/${id}`);
  return { success: "Item saved" };
}

export async function deleteItem(id: string): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.item.delete({ where: { id } });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2003"
    ) {
      return {
        error:
          "Cannot delete: item is referenced by orders. Deactivate it instead.",
      };
    }
    throw e;
  }
  revalidatePath("/admin/items");
  redirect("/admin/items");
}

// ---------- Item photos ----------

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_PHOTOS_PER_ITEM = 6;
const ALLOWED_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function uploadItemImages(
  itemId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { id: true, _count: { select: { images: true } } },
  });
  if (!item) return { error: "Item not found" };

  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { error: "Choose at least one image" };

  const room = MAX_PHOTOS_PER_ITEM - item._count.images;
  if (files.length > room) {
    return {
      error: `Max ${MAX_PHOTOS_PER_ITEM} photos per item (${room > 0 ? `${room} slot(s) left` : "no slots left"})`,
    };
  }

  for (const file of files) {
    if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) {
      return { error: `${file.name}: only JPEG, PNG, WebP or GIF images` };
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return { error: `${file.name}: file too large (max 8 MB)` };
    }
  }

  // Import lazily so the sharp native binary only loads when actually needed
  const sharp = (await import("sharp")).default;

  const last = await prisma.itemImage.findFirst({
    where: { itemId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  let nextSort = (last?.sortOrder ?? -1) + 1;

  for (const file of files) {
    let processed: Buffer;
    try {
      processed = await sharp(Buffer.from(await file.arrayBuffer()))
        .rotate() // respect EXIF orientation
        .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
    } catch {
      return { error: `${file.name}: could not be read as an image` };
    }
    await prisma.itemImage.create({
      data: {
        itemId,
        data: new Uint8Array(processed),
        mimeType: "image/webp",
        sortOrder: nextSort++,
      },
    });
  }

  revalidatePath(`/admin/items/${itemId}`);
  return { success: `${files.length} photo(s) uploaded` };
}

export async function deleteItemImage(imageId: string): Promise<void> {
  await requireAdmin();
  const image = await prisma.itemImage.delete({
    where: { id: imageId },
    select: { itemId: true },
  });
  revalidatePath(`/admin/items/${image.itemId}`);
}

export async function makeMainItemImage(imageId: string): Promise<void> {
  await requireAdmin();
  const image = await prisma.itemImage.findUnique({
    where: { id: imageId },
    select: { itemId: true },
  });
  if (!image) return;

  const first = await prisma.itemImage.findFirst({
    where: { itemId: image.itemId },
    orderBy: { sortOrder: "asc" },
    select: { sortOrder: true },
  });
  await prisma.itemImage.update({
    where: { id: imageId },
    data: { sortOrder: (first?.sortOrder ?? 0) - 1 },
  });
  revalidatePath(`/admin/items/${image.itemId}`);
}

// ---------- Orders ----------

export async function updateOrderStatus(
  orderId: string,
  next: OrderStatus
): Promise<ActionState> {
  const admin = await requireAdmin();

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { lines: { orderBy: { itemId: "asc" } } },
      });
      if (!order) throw new Error("NOT_FOUND");
      if (!ORDER_STATUS_TRANSITIONS[order.status].includes(next)) {
        throw new Error("BAD_TRANSITION");
      }

      if (next === "CANCELLED") {
        // Restore the stock this order was holding, with audit entries
        const itemIds = order.lines.map((l) => l.itemId);
        await tx.$queryRaw`
          SELECT id FROM items WHERE id = ANY(${itemIds}) ORDER BY id FOR UPDATE`;
        for (const line of order.lines) {
          await tx.item.update({
            where: { id: line.itemId },
            data: { stockCases: { increment: line.qtyCases } },
          });
          await tx.stockAdjustment.create({
            data: {
              itemId: line.itemId,
              userId: admin.id,
              deltaCases: line.qtyCases,
              reason: "ORDER_CANCELLED",
              note: order.orderNumber,
            },
          });
        }
      } else if (order.status === "CANCELLED") {
        // Reinstating a cancelled order: take the stock back out, but only
        // if it's still available (someone may have ordered it meanwhile)
        const itemIds = order.lines.map((l) => l.itemId);
        const locked = await tx.$queryRaw<
          { id: string; name: string; stock_cases: number }[]
        >`
          SELECT id, name, stock_cases FROM items
          WHERE id = ANY(${itemIds}) ORDER BY id FOR UPDATE`;
        const byId = new Map(locked.map((i) => [i.id, i]));

        const short: string[] = [];
        for (const line of order.lines) {
          const item = byId.get(line.itemId);
          if (!item || item.stock_cases < line.qtyCases) {
            short.push(
              `${item?.name ?? line.snapshotName}: needs ${line.qtyCases}, only ${item?.stock_cases ?? 0} in stock`
            );
          }
        }
        if (short.length > 0) {
          throw new Error(`REINSTATE_SHORT:${short.join(" · ")}`);
        }

        for (const line of order.lines) {
          await tx.item.update({
            where: { id: line.itemId },
            data: { stockCases: { decrement: line.qtyCases } },
          });
          await tx.stockAdjustment.create({
            data: {
              itemId: line.itemId,
              userId: admin.id,
              deltaCases: -line.qtyCases,
              reason: "ORDER",
              note: `${order.orderNumber} (reinstated)`,
            },
          });
        }
      }

      await tx.order.update({
        where: { id: orderId },
        data: { status: next },
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return { error: "Order not found" };
    }
    if (e instanceof Error && e.message === "BAD_TRANSITION") {
      return { error: "That status change is not allowed" };
    }
    if (e instanceof Error && e.message.startsWith("REINSTATE_SHORT:")) {
      return {
        error: `Cannot reinstate — ${e.message.slice("REINSTATE_SHORT:".length)}`,
      };
    }
    throw e;
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/orders");
  return { success: "Status updated" };
}

const deliveryDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date");

export async function setDeliveryDate(
  orderId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const raw = String(formData.get("deliveryDate") ?? "");
  if (raw === "") {
    await prisma.order.update({
      where: { id: orderId },
      data: { deliveryDate: null },
    });
  } else {
    const parsed = deliveryDateSchema.safeParse(raw);
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    await prisma.order.update({
      where: { id: orderId },
      data: { deliveryDate: new Date(`${parsed.data}T00:00:00.000Z`) },
    });
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/orders");
  return { success: "Delivery date saved" };
}

// ---------- Stock adjustments ----------

export async function adjustStock(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = stockAdjustmentSchema.safeParse({
    itemId: formData.get("itemId"),
    deltaCases: formData.get("deltaCases"),
    reason: formData.get("reason"),
    note: formData.get("note"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { itemId, deltaCases, reason, note } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      // Row lock so concurrent adjustments/orders serialize on this item
      const rows = await tx.$queryRaw<{ stock_cases: number }[]>`
        SELECT stock_cases FROM items WHERE id = ${itemId} FOR UPDATE`;
      if (rows.length === 0) throw new Error("ITEM_NOT_FOUND");
      if (rows[0].stock_cases + deltaCases < 0) throw new Error("NEGATIVE");

      await tx.item.update({
        where: { id: itemId },
        data: { stockCases: { increment: deltaCases } },
      });
      await tx.stockAdjustment.create({
        data: { itemId, userId: admin.id, deltaCases, reason, note },
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "NEGATIVE") {
      return { error: "Adjustment would make stock negative" };
    }
    if (e instanceof Error && e.message === "ITEM_NOT_FOUND") {
      return { error: "Item not found" };
    }
    throw e;
  }

  revalidatePath(`/admin/items/${itemId}`);
  revalidatePath("/admin/items");
  return { success: "Stock adjusted" };
}
