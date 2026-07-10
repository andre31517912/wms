import Link from "next/link";
import { redirect } from "next/navigation";
import { requireApprovedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CartLineRow } from "./CartLineRow";
import { CheckoutForm } from "./CheckoutForm";

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
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Cart</h1>

      {lines.length === 0 ? (
        <p className="text-sm text-gray-500">
          Your cart is empty —{" "}
          <Link href="/catalog" className="text-blue-600 hover:underline">
            browse the catalog
          </Link>
          .
        </p>
      ) : (
        <>
          <div className="mb-6 space-y-3">
            {lines.map((line) => (
              <CartLineRow
                key={line.id}
                line={{
                  itemId: line.itemId,
                  qtyCases: line.qtyCases,
                  name: line.item.name,
                  productName: line.item.product.name,
                  sku: line.item.sku,
                  minOrderCases: line.item.minOrderCases,
                  stockCases: line.item.stockCases,
                  isActive: line.item.isActive,
                  imageId: line.item.images[0]?.id ?? null,
                }}
              />
            ))}
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex justify-between text-sm text-gray-600">
              <span>
                {lines.length} item{lines.length === 1 ? "" : "s"} ·{" "}
                <strong className="text-gray-900">{totalCases} cases</strong>
              </span>
              {totalWeightKg > 0 && (
                <span>≈ {totalWeightKg.toFixed(1)} kg total</span>
              )}
            </div>
            <CheckoutForm />
          </div>
        </>
      )}
    </div>
  );
}
