"use client";

import { useI18n } from "@/lib/i18n";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export type StockHistoryRow = {
  id: string;
  createdAt: string;
  deltaCases: number;
  reason: string;
  note: string | null;
  byName: string | null;
  itemId: string;
  itemName: string;
  itemSku: string | null;
  productName: string;
};

type ItemOption = { id: string; name: string; sku: string | null };

export function StockHistoryView({
  rows,
  items,
  totalIn,
  totalOut,
  warehouseUnits,
}: {
  rows: StockHistoryRow[];
  items: ItemOption[];
  totalIn: number;
  totalOut: number;
  warehouseUnits: number;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();

  const setFilter = useCallback(
    (key: string, value: string) => {
      const sp = new URLSearchParams(searchParams.toString());
      if (value) sp.set(key, value);
      else sp.delete(key);
      router.push(`/admin/stock-history?${sp.toString()}`);
    },
    [router, searchParams]
  );

  const clearAll = useCallback(() => {
    router.push("/admin/stock-history");
  }, [router]);

  const hasFilters =
    searchParams.has("reason") ||
    searchParams.has("item") ||
    searchParams.has("from") ||
    searchParams.has("to");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        {t("globalStockHistory")}
      </h1>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">{t("totalUnits")}</p>
          <p className="text-2xl font-bold text-gray-900">
            {warehouseUnits.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">{t("totalMovements")}</p>
          <p className="text-2xl font-bold text-gray-900">{rows.length}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">{t("totalIn")}</p>
          <p className="text-2xl font-bold text-green-700">+{totalIn}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">{t("totalOut")}</p>
          <p className="text-2xl font-bold text-red-700">{totalOut}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-xs text-gray-500">
            {t("reason")}
          </label>
          <select
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            value={searchParams.get("reason") ?? ""}
            onChange={(e) => setFilter("reason", e.target.value)}
          >
            <option value="">{t("all")}</option>
            <option value="RECEIVING">{t("receiving")}</option>
            <option value="CORRECTION">{t("correction")}</option>
            <option value="DAMAGE">{t("damage")}</option>
            <option value="IMPORT">{t("import_")}</option>
            <option value="ORDER">{t("orderReason")}</option>
            <option value="ORDER_CANCELLED">{t("orderCancelledReason")}</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">
            {t("item")}
          </label>
          <select
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            value={searchParams.get("item") ?? ""}
            onChange={(e) => setFilter("item", e.target.value)}
          >
            <option value="">{t("all")}</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
                {i.sku ? ` (${i.sku})` : ""}
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
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            value={searchParams.get("from") ?? ""}
            onChange={(e) => setFilter("from", e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">
            {t("to")}
          </label>
          <input
            type="date"
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            value={searchParams.get("to") ?? ""}
            onChange={(e) => setFilter("to", e.target.value)}
          />
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            {t("clear")}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white shadow-sm">
        {rows.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-gray-500">
            {t("noStockMovements")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">{t("when")}</th>
                  <th className="px-4 py-3">{t("product")}</th>
                  <th className="px-4 py-3">{t("item")}</th>
                  <th className="px-4 py-3">{t("sku")}</th>
                  <th className="px-4 py-3">{t("change")}</th>
                  <th className="px-4 py-3">{t("reason")}</th>
                  <th className="px-4 py-3">{t("by")}</th>
                  <th className="px-4 py-3">{t("note")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-2 text-gray-500">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {r.productName}
                    </td>
                    <td className="px-4 py-2 font-medium text-gray-900">
                      <a
                        href={`/admin/items/${r.itemId}`}
                        className="hover:underline"
                      >
                        {r.itemName}
                      </a>
                    </td>
                    <td className="px-4 py-2 text-gray-500">
                      {r.itemSku ?? "—"}
                    </td>
                    <td
                      className={`px-4 py-2 font-medium ${r.deltaCases > 0 ? "text-green-700" : "text-red-700"}`}
                    >
                      {r.deltaCases > 0 ? `+${r.deltaCases}` : r.deltaCases}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {reasonLabel(r.reason)}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {r.byName ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-gray-500">
                      {r.note ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function reasonLabel(reason: string): string {
  const map: Record<string, string> = {
    RECEIVING: "Receiving",
    CORRECTION: "Correction",
    DAMAGE: "Damage",
    IMPORT: "Import",
    ORDER: "Order",
    ORDER_CANCELLED: "Order cancelled",
  };
  return map[reason] ?? reason;
}
