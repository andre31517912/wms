import { prisma } from "@/lib/prisma";
import { ProductsExplorer } from "./ProductsExplorer";

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

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">
        Products &amp; Items
      </h1>
      <ProductsExplorer products={products} />
    </div>
  );
}
