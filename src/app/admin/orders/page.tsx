import { prisma } from "@/lib/prisma";
import { ALL_ORDER_STATUSES } from "@/lib/orderStatus";
import type { OrderStatus, Prisma } from "@/generated/prisma/client";
import { OrdersView, type OrderRow } from "./OrdersView";

export default async function AdminOrdersPage(props: {
  searchParams: Promise<{
    status?: string;
    customer?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const params = await props.searchParams;
  const status = ALL_ORDER_STATUSES.includes(params.status as OrderStatus)
    ? (params.status as OrderStatus)
    : undefined;
  const customerId = params.customer || undefined;
  const isoDate = /^\d{4}-\d{2}-\d{2}$/;
  const from = isoDate.test(params.from ?? "") ? params.from : undefined;
  const to = isoDate.test(params.to ?? "") ? params.to : undefined;

  const where: Prisma.OrderWhereInput = {
    ...(status && { status }),
    ...(customerId && { customerId }),
    ...((from || to) && {
      createdAt: {
        ...(from && { gte: new Date(`${from}T00:00:00`) }),
        ...(to && { lte: new Date(`${to}T23:59:59.999`) }),
      },
    }),
  };

  const [orders, customers] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        customer: { select: { id: true, name: true } },
        lines: { select: { qtyCases: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const selectedCustomerName = customers.find((c) => c.id === customerId)?.name;

  const orderRows: OrderRow[] = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerId: o.customer.id,
    customerName: o.customer.name,
    createdAtLabel: o.createdAt.toLocaleDateString("en-CA"),
    lineCount: o.lines.length,
    caseTotal: o.lines.reduce((s, l) => s + l.qtyCases, 0),
    status: o.status,
    deliveryDateLabel: o.deliveryDate
      ? o.deliveryDate.toISOString().slice(0, 10)
      : null,
  }));

  return (
    <OrdersView
      orders={orderRows}
      customers={customers}
      params={params}
      status={status}
      customerId={customerId}
      from={from}
      to={to}
      selectedCustomerName={selectedCustomerName}
    />
  );
}
