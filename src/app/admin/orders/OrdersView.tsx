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
      <h1 className="mb-6 text-2xl font-semibold">
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
        className="mb-6 flex flex-wrap items-end gap-3 rounded-xl bg-admin-surface p-4 ring-1 ring-white/5"
      >
        {status && <input type="hidden" name="status" value={status} />}
        <div>
          <label className="mb-1 block text-xs text-admin-text-muted">
            {t("customer")}
          </label>
          <select
            name="customer"
            defaultValue={customerId ?? ""}
            className="rounded-lg border border-admin-input-border bg-admin-input-bg px-3 py-1.5 text-sm text-admin-text"
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
          <label className="mb-1 block text-xs text-admin-text-muted">
            {t("from")}
          </label>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="rounded-lg border border-admin-input-border bg-admin-input-bg px-3 py-1.5 text-sm text-admin-text"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-admin-text-muted">{t("to")}</label>
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="rounded-lg border border-admin-input-border bg-admin-input-bg px-3 py-1.5 text-sm text-admin-text"
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
          className="text-sm text-admin-text-muted hover:underline"
        >
          {t("clear")}
        </Link>
      </form>

      {orders.length === 0 ? (
        <p className="text-sm text-admin-text-muted">{t("noOrdersMatch")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-admin-surface ring-1 ring-white/5">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-admin-border text-xs uppercase text-admin-text-muted">
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
            <tbody className="divide-y divide-admin-border-subtle">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-admin-surface-hover">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-medium text-admin-accent hover:underline"
                    >
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-admin-text-secondary">
                    <Link
                      href={`/admin/orders?customer=${o.customerId}`}
                      className="hover:underline"
                    >
                      {o.customerName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-admin-text-muted">
                    {o.createdAtLabel}
                  </td>
                  <td className="px-4 py-3 text-right text-admin-text-muted">
                    {o.lineCount}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {o.caseTotal}
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-admin-text-muted">
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
      className={`rounded-full px-3 py-1 text-xs font-medium ${active ? "bg-blue-600 text-white" : "bg-admin-surface text-admin-text-secondary ring-1 ring-white/5 hover:bg-admin-surface-hover"}`}
    >
      {children}
    </Link>
  );
}
