import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_BADGE, ORDER_STATUS_LABEL } from "@/lib/orderStatus";
import { StatusControls } from "./StatusControls";
import { DeliveryDateForm } from "./DeliveryDateForm";

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

  const totalCases = order.lines.reduce((s, l) => s + l.qtyCases, 0);

  return (
    <div className="max-w-4xl">
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/admin/orders" className="text-blue-600 hover:underline">
          Orders
        </Link>{" "}
        / {order.orderNumber}
      </nav>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-gray-900">
          {order.orderNumber}
        </h1>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${ORDER_STATUS_BADGE[order.status]}`}
        >
          {ORDER_STATUS_LABEL[order.status]}
        </span>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-400">Customer</p>
          <p className="mt-0.5 font-medium text-gray-900">
            {order.customer.name}
          </p>
          <p className="text-xs text-gray-500">{order.customer.email}</p>
          <Link
            href={`/admin/orders?customer=${order.customer.id}`}
            className="mt-1 inline-block text-xs text-blue-600 hover:underline"
          >
            Order history →
          </Link>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-400">Placed</p>
          <p className="mt-0.5 text-gray-900">
            {order.createdAt.toLocaleString("en-CA", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
          <p className="mt-2 text-xs text-gray-400">Total</p>
          <p className="text-gray-900">
            {order.lines.length} line(s) · {totalCases} cases
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="mb-2 text-xs text-gray-400">Delivery date</p>
          <DeliveryDateForm
            orderId={order.id}
            current={
              order.deliveryDate
                ? order.deliveryDate.toISOString().slice(0, 10)
                : ""
            }
          />
        </div>
      </div>

      {order.note && (
        <div className="mb-6 rounded-xl bg-amber-50 p-4 text-sm shadow-sm">
          <p className="text-xs font-medium text-amber-700">Customer note</p>
          <p className="mt-0.5 text-gray-800">{order.note}</p>
        </div>
      )}

      <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
        <p className="mb-3 text-sm font-medium text-gray-700">Update status</p>
        <StatusControls orderId={order.id} status={order.status} />
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3 text-right">Pieces/case</th>
              <th className="px-4 py-3 text-right">Cases</th>
              <th className="px-4 py-3 text-right">Total pieces</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {order.lines.map((line) => (
              <tr key={line.id}>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/items/${line.itemId}`}
                    className="font-medium text-blue-700 hover:underline"
                  >
                    {line.snapshotName}
                  </Link>
                  <p className="text-xs text-gray-400">
                    {line.snapshotProductName}
                  </p>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">
                  {line.snapshotSku ?? "—"}
                </td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {line.snapshotPiecesPerCase}
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">
                  {line.qtyCases}
                </td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {(line.qtyCases * line.snapshotPiecesPerCase).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
