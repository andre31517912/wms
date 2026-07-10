import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  ALL_ORDER_STATUSES,
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABEL,
} from "@/lib/orderStatus";
import type { OrderStatus, Prisma } from "@/generated/prisma/client";

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

  const customerName = customers.find((c) => c.id === customerId)?.name;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">
        Orders{customerName ? ` — ${customerName}` : ""}
      </h1>

      {/* Status tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        <FilterLink
          href={buildHref({ ...params, status: undefined })}
          active={!status}
        >
          All
        </FilterLink>
        {ALL_ORDER_STATUSES.map((s) => (
          <FilterLink
            key={s}
            href={buildHref({ ...params, status: s })}
            active={status === s}
          >
            {ORDER_STATUS_LABEL[s]}
          </FilterLink>
        ))}
      </div>

      {/* Customer + date filters (GET form) */}
      <form
        method="GET"
        className="mb-6 flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow-sm"
      >
        {status && <input type="hidden" name="status" value={status} />}
        <div>
          <label className="mb-1 block text-xs text-gray-500">Customer</label>
          <select
            name="customer"
            defaultValue={customerId ?? ""}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900"
          >
            <option value="">All customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">From</label>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">To</label>
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Filter
        </button>
        <Link
          href="/admin/orders"
          className="text-sm text-gray-500 hover:underline"
        >
          Clear
        </Link>
      </form>

      {orders.length === 0 ? (
        <p className="text-sm text-gray-500">No orders match these filters.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Placed</th>
                <th className="px-4 py-3 text-right">Lines</th>
                <th className="px-4 py-3 text-right">Cases</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Delivery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-medium text-blue-700 hover:underline"
                    >
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <Link
                      href={`/admin/orders?customer=${o.customer.id}`}
                      className="hover:underline"
                    >
                      {o.customer.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {o.createdAt.toLocaleDateString("en-CA")}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {o.lines.length}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {o.lines.reduce((s, l) => s + l.qtyCases, 0)}
                  </td>
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

function buildHref(params: {
  status?: string;
  customer?: string;
  from?: string;
  to?: string;
}): string {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.customer) qs.set("customer", params.customer);
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  const s = qs.toString();
  return `/admin/orders${s ? `?${s}` : ""}`;
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 text-xs font-medium ${active ? "bg-blue-600 text-white" : "bg-white text-gray-700 shadow-sm hover:bg-gray-100"}`}
    >
      {children}
    </Link>
  );
}
