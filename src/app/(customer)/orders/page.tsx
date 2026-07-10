import Link from "next/link";
import { redirect } from "next/navigation";
import { requireApprovedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_BADGE, ORDER_STATUS_LABEL } from "@/lib/orderStatus";

export default async function OrdersPage() {
  const user = await requireApprovedUser();
  if (user.role !== "CUSTOMER") redirect("/admin");

  const orders = await prisma.order.findMany({
    where: { customerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { lines: true } } },
  });

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">My orders</h1>

      {orders.length === 0 ? (
        <p className="text-sm text-gray-500">
          No orders yet —{" "}
          <Link href="/catalog" className="text-blue-600 hover:underline">
            browse the catalog
          </Link>
          .
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Placed</th>
                <th className="px-4 py-3">Lines</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Delivery date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/orders/${o.id}`}
                      className="font-medium text-blue-700 hover:underline"
                    >
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {o.createdAt.toLocaleDateString("en-CA")}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{o._count.lines}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${ORDER_STATUS_BADGE[o.status]}`}
                    >
                      {ORDER_STATUS_LABEL[o.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {o.deliveryDate
                      ? o.deliveryDate.toISOString().slice(0, 10)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
