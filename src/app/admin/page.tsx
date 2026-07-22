import { prisma } from "@/lib/prisma";
import { DashboardView, type DashboardCardData } from "./DashboardView";

export default async function AdminDashboardPage() {
  const [
    customerCount,
    pendingCount,
    itemCount,
    productCount,
    items,
    pendingOrders,
  ] = await Promise.all([
    prisma.user.count({
      where: { role: "CUSTOMER", accountStatus: "APPROVED" },
    }),
    prisma.user.count({
      where: { role: "CUSTOMER", accountStatus: "PENDING" },
    }),
    prisma.item.count({ where: { isActive: true } }),
    prisma.product.count(),
    prisma.item.findMany({
      where: { isActive: true },
      select: { stockCases: true, lowStockThreshold: true },
    }),
    prisma.order.count({ where: { status: "PENDING" } }),
  ]);

  const lowStockCount = items.filter(
    (i) => i.stockCases > 0 && i.stockCases <= i.lowStockThreshold
  ).length;
  const outOfStockCount = items.filter((i) => i.stockCases <= 0).length;

  const cards: DashboardCardData[] = [
    { key: "pendingOrders", value: pendingOrders, href: "/admin/orders?status=PENDING", alert: pendingOrders > 0 },
    { key: "approvedCustomers", value: customerCount, href: "/admin/customers" },
    { key: "pendingApprovals", value: pendingCount, href: "/admin/customers", alert: pendingCount > 0 },
    { key: "products", value: productCount, href: "/admin/products" },
    { key: "activeItems", value: itemCount, href: "/admin/products" },
    { key: "lowStock", value: lowStockCount, href: "/admin/products", alert: lowStockCount > 0 },
    { key: "outOfStock", value: outOfStockCount, href: "/admin/products", alert: outOfStockCount > 0 },
  ];

  return <DashboardView cards={cards} />;
}
