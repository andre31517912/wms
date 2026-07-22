import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OrderDetailView, type OrderDetail } from "./OrderDetailView";

export default async function AdminOrderDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      lines: true,
    },
  });
  if (!order) notFound();

  const detail: OrderDetail = {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    customer: order.customer,
    createdAtLabel: order.createdAt.toLocaleString("en-CA", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    deliveryDateValue: order.deliveryDate
      ? order.deliveryDate.toISOString().slice(0, 10)
      : "",
    note: order.note,
    lines: order.lines.map((line) => ({
      id: line.id,
      itemId: line.itemId,
      snapshotName: line.snapshotName,
      snapshotProductName: line.snapshotProductName,
      snapshotSku: line.snapshotSku,
      snapshotPiecesPerCase: line.snapshotPiecesPerCase,
      qtyCases: line.qtyCases,
    })),
  };

  return <OrderDetailView order={detail} />;
}
