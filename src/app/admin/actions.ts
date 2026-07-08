"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  categorySchema,
  productSchema,
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

// ---------- Categories ----------

function categoryInput(formData: FormData) {
  return categorySchema.safeParse({
    nameEn: formData.get("nameEn"),
    nameZh: formData.get("nameZh"),
    sortOrder: formData.get("sortOrder") || "0",
  });
}

export async function createCategory(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = categoryInput(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.category.create({ data: parsed.data });
  revalidatePath("/admin/categories");
  return { success: "Category created" };
}

export async function updateCategory(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = categoryInput(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.category.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/categories");
  return { success: "Category updated" };
}

export async function deleteCategory(id: string): Promise<ActionState> {
  await requireAdmin();
  const productCount = await prisma.product.count({
    where: { categoryId: id },
  });
  if (productCount > 0) {
    return {
      error: `Cannot delete: ${productCount} product(s) still in this category`,
    };
  }
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  return { success: "Category deleted" };
}

// ---------- Products ----------

function productInput(formData: FormData) {
  return productSchema.safeParse({
    categoryId: formData.get("categoryId"),
    sku: formData.get("sku"),
    nameEn: formData.get("nameEn"),
    nameZh: formData.get("nameZh"),
    detailEn: formData.get("detailEn"),
    detailZh: formData.get("detailZh"),
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

export async function createProduct(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = productInput(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const product = await prisma.product.create({ data: parsed.data });
  revalidatePath("/admin/products");
  redirect(`/admin/products/${product.id}`);
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
  revalidatePath(`/admin/products/${id}`);
  return { success: "Product saved" };
}

export async function deleteProduct(id: string): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.product.delete({ where: { id } });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2003"
    ) {
      return {
        error:
          "Cannot delete: product is referenced by orders. Deactivate it instead.",
      };
    }
    throw e;
  }
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

// ---------- Stock adjustments ----------

export async function adjustStock(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = stockAdjustmentSchema.safeParse({
    productId: formData.get("productId"),
    deltaCases: formData.get("deltaCases"),
    reason: formData.get("reason"),
    note: formData.get("note"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { productId, deltaCases, reason, note } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      // Row lock so concurrent adjustments/orders serialize on this product
      const rows = await tx.$queryRaw<{ stock_cases: number }[]>`
        SELECT stock_cases FROM products WHERE id = ${productId} FOR UPDATE`;
      if (rows.length === 0) throw new Error("PRODUCT_NOT_FOUND");
      if (rows[0].stock_cases + deltaCases < 0) throw new Error("NEGATIVE");

      await tx.product.update({
        where: { id: productId },
        data: { stockCases: { increment: deltaCases } },
      });
      await tx.stockAdjustment.create({
        data: { productId, userId: admin.id, deltaCases, reason, note },
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "NEGATIVE") {
      return { error: "Adjustment would make stock negative" };
    }
    if (e instanceof Error && e.message === "PRODUCT_NOT_FOUND") {
      return { error: "Product not found" };
    }
    throw e;
  }

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/products");
  return { success: "Stock adjusted" };
}
