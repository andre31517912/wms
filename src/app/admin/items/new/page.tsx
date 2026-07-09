import { prisma } from "@/lib/prisma";
import { createItem } from "../../actions";
import { ItemForm } from "../ItemForm";

export default async function NewItemPage() {
  const products = await prisma.product.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Add item</h1>
      {products.length === 0 ? (
        <p className="text-sm text-gray-500">
          Create a product first (Products page), then add items under it.
        </p>
      ) : (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <ItemForm
            action={createItem}
            products={products.map((p) => ({ id: p.id, label: p.name }))}
            submitLabel="Create item"
          />
        </div>
      )}
    </div>
  );
}
