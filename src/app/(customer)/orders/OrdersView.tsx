"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import type { OrderStatus } from "@/generated/prisma/client";

export type OrderRow = {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  deliveryDate: string | null;
  lineCount: number;
};

export function OrdersView({ orders }: { orders: OrderRow[] }) {
  const { t } = useI18n();

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">{t("myOrders")}</h1>

      {orders.length === 0 ? (
        <p className="text-sm text-gray-500">
          {t("noOrdersYet")}{" "}
          <Link href="/catalog" className="text-blue-600 hover:underline">
            {t("browseTheCatalog")}
          </Link>
          .
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">{t("order")}</th>
                <th className="px-4 py-3">{t("placed")}</th>
                <th className="px-4 py-3">{t("lines")}</th>
                <th className="px-4 py-3">{t("status")}</th>
                <th className="px-4 py-3">{t("deliveryDate")}</th>
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
                  <td className="px-4 py-3 text-gray-500">{o.createdAt}</td>
                  <td className="px-4 py-3 text-gray-500">{o.lineCount}</td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {o.deliveryDate ?? "—"}
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
