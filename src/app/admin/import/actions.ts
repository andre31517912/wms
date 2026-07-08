"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseSheet, type ImportRow } from "@/lib/import";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export type RowPlan = {
  rowNumber: number;
  label: string;
  action: "create" | "update" | "error";
  detail: string;
};

export type ImportState = {
  mode: "preview" | "import";
  fileName: string;
  parseErrors: string[];
  plans: RowPlan[];
  summary: string;
  error?: string;
} | null;

type CategoryRef = { id: string; nameEn: string | null; nameZh: string | null };

function categoryKey(en: string | null, zh: string | null): string {
  return `${(en ?? "").toLowerCase()}|${(zh ?? "").toLowerCase()}`;
}

function rowLabel(row: ImportRow): string {
  const name = row.nameZh || row.nameEn || "?";
  return row.sku ? `${row.sku} — ${name}` : name;
}

/**
 * Preview and import share this walk so what you preview is what you get.
 * When execute=false nothing is written.
 */
async function walkRows(
  rows: ImportRow[],
  execute: boolean,
  adminId: string
): Promise<{ plans: RowPlan[]; created: number; updated: number; categoriesCreated: number }> {
  const plans: RowPlan[] = [];
  let created = 0;
  let updated = 0;
  let categoriesCreated = 0;

  const existingCategories = await prisma.category.findMany({
    select: { id: true, nameEn: true, nameZh: true },
  });
  // Look up categories by either name, tolerating one-name-only rows
  const categoryByName = new Map<string, CategoryRef>();
  for (const c of existingCategories) {
    if (c.nameEn) categoryByName.set(c.nameEn.toLowerCase(), c);
    if (c.nameZh) categoryByName.set(c.nameZh.toLowerCase(), c);
  }
  const pendingNewCategories = new Map<string, CategoryRef>(); // key -> placeholder

  for (const row of rows) {
    try {
      // --- resolve category ---
      const catEn = row.categoryEn;
      const catZh = row.categoryZh;
      let category: CategoryRef | undefined =
        (catEn && categoryByName.get(catEn.toLowerCase())) ||
        (catZh && categoryByName.get(catZh.toLowerCase())) ||
        undefined;
      let categoryNote = "";

      if (!category && !catEn && !catZh) {
        plans.push({
          rowNumber: row.rowNumber,
          label: rowLabel(row),
          action: "error",
          detail: "No category on this row and none could be inferred",
        });
        continue;
      }

      if (!category) {
        const key = categoryKey(catEn, catZh);
        category = pendingNewCategories.get(key);
        if (!category) {
          if (execute) {
            const createdCat = await prisma.category.create({
              data: { nameEn: catEn, nameZh: catZh },
              select: { id: true, nameEn: true, nameZh: true },
            });
            category = createdCat;
          } else {
            category = { id: `new:${key}`, nameEn: catEn, nameZh: catZh };
          }
          pendingNewCategories.set(key, category);
          if (category.nameEn) categoryByName.set(category.nameEn.toLowerCase(), category);
          if (category.nameZh) categoryByName.set(category.nameZh.toLowerCase(), category);
          categoriesCreated++;
          categoryNote = ` (new category: ${catZh || catEn})`;
        }
      }

      // --- resolve product ---
      const isNewCategory = category.id.startsWith("new:");
      let existing: { id: string; stockCases: number } | null = null;
      if (!isNewCategory) {
        if (row.sku) {
          existing = await prisma.product.findFirst({
            where: { sku: row.sku },
            select: { id: true, stockCases: true },
          });
        } else {
          existing = await prisma.product.findFirst({
            where: {
              categoryId: category.id,
              OR: [
                ...(row.nameEn ? [{ nameEn: row.nameEn }] : []),
                ...(row.nameZh ? [{ nameZh: row.nameZh }] : []),
              ],
            },
            select: { id: true, stockCases: true },
          });
        }
      }

      const data = {
        sku: row.sku,
        nameEn: row.nameEn,
        nameZh: row.nameZh,
        detailEn: row.detailEn,
        detailZh: row.detailZh,
        unitWeightG: row.unitWeightG,
        piecesPerCase: row.piecesPerCase ?? 1,
        caseLengthCm: row.caseLengthCm,
        caseWidthCm: row.caseWidthCm,
        caseHeightCm: row.caseHeightCm,
        minOrderCases: row.minOrderCases ?? 1,
      };
      const ppcNote =
        row.piecesPerCase === null ? " (pieces/case missing, defaulted to 1)" : "";

      if (existing) {
        let stockNote = "";
        if (row.stockCases !== null && row.stockCases !== existing.stockCases) {
          const delta = row.stockCases - existing.stockCases;
          stockNote = ` stock ${existing.stockCases} → ${row.stockCases}`;
          if (execute) {
            await prisma.$transaction([
              prisma.product.update({
                where: { id: existing.id },
                data: { ...data, stockCases: row.stockCases },
              }),
              prisma.stockAdjustment.create({
                data: {
                  productId: existing.id,
                  userId: adminId,
                  deltaCases: delta,
                  reason: "IMPORT",
                  note: `Bulk import row ${row.rowNumber}`,
                },
              }),
            ]);
          }
        } else if (execute) {
          await prisma.product.update({ where: { id: existing.id }, data });
        }
        updated++;
        plans.push({
          rowNumber: row.rowNumber,
          label: rowLabel(row),
          action: "update",
          detail: `Update existing product${stockNote}${ppcNote}${categoryNote}`,
        });
      } else {
        const initialStock = row.stockCases ?? 0;
        if (execute) {
          const product = await prisma.product.create({
            data: { ...data, categoryId: category.id, stockCases: initialStock },
          });
          if (initialStock > 0) {
            await prisma.stockAdjustment.create({
              data: {
                productId: product.id,
                userId: adminId,
                deltaCases: initialStock,
                reason: "IMPORT",
                note: `Bulk import row ${row.rowNumber}`,
              },
            });
          }
        }
        created++;
        plans.push({
          rowNumber: row.rowNumber,
          label: rowLabel(row),
          action: "create",
          detail: `Create${initialStock ? ` with stock ${initialStock}` : ""}${ppcNote}${categoryNote}`,
        });
      }
    } catch (e) {
      plans.push({
        rowNumber: row.rowNumber,
        label: rowLabel(row),
        action: "error",
        detail: e instanceof Error ? e.message : "Unexpected error",
      });
    }
  }

  return { plans, created, updated, categoriesCreated };
}

export async function importSheet(
  _prev: ImportState,
  formData: FormData
): Promise<ImportState> {
  const admin = await requireAdmin();

  const mode = formData.get("mode") === "import" ? "import" : "preview";
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return {
      mode, fileName: "", parseErrors: [], plans: [],
      summary: "", error: "Choose an .xlsx or .csv file first",
    };
  }
  if (file.size > MAX_FILE_BYTES) {
    return {
      mode, fileName: file.name, parseErrors: [], plans: [],
      summary: "", error: "File too large (max 5 MB)",
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { rows, errors } = parseSheet(buffer);
  if (rows.length === 0) {
    return {
      mode, fileName: file.name, parseErrors: errors, plans: [],
      summary: "", error: "No importable rows found",
    };
  }

  const execute = mode === "import";
  const { plans, created, updated, categoriesCreated } = await walkRows(
    rows, execute, admin.id
  );

  if (execute) {
    revalidatePath("/admin/products");
    revalidatePath("/admin/categories");
  }

  const verb = execute ? "Imported" : "Would import";
  return {
    mode,
    fileName: file.name,
    parseErrors: errors,
    plans,
    summary: `${verb}: ${created} new, ${updated} updated, ${categoriesCreated} new categor${categoriesCreated === 1 ? "y" : "ies"} (${rows.length} rows read)`,
  };
}
