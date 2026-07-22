"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import type { OrderStatus } from "@/generated/prisma/client";

export type OrderDetailLine = {
  id: string;
  snapshotName: string;
  snapshotProductName: string;
  snapshotSku: string | null;
  snapshotPiecesPerCase: number;
  qtyCases: number;
};

export function OrderDetailView({
  orderNumber,
  status,
  createdAtFormatted,
  deliveryDateFormatted,
  totalCases,
  note,
  lines,
  justPlaced,
}: {
  orderNumber: string;
  status: OrderStatus;
  createdAtFormatted: string;
  deliveryDateFormatted: string | null;
  totalCases: number;
  note: string | null;
  lines: OrderDetailLine[];
  justPlaced: boolean;
}) {
  const { t } = useI18n();

  return (
    <div className="max-w-3xl">
      {justPlaced && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          ✅ {t("orderPlacedBanner")}
        </div>
      )}

      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/orders" className="text-blue-600 hover:underline">
          {t("myOrders")}
        </Link>{" "}
        / {orderNumber}
      </nav>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-gray-900">{orderNumber}</h1>
        <OrderStatusBadge status={status} size="md" />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-400">{t("placed")}</p>
          <p className="mt-0.5 text-gray-900">{createdAtFormatted}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-400">{t("deliveryDate")}</p>
          <p className="mt-0.5 text-gray-900">
            {deliveryDateFormatted ?? t("toBeScheduled")}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-400">{t("total")}</p>
          <p className="mt-0.5 text-gray-900">{t("nCases", { n: totalCases })}</p>
        </div>
      </div>

      {note && (
        <div className="mb-6 rounded-xl bg-white p-4 text-sm shadow-sm">
          <p className="text-xs text-gray-400">{t("yourNote")}</p>
          <p className="mt-0.5 text-gray-700">{note}</p>
        </div>
      )}

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
            {lines.map((line) => (
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
