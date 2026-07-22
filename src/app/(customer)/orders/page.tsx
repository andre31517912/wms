import { redirect } from "next/navigation";
import { requireApprovedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrdersView } from "./OrdersView";

export default async function OrdersPage() {
  const user = await requireApprovedUser();
  if (user.role !== "CUSTOMER") redirect("/admin");

  const orders = await prisma.order.findMany({
    where: { customerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { lines: true } } },
  });

  return (
    <OrdersView
      orders={orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        createdAt: o.createdAt.toLocaleDateString("en-CA"),
        status: o.status,
        deliveryDate: o.deliveryDate
          ? o.deliveryDate.toISOString().slice(0, 10)
          : null,
        lineCount: o._count.lines,
      }))}
    />
  );
}
