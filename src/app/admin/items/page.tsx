import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { stockLevel } from "@/lib/display";

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

export default async function ItemsPage(props: {
  searchParams: Promise<{ product?: string }>;
}) {
  const { product: productId } = await props.searchParams;

  const [products, items] = await Promise.all([
    prisma.product.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.item.findMany({
      where: productId ? { productId } : undefined,
      orderBy: [{ product: { sortOrder: "asc" } }, { createdAt: "asc" }],
      include: { product: true },
    }),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Items</h1>
        <Link
          href="/admin/items/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add item
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/admin/items"
          className={`rounded-full px-3 py-1 text-xs font-medium ${!productId ? "bg-blue-600 text-white" : "bg-white text-gray-700 shadow-sm hover:bg-gray-100"}`}
        >
          All ({items.length})
        </Link>
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/admin/items?product=${p.id}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${productId === p.id ? "bg-blue-600 text-white" : "bg-white text-gray-700 shadow-sm hover:bg-gray-100"}`}
          >
            {p.name}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">
          No items{productId ? " under this product" : ""} yet — add one or use
          the bulk import.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3 text-right">Pcs/case</th>
                <th className="px-4 py-3 text-right">Min order</th>
                <th className="px-4 py-3 text-right">Stock (cases)</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => {
                const level = stockLevel(item.stockCases, item.lowStockThreshold);
                return (
                  <tr key={item.id} className={item.isActive ? "" : "opacity-50"}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {item.sku ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/items/${item.id}`}
                        className="font-medium text-blue-700 hover:underline"
                      >
                        {item.name}
                      </Link>
                      {item.detail && (
                        <p className="text-xs text-gray-400">{item.detail}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.product.name}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {item.piecesPerCase}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {item.minOrderCases}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {item.stockCases}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${LEVEL_BADGE[level]}`}
                      >
                        {item.isActive ? LEVEL_LABEL[level] : "Inactive"}
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
