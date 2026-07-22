import { prisma } from "@/lib/prisma";
import { ProductsView } from "./ProductsView";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          sku: true,
          name: true,
          detail: true,
          piecesPerCase: true,
          caseLengthCm: true,
          caseWidthCm: true,
          caseHeightCm: true,
          minOrderCases: true,
          stockCases: true,
          lowStockThreshold: true,
          isActive: true,
        },
      },
    },
  });

  return <ProductsView products={products} />;
}
