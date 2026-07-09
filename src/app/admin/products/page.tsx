import { prisma } from "@/lib/prisma";
import { ProductRow, NewProductForm } from "./ProductForms";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { items: true } } },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Products</h1>

      <div className="mb-8 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-medium text-gray-700">Add product</h2>
        <NewProductForm />
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-gray-500">
          No products yet — add one above or use the bulk import.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Sort</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <ProductRow
                  key={p.id}
                  product={{
                    id: p.id,
                    name: p.name,
                    sortOrder: p.sortOrder,
                    itemCount: p._count.items,
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
