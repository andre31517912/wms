import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const [customerCount, pendingCount, productCount, categoryCount, products] =
    await Promise.all([
      prisma.user.count({
        where: { role: "CUSTOMER", accountStatus: "APPROVED" },
      }),
      prisma.user.count({
        where: { role: "CUSTOMER", accountStatus: "PENDING" },
      }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.category.count(),
      prisma.product.findMany({
        where: { isActive: true },
        select: { stockCases: true, lowStockThreshold: true },
      }),
    ]);

  const lowStockCount = products.filter(
    (p) => p.stockCases > 0 && p.stockCases <= p.lowStockThreshold
  ).length;
  const outOfStockCount = products.filter((p) => p.stockCases <= 0).length;

  const cards: { label: string; value: number; href: string; alert?: boolean }[] = [
    { label: "Approved customers", value: customerCount, href: "/admin/customers" },
    { label: "Pending approvals", value: pendingCount, href: "/admin/customers", alert: pendingCount > 0 },
    { label: "Active products", value: productCount, href: "/admin/products" },
    { label: "Categories", value: categoryCount, href: "/admin/categories" },
    { label: "Low stock", value: lowStockCount, href: "/admin/products", alert: lowStockCount > 0 },
    { label: "Out of stock", value: outOfStockCount, href: "/admin/products", alert: outOfStockCount > 0 },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow"
          >
            <p className="text-sm text-gray-500">{c.label}</p>
            <p
              className={`mt-1 text-3xl font-semibold ${c.alert ? "text-amber-600" : "text-gray-900"}`}
            >
              {c.value}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
