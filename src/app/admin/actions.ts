"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  productSchema,
  itemSchema,
  stockAdjustmentSchema,
} from "@/lib/validation";
import { Prisma } from "@/generated/prisma/client";

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
