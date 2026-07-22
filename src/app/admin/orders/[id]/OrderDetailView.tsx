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
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/admin/orders" className="text-blue-600 hover:underline">
          {t("orders")}
        </Link>{" "}
        / {order.orderNumber}
      </nav>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-gray-900">
          {order.orderNumber}
        </h1>
        <OrderStatusBadge status={order.status} size="md" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-400">{t("customer")}</p>
          <p className="mt-0.5 font-medium text-gray-900">
            {order.customer.name}
          </p>
          <p className="text-xs text-gray-500">{order.customer.email}</p>
          <Link
            href={`/admin/orders?customer=${order.customer.id}`}
            className="mt-1 inline-block text-xs text-blue-600 hover:underline"
          >
            {t("orderHistory")}
          </Link>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-400">{t("placed")}</p>
          <p className="mt-0.5 text-gray-900">{order.createdAtLabel}</p>
          <p className="mt-2 text-xs text-gray-400">{t("total")}</p>
          <p className="text-gray-900">
            {order.lines.length} {t("lines").toLowerCase()} · {totalCases}{" "}
            {t("cases").toLowerCase()}
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="mb-2 text-xs text-gray-400">{t("deliveryDate")}</p>
          <DeliveryDateForm orderId={order.id} current={order.deliveryDateValue} />
        </div>
      </div>

      {order.note && (
        <div className="mb-6 rounded-xl bg-amber-50 p-4 text-sm shadow-sm">
          <p className="text-xs font-medium text-amber-700">
            {t("customerNote")}
          </p>
          <p className="mt-0.5 text-gray-800">{order.note}</p>
        </div>
      )}

      <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
        <p className="mb-3 text-sm font-medium text-gray-700">
          {t("updateStatus")}
        </p>
        <StatusControls orderId={order.id} status={order.status} />
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">{t("item")}</th>
              <th className="px-4 py-3">{t("sku")}</th>
              <th className="px-4 py-3 text-right">{t("piecesPerCase")}</th>
              <th className="px-4 py-3 text-right">{t("cases")}</th>
              <th className="px-4 py-3 text-right">{t("totalPieces")}</th>
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
