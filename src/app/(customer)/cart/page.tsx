import { redirect } from "next/navigation";
import { requireApprovedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CartView } from "./CartView";

export default async function CartPage() {
  const user = await requireApprovedUser();
  if (user.role !== "CUSTOMER") redirect("/admin");

  const lines = await prisma.cartLine.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: {
      item: {
        include: {
          product: { select: { name: true } },
          images: { orderBy: { sortOrder: "asc" }, take: 1, select: { id: true } },
        },
      },
    },
  });

  const totalCases = lines.reduce((sum, l) => sum + l.qtyCases, 0);
  const totalWeightKg = lines.reduce((sum, l) => {
    if (l.item.unitWeightG === null) return sum;
    return sum + (l.item.unitWeightG * l.item.piecesPerCase * l.qtyCases) / 1000;
  }, 0);

  return (
    <CartView
      lines={lines.map((line) => ({
        itemId: line.itemId,
        qtyCases: line.qtyCases,
        name: line.item.name,
        productName: line.item.product.name,
        sku: line.item.sku,
        minOrderCases: line.item.minOrderCases,
        stockCases: line.item.stockCases,
        isActive: line.item.isActive,
        imageId: line.item.images[0]?.id ?? null,
      }))}
      totalCases={totalCases}
      totalWeightKg={totalWeightKg}
    />
  );
}
