"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { StatusControls } from "./StatusControls";
import { DeliveryDateForm } from "./DeliveryDateForm";
import type { OrderStatus } from "@/generated/prisma/client";

export type OrderLineRow = {
  id: string;
  itemId: string;
  snapshotName: string;
  snapshotProductName: string;
  snapshotSku: string | null;
  snapshotPiecesPerCase: number;
  qtyCases: number;
};

export type OrderDetail = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  customer: { id: string; name: string; email: string };
  createdAtLabel: string;
  deliveryDateValue: string;
  note: string | null;
  lines: OrderLineRow[];
};

export function OrderDetailView({ order }: { order: OrderDetail }) {
  const { t } = useI18n();
  const totalCases = order.lines.reduce((s, l) => s + l.qtyCases, 0);

  return (
    <div className="max-w-4xl">
      <nav className="mb-4 text-sm text-admin-text-muted">
        <Link href="/admin/orders" className="text-admin-accent hover:underline">
          {t("orders")}
        </Link>{" "}
        / {order.orderNumber}
      </nav>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">
          {order.orderNumber}
        </h1>
        <OrderStatusBadge status={order.status} size="md" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-admin-surface p-5 ring-1 ring-white/5">
          <p className="text-xs text-admin-text-muted">{t("customer")}</p>
          <p className="mt-0.5 font-medium">
            {order.customer.name}
          </p>
          <p className="text-xs text-admin-text-muted">{order.customer.email}</p>
          <Link
            href={`/admin/orders?customer=${order.customer.id}`}
            className="mt-1 inline-block text-xs text-admin-accent hover:underline"
          >
            {t("orderHistory")}
          </Link>
        </div>
        <div className="rounded-xl bg-admin-surface p-5 ring-1 ring-white/5">
          <p className="text-xs text-admin-text-muted">{t("placed")}</p>
          <p className="mt-0.5">{order.createdAtLabel}</p>
          <p className="mt-2 text-xs text-admin-text-muted">{t("total")}</p>
          <p>
            {order.lines.length} {t("lines").toLowerCase()} · {totalCases}{" "}
            {t("cases").toLowerCase()}
          </p>
        </div>
        <div className="rounded-xl bg-admin-surface p-5 ring-1 ring-white/5">
          <p className="mb-2 text-xs text-admin-text-muted">{t("deliveryDate")}</p>
          <DeliveryDateForm orderId={order.id} current={order.deliveryDateValue} />
        </div>
      </div>

      {order.note && (
        <div className="mb-6 rounded-xl bg-amber-500/10 p-4 text-sm ring-1 ring-amber-500/20">
          <p className="text-xs font-medium text-amber-400">
            {t("customerNote")}
          </p>
          <p className="mt-0.5 text-admin-text">{order.note}</p>
        </div>
      )}

      <div className="mb-6 rounded-xl bg-admin-surface p-5 ring-1 ring-white/5">
        <p className="mb-3 text-sm font-medium text-admin-text-secondary">
          {t("updateStatus")}
        </p>
        <StatusControls orderId={order.id} status={order.status} />
      </div>

      <div className="overflow-x-auto rounded-xl bg-admin-surface ring-1 ring-white/5">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-admin-border text-xs uppercase text-admin-text-muted">
            <tr>
              <th className="px-4 py-3">{t("item")}</th>
              <th className="px-4 py-3">{t("sku")}</th>
              <th className="px-4 py-3 text-right">{t("piecesPerCase")}</th>
              <th className="px-4 py-3 text-right">{t("cases")}</th>
              <th className="px-4 py-3 text-right">{t("totalPieces")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-border-subtle">
            {order.lines.map((line) => (
              <tr key={line.id} className="hover:bg-admin-surface-hover">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/items/${line.itemId}`}
                    className="font-medium text-admin-accent hover:underline"
                  >
                    {line.snapshotName}
                  </Link>
                  <p className="text-xs text-admin-text-muted">
                    {line.snapshotProductName}
                  </p>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-admin-text-muted">
                  {line.snapshotSku ?? "—"}
                </td>
                <td className="px-4 py-3 text-right text-admin-text-secondary">
                  {line.snapshotPiecesPerCase}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {line.qtyCases}
                </td>
                <td className="px-4 py-3 text-right text-admin-text-secondary">
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
