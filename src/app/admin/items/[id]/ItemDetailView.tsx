"use client";

import { useI18n, type TKey } from "@/lib/i18n";
import { updateItem } from "../../actions";
import { ItemForm, type ItemFormValues } from "../ItemForm";
import { StockAdjustForm } from "./StockAdjustForm";
import { DeleteItemButton } from "./DeleteItemButton";
import { ItemPhotos } from "./ItemPhotos";

const LEVEL_KEY: Record<"in_stock" | "low" | "out", TKey> = {
  in_stock: "inStock",
  low: "lowStock",
  out: "outOfStock",
};

const LEVEL_CLS: Record<"in_stock" | "low" | "out", string> = {
  in_stock: "text-emerald-400",
  low: "text-amber-400",
  out: "text-red-400",
};

export type BatchRow = {
  id: string;
  batchNumber: string;
  initialCases: number;
  remainingCases: number;
  importedAtLabel: string;
  note: string | null;
};

export type AdjustmentRow = {
  id: string;
  whenLabel: string;
  deltaCases: number;
  reason: string;
  byName: string | null;
  note: string | null;
};

export type ItemDetailData = {
  id: string;
  name: string;
  sku: string | null;
  productName: string;
  productId: string;
  stockCases: number;
  level: "in_stock" | "low" | "out";
  images: { id: string }[];
  batches: BatchRow[];
  adjustments: AdjustmentRow[];
  formInitial: ItemFormValues;
};

export function ItemDetailView({
  item,
  products,
}: {
  item: ItemDetailData;
  products: { id: string; label: string }[];
}) {
  const { t } = useI18n();

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{item.name}</h1>
          <p className="mt-1 text-sm text-admin-text-muted">
            {item.sku ? `${t("sku")} ${item.sku} · ` : ""}
            {item.productName}
          </p>
        </div>
        <DeleteItemButton itemId={item.id} />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-admin-surface p-5 ring-1 ring-white/5">
          <p className="text-sm text-admin-text-muted">{t("currentStock")}</p>
          <p className="mt-1 text-3xl font-semibold">
            {item.stockCases}
            <span className="ml-1 text-base font-normal text-admin-text-muted">
              {t("casesUnit")}
            </span>
          </p>
          <p className={`mt-1 text-sm font-medium ${LEVEL_CLS[item.level]}`}>
            {t(LEVEL_KEY[item.level])}
          </p>
        </div>
        <div className="rounded-xl bg-admin-surface p-5 ring-1 ring-white/5 sm:col-span-2">
          <p className="mb-3 text-sm font-medium text-admin-text-secondary">
            {t("adjustStock")}
          </p>
          <StockAdjustForm itemId={item.id} />
        </div>
      </div>

      {item.batches.length > 0 && (
        <div className="mb-8 rounded-xl bg-admin-surface ring-1 ring-white/5">
          <h2 className="border-b border-admin-border-subtle px-6 py-4 text-lg font-medium">
            {t("batchInventory")}{" "}
            <span className="text-sm font-normal text-admin-text-muted">
              {t("fifoNote")}
            </span>
          </h2>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-admin-border-subtle text-xs uppercase text-admin-text-muted">
              <tr>
                <th className="px-6 py-2">{t("batch")}</th>
                <th className="px-6 py-2 text-right">{t("received")}</th>
                <th className="px-6 py-2 text-right">{t("remaining")}</th>
                <th className="px-6 py-2">{t("date")}</th>
                <th className="px-6 py-2">{t("note")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border-subtle">
              {item.batches.map((b) => (
                <tr key={b.id} className="hover:bg-admin-surface-hover">
                  <td className="px-6 py-2 font-mono text-xs font-medium">
                    {b.batchNumber}
                  </td>
                  <td className="px-6 py-2 text-right text-admin-text-secondary">
                    {b.initialCases}
                  </td>
                  <td className="px-6 py-2 text-right font-medium">
                    {b.remainingCases}
                  </td>
                  <td className="px-6 py-2 text-admin-text-muted">
                    {b.importedAtLabel}
                  </td>
                  <td className="px-6 py-2 text-admin-text-muted">{b.note ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mb-8 rounded-xl bg-admin-surface p-6 ring-1 ring-white/5">
        <h2 className="mb-4 text-lg font-medium">
          {t("photos")}
        </h2>
        <ItemPhotos itemId={item.id} photos={item.images} />
      </div>

      <div className="mb-8 rounded-xl bg-admin-surface p-6 ring-1 ring-white/5">
        <h2 className="mb-4 text-lg font-medium">
          {t("itemDetails")}
        </h2>
        <ItemForm
          action={updateItem.bind(null, item.id)}
          products={products}
          initial={item.formInitial}
          submitLabel={t("saveChanges")}
        />
      </div>

      <div className="rounded-xl bg-admin-surface ring-1 ring-white/5">
        <h2 className="border-b border-admin-border-subtle px-6 py-4 text-lg font-medium">
          {t("stockHistory")}
        </h2>
        {item.adjustments.length === 0 ? (
          <p className="px-6 py-4 text-sm text-admin-text-muted">
            {t("noStockMovements")}
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-admin-border-subtle text-xs uppercase text-admin-text-muted">
              <tr>
                <th className="px-6 py-2">{t("when")}</th>
                <th className="px-6 py-2">{t("change")}</th>
                <th className="px-6 py-2">{t("reason")}</th>
                <th className="px-6 py-2">{t("by")}</th>
                <th className="px-6 py-2">{t("note")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border-subtle">
              {item.adjustments.map((a) => (
                <tr key={a.id} className="hover:bg-admin-surface-hover">
                  <td className="px-6 py-2 text-admin-text-muted">{a.whenLabel}</td>
                  <td
                    className={`px-6 py-2 font-medium ${a.deltaCases > 0 ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {a.deltaCases > 0 ? `+${a.deltaCases}` : a.deltaCases}
                  </td>
                  <td className="px-6 py-2 text-admin-text-secondary">{a.reason}</td>
                  <td className="px-6 py-2 text-admin-text-secondary">
                    {a.byName ?? "—"}
                  </td>
                  <td className="px-6 py-2 text-admin-text-muted">{a.note ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
