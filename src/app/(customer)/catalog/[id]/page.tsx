import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stockLevel, formatDims } from "@/lib/display";
import { ProductCatalogView } from "./ProductCatalogView";

export default async function ProductCatalogPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const user = await getSessionUser();

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      items: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
        include: {
          images: { orderBy: { sortOrder: "asc" }, select: { id: true } },
        },
      },
    },
  });
  if (!product || product.items.length === 0) notFound();

  return (
    <ProductCatalogView
      productName={product.name}
      canOrder={user?.role === "CUSTOMER"}
      items={product.items.map((item) => ({
        id: item.id,
        name: item.name,
        detail: item.detail,
        sku: item.sku,
        piecesPerCase: item.piecesPerCase,
        dims: formatDims(
          item.caseLengthCm,
          item.caseWidthCm,
          item.caseHeightCm
        ),
        unitWeightG: item.unitWeightG,
        minOrderCases: item.minOrderCases,
        level: stockLevel(item.stockCases, item.lowStockThreshold),
        imageIds: item.images.map((img) => img.id),
      }))}
    />
  );
}
