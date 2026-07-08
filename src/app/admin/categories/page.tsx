import { prisma } from "@/lib/prisma";
import { CategoryRow, NewCategoryForm } from "./CategoryForms";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Categories</h1>

      <div className="mb-8 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-medium text-gray-700">
          Add category
        </h2>
        <NewCategoryForm />
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-gray-500">
          No categories yet — add one above or use the bulk import.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Chinese name</th>
                <th className="px-4 py-3">English name</th>
                <th className="px-4 py-3">Sort</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((c) => (
                <CategoryRow
                  key={c.id}
                  category={{
                    id: c.id,
                    nameEn: c.nameEn,
                    nameZh: c.nameZh,
                    sortOrder: c.sortOrder,
                    productCount: c._count.products,
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
