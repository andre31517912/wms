import { prisma } from "@/lib/prisma";
import { DashboardView } from "./DashboardView";

export default async function AdminDashboardPage() {
  const [
    customerCount,
    pendingCount,
    allItems,
    productCount,
    pendingOrders,
    activeOrderCount,
    recentOrders,
  ] = await Promise.all([
    prisma.user.count({
      where: { role: "CUSTOMER", accountStatus: "APPROVED" },
    }),
    prisma.user.count({
      where: { role: "CUSTOMER", accountStatus: "PENDING" },
    }),
    prisma.item.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        sku: true,
        stockCases: true,
        lowStockThreshold: true,
        piecesPerCase: true,
        updatedAt: true,
        product: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.product.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({
      where: { status: { in: ["PENDING", "CONFIRMED", "OUT_FOR_DELIVERY"] } },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        createdAt: true,
        customer: { select: { name: true } },
        lines: { select: { qtyCases: true } },
      },
    }),
  ]);

  const itemCount = allItems.length;
  const lowStockItems = allItems.filter(
    (i) => i.stockCases > 0 && i.stockCases <= i.lowStockThreshold,
  );
  const outOfStockItems = allItems.filter((i) => i.stockCases <= 0);

  const inventoryItems = allItems.map((i) => ({
    id: i.id,
    name: i.name,
    sku: i.sku,
    productName: i.product.name,
    stockCases: i.stockCases,
    lowStockThreshold: i.lowStockThreshold,
    piecesPerCase: i.piecesPerCase,
    updatedAt: i.updatedAt.toISOString(),
  }));

  const orders = recentOrders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    customerName: o.customer.name,
    totalCases: o.lines.reduce((s, l) => s + l.qtyCases, 0),
    createdAt: o.createdAt.toISOString(),
  }));

  const stockAlerts = [...outOfStockItems, ...lowStockItems].slice(0, 8).map((i) => ({
    id: i.id,
    name: i.name,
    productName: i.product.name,
    stockCases: i.stockCases,
    lowStockThreshold: i.lowStockThreshold,
  }));

  const products = [...new Set(allItems.map((i) => i.product.name))].sort();

  return (
    <DashboardView
      stats={{
        totalInventory: itemCount,
        lowStock: lowStockItems.length + outOfStockItems.length,
        activeOrders: activeOrderCount,
        pendingApprovals: pendingCount,
      }}
      inventoryItems={inventoryItems}
      recentOrders={orders}
      stockAlerts={stockAlerts}
      productNames={products}
    />
  );
}
