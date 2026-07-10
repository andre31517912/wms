import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireApprovedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_BADGE, ORDER_STATUS_LABEL } from "@/lib/orderStatus";

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
    <div className="max-w-3xl">
      {placed === "1" && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          ✅ Order placed! The supplier has been notified and will confirm it
          soon.
        </div>
      )}

      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/orders" className="text-blue-600 hover:underline">
          My orders
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

      <div className="mb-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-400">Placed</p>
          <p className="mt-0.5 text-gray-900">
            {order.createdAt.toLocaleString("en-CA", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-400">Delivery date</p>
          <p className="mt-0.5 text-gray-900">
            {order.deliveryDate
              ? order.deliveryDate.toISOString().slice(0, 10)
              : "To be scheduled"}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-400">Total</p>
          <p className="mt-0.5 text-gray-900">{totalCases} cases</p>
        </div>
      </div>

      {order.note && (
        <div className="mb-6 rounded-xl bg-white p-4 text-sm shadow-sm">
          <p className="text-xs text-gray-400">Your note</p>
          <p className="mt-0.5 text-gray-700">{order.note}</p>
        </div>
      )}

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
                  <p className="font-medium text-gray-900">
                    {line.snapshotName}
                  </p>
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
