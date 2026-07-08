import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { bilingual, stockLevel } from "@/lib/display";

const LEVEL_BADGE = {
  in_stock: "bg-green-100 text-green-800",
  low: "bg-amber-100 text-amber-800",
  out: "bg-red-100 text-red-800",
} as const;

const LEVEL_LABEL = {
  in_stock: "In stock",
  low: "Low",
  out: "Out",
} as const;

export default async function ProductsPage(props: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: categoryId } = await props.searchParams;

  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.product.findMany({
      where: categoryId ? { categoryId } : undefined,
      orderBy: [{ category: { sortOrder: "asc" } }, { createdAt: "asc" }],
      include: { category: true },
    }),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add product
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/admin/products"
          className={`rounded-full px-3 py-1 text-xs font-medium ${!categoryId ? "bg-blue-600 text-white" : "bg-white text-gray-700 shadow-sm hover:bg-gray-100"}`}
        >
          All ({products.length})
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/admin/products?category=${c.id}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${categoryId === c.id ? "bg-blue-600 text-white" : "bg-white text-gray-700 shadow-sm hover:bg-gray-100"}`}
          >
            {bilingual(c.nameZh, c.nameEn)}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-gray-500">
          No products{categoryId ? " in this category" : ""} yet — add one or
          use the bulk import.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Pcs/case</th>
                <th className="px-4 py-3 text-right">Min order</th>
                <th className="px-4 py-3 text-right">Stock (cases)</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => {
                const level = stockLevel(p.stockCases, p.lowStockThreshold);
                return (
                  <tr key={p.id} className={p.isActive ? "" : "opacity-50"}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {p.sku ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="font-medium text-blue-700 hover:underline"
                      >
                        {bilingual(p.nameZh, p.nameEn)}
                      </Link>
                      {(p.detailZh || p.detailEn) && (
                        <p className="text-xs text-gray-400">
                          {bilingual(p.detailZh, p.detailEn)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {bilingual(p.category.nameZh, p.category.nameEn)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {p.piecesPerCase}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {p.minOrderCases}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {p.stockCases}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${LEVEL_BADGE[level]}`}
                      >
                        {p.isActive ? LEVEL_LABEL[level] : "Inactive"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
