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

function rowLabel(row: ImportRow): string {
  const name = row.name ?? "?";
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
): Promise<{
  plans: RowPlan[];
  created: number;
  updated: number;
  productsCreated: number;
}> {
  const plans: RowPlan[] = [];
  let created = 0;
  let updated = 0;
  let productsCreated = 0;

  const existingProducts = await prisma.product.findMany({
    select: { id: true, name: true },
  });
  const productByName = new Map(
    existingProducts.map((p) => [p.name.toLowerCase(), p])
  );

  for (const row of rows) {
    try {
      // --- resolve product (grouping) ---
      if (!row.productName) {
        plans.push({
          rowNumber: row.rowNumber,
          label: rowLabel(row),
          action: "error",
          detail: "No product (grouping) on this row",
        });
        continue;
      }

      let product = productByName.get(row.productName.toLowerCase());
      let productNote = "";
      if (!product) {
        if (execute) {
          product = await prisma.product.create({
            data: { name: row.productName },
            select: { id: true, name: true },
          });
        } else {
          product = { id: `new:${row.productName.toLowerCase()}`, name: row.productName };
        }
        productByName.set(product.name.toLowerCase(), product);
        productsCreated++;
        productNote = ` (new product: ${row.productName})`;
      }

      // --- resolve item ---
      const isNewProduct = product.id.startsWith("new:");
      let existing: { id: string; stockCases: number } | null = null;
      if (!isNewProduct) {
        existing = row.sku
          ? await prisma.item.findFirst({
              where: { sku: row.sku },
              select: { id: true, stockCases: true },
            })
          : await prisma.item.findFirst({
              where: { productId: product.id, name: row.name! },
              select: { id: true, stockCases: true },
            });
      }

      const data = {
        sku: row.sku,
        name: row.name!,
        detail: row.detail,
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
              prisma.item.update({
                where: { id: existing.id },
                data: { ...data, stockCases: row.stockCases },
              }),
              prisma.stockAdjustment.create({
                data: {
                  itemId: existing.id,
                  userId: adminId,
                  deltaCases: delta,
                  reason: "IMPORT",
                  note: `Bulk import row ${row.rowNumber}`,
                },
              }),
            ]);
          }
        } else if (execute) {
          await prisma.item.update({ where: { id: existing.id }, data });
        }
        updated++;
        plans.push({
          rowNumber: row.rowNumber,
          label: rowLabel(row),
          action: "update",
          detail: `Update existing item${stockNote}${ppcNote}${productNote}`,
        });
      } else {
        const initialStock = row.stockCases ?? 0;
        if (execute) {
          const item = await prisma.item.create({
            data: { ...data, productId: product.id, stockCases: initialStock },
          });
          if (initialStock > 0) {
            await prisma.stockAdjustment.create({
              data: {
                itemId: item.id,
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
          detail: `Create${initialStock ? ` with stock ${initialStock}` : ""}${ppcNote}${productNote}`,
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

  return { plans, created, updated, productsCreated };
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
  const { plans, created, updated, productsCreated } = await walkRows(
    rows, execute, admin.id
  );

  if (execute) {
    revalidatePath("/admin/items");
    revalidatePath("/admin/products");
  }

  const verb = execute ? "Imported" : "Would import";
  return {
    mode,
    fileName: file.name,
    parseErrors: errors,
    plans,
    summary: `${verb}: ${created} new item(s), ${updated} updated, ${productsCreated} new product(s) (${rows.length} rows read)`,
  };
}
