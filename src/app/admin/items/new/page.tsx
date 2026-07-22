import { prisma } from "@/lib/prisma";
import { NewItemView } from "./NewItemView";

export default async function NewItemPage() {
  const products = await prisma.product.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return (
    <NewItemView products={products.map((p) => ({ id: p.id, label: p.name }))} />
  );
}
