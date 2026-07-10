import { prisma } from "@/lib/prisma";
import { stockLevel, type StockLevel } from "@/lib/display";
import { CatalogGrid, type CatalogCard } from "./CatalogGrid";

function aggregateLevel(levels: StockLevel[]): StockLevel {
  if (levels.length === 0 || levels.every((l) => l === "out")) return "out";
  if (levels.some((l) => l === "in_stock")) return "in_stock";
  return "low";
}

export default async function CatalogPage() {
  const products = await prisma.product.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      items: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
        select: {
          name: true,
          sku: true,
          stockCases: true,
          lowStockThreshold: true,
          images: {
            orderBy: { sortOrder: "asc" },
            take: 1,
            select: { id: true },
          },
        },
      },
    },
  });

  const cards: CatalogCard[] = products
    .filter((p) => p.items.length > 0)
    .map((p) => ({
      id: p.id,
      name: p.name,
      itemCount: p.items.length,
      imageId: p.items.find((i) => i.images.length > 0)?.images[0]?.id ?? null,
      level: aggregateLevel(
        p.items.map((i) => stockLevel(i.stockCases, i.lowStockThreshold))
      ),
      searchText: [
        p.name,
        ...p.items.map((i) => i.name),
        ...p.items.map((i) => i.sku ?? ""),
      ]
        .join(" ")
        .toLowerCase(),
    }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Catalog</h1>
      <CatalogGrid cards={cards} />
    </div>
  );
}
