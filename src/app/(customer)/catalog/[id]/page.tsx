import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stockLevel, formatDims } from "@/lib/display";
import { ItemRow } from "./ItemRow";

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
    <div>
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/catalog" className="text-blue-600 hover:underline">
          Catalog
        </Link>{" "}
        / {product.name}
      </nav>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">
        {product.name}
      </h1>

      <div className="space-y-3">
        {product.items.map((item) => (
          <ItemRow
            key={item.id}
            canOrder={user?.role === "CUSTOMER"}
            item={{
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
            }}
          />
        ))}
      </div>
    </div>
  );
}
