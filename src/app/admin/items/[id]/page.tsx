import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { stockLevel } from "@/lib/display";
import { ItemDetailView, type ItemDetailData } from "./ItemDetailView";

export default async function ItemDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const [item, products] = await Promise.all([
    prisma.item.findUnique({
      where: { id },
      include: {
        product: true,
        images: {
          orderBy: { sortOrder: "asc" },
          select: { id: true },
        },
        adjustments: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { user: { select: { name: true } } },
        },
        batches: {
          where: { remainingCases: { gt: 0 } },
          orderBy: { importedAt: "asc" },
          select: {
            id: true,
            batchNumber: true,
            initialCases: true,
            remainingCases: true,
            importedAt: true,
            note: true,
          },
        },
      },
    }),
    prisma.product.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);
  if (!item) notFound();

  const level = stockLevel(item.stockCases, item.lowStockThreshold);

  const itemData: ItemDetailData = {
    id: item.id,
    name: item.name,
    sku: item.sku,
    productName: item.product.name,
    productId: item.productId,
    stockCases: item.stockCases,
    level,
    images: item.images,
    batches: item.batches.map((b) => ({
      id: b.id,
      batchNumber: b.batchNumber,
      initialCases: b.initialCases,
      remainingCases: b.remainingCases,
      importedAtLabel: b.importedAt.toLocaleString("en-CA", {
        dateStyle: "short",
      }),
      note: b.note,
    })),
    adjustments: item.adjustments.map((a) => ({
      id: a.id,
      whenLabel: a.createdAt.toLocaleString("en-CA", {
        dateStyle: "short",
        timeStyle: "short",
      }),
      deltaCases: a.deltaCases,
      reason: a.reason,
      byName: a.user?.name ?? null,
      note: a.note,
    })),
    formInitial: {
      productId: item.productId,
      sku: item.sku,
      name: item.name,
      detail: item.detail,
      unitWeightG: item.unitWeightG,
      piecesPerCase: item.piecesPerCase,
      caseLengthCm: item.caseLengthCm,
      caseWidthCm: item.caseWidthCm,
      caseHeightCm: item.caseHeightCm,
      minOrderCases: item.minOrderCases,
      lowStockThreshold: item.lowStockThreshold,
      isActive: item.isActive,
    },
  };

  return (
    <ItemDetailView
      item={itemData}
      products={products.map((p) => ({ id: p.id, label: p.name }))}
    />
  );
}
