"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { ALL_ORDER_STATUSES, ORDER_STATUS_LABEL } from "@/lib/orderStatus";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import type { OrderStatus } from "@/generated/prisma/client";

export type OrderRow = {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  createdAtLabel: string;
  lineCount: number;
  caseTotal: number;
  status: OrderStatus;
  deliveryDateLabel: string | null;
};

export type OrdersFilterParams = {
  status?: string;
  customer?: string;
  from?: string;
  to?: string;
};

export function OrdersView({
  orders,
  customers,
  params,
  status,
  customerId,
  from,
  to,
  selectedCustomerName,
}: {
  orders: OrderRow[];
  customers: { id: string; name: string }[];
  params: OrdersFilterParams;
  status?: OrderStatus;
  customerId?: string;
  from?: string;
  to?: string;
  selectedCustomerName?: string;
}) {
  const { t } = useI18n();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">
        {t("orders")}
        {selectedCustomerName ? ` — ${selectedCustomerName}` : ""}
      </h1>

      {/* Status tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        <FilterLink
          href={buildHref({ ...params, status: undefined })}
          active={!status}
        >
          {t("all")}
        </FilterLink>
        {ALL_ORDER_STATUSES.map((s) => (
          <FilterLink
            key={s}
            href={buildHref({ ...params, status: s })}
            active={status === s}
          >
            {t(ORDER_STATUS_LABEL[s])}
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
          <label className="mb-1 block text-xs text-gray-500">
            {t("customer")}
          </label>
          <select
            name="customer"
            defaultValue={customerId ?? ""}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900"
          >
            <option value="">{t("allCustomers")}</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">
            {t("from")}
          </label>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">{t("to")}</label>
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
          {t("filter")}
        </button>
        <Link
          href="/admin/orders"
          className="text-sm text-gray-500 hover:underline"
        >
          {t("clear")}
        </Link>
      </form>

      {orders.length === 0 ? (
        <p className="text-sm text-gray-500">{t("noOrdersMatch")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">{t("order")}</th>
                <th className="px-4 py-3">{t("customer")}</th>
                <th className="px-4 py-3">{t("placed")}</th>
                <th className="px-4 py-3 text-right">{t("lines")}</th>
                <th className="px-4 py-3 text-right">{t("cases")}</th>
                <th className="px-4 py-3">{t("status")}</th>
                <th className="px-4 py-3">{t("delivery")}</th>
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
                      href={`/admin/orders?customer=${o.customerId}`}
                      className="hover:underline"
                    >
                      {o.customerName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {o.createdAtLabel}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {o.lineCount}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {o.caseTotal}
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {o.deliveryDateLabel ?? "—"}
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

function buildHref(params: OrdersFilterParams): string {
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
