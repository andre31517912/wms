import { prisma } from "@/lib/prisma";
import { bilingual } from "@/lib/display";
import { createProduct } from "../../actions";
import { ProductForm } from "../ProductForm";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">
        Add product
      </h1>
      {categories.length === 0 ? (
        <p className="text-sm text-gray-500">
          Create a category first (Categories page), then add products.
        </p>
      ) : (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <ProductForm
            action={createProduct}
            categories={categories.map((c) => ({
              id: c.id,
              label: bilingual(c.nameZh, c.nameEn),
            }))}
            submitLabel="Create product"
          />
        </div>
      )}
    </div>
  );
}
