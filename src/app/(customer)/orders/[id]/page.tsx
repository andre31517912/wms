import { notFound, redirect } from "next/navigation";
import { requireApprovedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderDetailView } from "./OrderDetailView";

export default async function OrderDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const user = await requireApprovedUser();
  if (user.role !== "CUSTOMER") redirect("/admin");

  const { id } = await props.params;
  const { placed } = await props.searchParams;

  // Ownership enforced in the query itself — customers can only see their own
  const order = await prisma.order.findFirst({
    where: { id, customerId: user.id },
    include: { lines: true },
  });
  if (!order) notFound();

  const totalCases = order.lines.reduce((sum, l) => sum + l.qtyCases, 0);

  return (
    <OrderDetailView
      orderNumber={order.orderNumber}
      status={order.status}
      createdAtFormatted={order.createdAt.toLocaleString("en-CA", {
        dateStyle: "medium",
        timeStyle: "short",
      })}
      deliveryDateFormatted={
        order.deliveryDate ? order.deliveryDate.toISOString().slice(0, 10) : null
      }
      totalCases={totalCases}
      note={order.note}
      justPlaced={placed === "1"}
      lines={order.lines.map((line) => ({
        id: line.id,
        snapshotName: line.snapshotName,
        snapshotProductName: line.snapshotProductName,
        snapshotSku: line.snapshotSku,
        snapshotPiecesPerCase: line.snapshotPiecesPerCase,
        qtyCases: line.qtyCases,
      }))}
    />
  );
}
