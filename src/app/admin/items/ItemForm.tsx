"use client";

import { useActionState } from "react";
import type { ActionState } from "../actions";
import { useI18n } from "@/lib/i18n";

export type ItemFormValues = {
  productId: string;
  sku: string | null;
  name: string;
  detail: string | null;
  unitWeightG: number | null;
  piecesPerCase: number | null;
  caseLengthCm: number | null;
  caseWidthCm: number | null;
  caseHeightCm: number | null;
  minOrderCases: number;
  lowStockThreshold: number;
  isActive: boolean;
};

const inputCls =
  "w-full rounded-lg border border-admin-input-border bg-admin-input-bg px-3 py-1.5 text-sm text-admin-text focus:border-admin-accent focus:outline-none";
const labelCls = "mb-1 block text-xs text-admin-text-muted";

export function ItemForm({
  action,
  products,
  initial,
  submitLabel,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  products: { id: string; label: string }[];
  initial?: ItemFormValues;
  submitLabel: string;
}) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>{t("productRequired")}</label>
          <select
            name="productId"
            required
            defaultValue={initial?.productId ?? ""}
            className={inputCls}
          >
            <option value="" disabled>
              {t("selectProduct")}
            </option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>{t("skuItemCode")}</label>
          <input
            name="sku"
            type="text"
            defaultValue={initial?.sku ?? ""}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>{t("nameRequired")}</label>
          <input
            name="name"
            type="text"
            required
            defaultValue={initial?.name ?? ""}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>{t("detailSpec")}</label>
          <input
            name="detail"
            type="text"
            defaultValue={initial?.detail ?? ""}
            className={inputCls}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <label className={labelCls}>{t("unitWeightG")}</label>
          <input
            name="unitWeightG"
            type="number"
            step="0.01"
            min="0"
            defaultValue={initial?.unitWeightG ?? ""}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>{t("piecesPerCaseReq")}</label>
          <input
            name="piecesPerCase"
            type="number"
            min="1"
            required
            defaultValue={initial?.piecesPerCase ?? ""}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>{t("minOrderCases")}</label>
          <input
            name="minOrderCases"
            type="number"
            min="1"
            defaultValue={initial?.minOrderCases ?? 1}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>{t("lowStockThreshold")}</label>
          <input
            name="lowStockThreshold"
            type="number"
            min="0"
            defaultValue={initial?.lowStockThreshold ?? 10}
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>{t("caseDimensionsCm")}</label>
        <div className="flex items-center gap-2">
          <input
            name="caseLengthCm"
            type="number"
            step="0.1"
            min="0"
            placeholder="L"
            defaultValue={initial?.caseLengthCm ?? ""}
            className={`${inputCls} w-24`}
          />
          <span className="text-admin-text-muted">×</span>
          <input
            name="caseWidthCm"
            type="number"
            step="0.1"
            min="0"
            placeholder="W"
            defaultValue={initial?.caseWidthCm ?? ""}
            className={`${inputCls} w-24`}
          />
          <span className="text-admin-text-muted">×</span>
          <input
            name="caseHeightCm"
            type="number"
            step="0.1"
            min="0"
            placeholder="H"
            defaultValue={initial?.caseHeightCm ?? ""}
            className={`${inputCls} w-24`}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-admin-text-secondary">
        <input
          name="isActive"
          type="checkbox"
          defaultChecked={initial?.isActive ?? true}
          className="h-4 w-4 rounded border-admin-input-border"
        />
        {t("activeVisible")}
      </label>

      {state && "error" in state && (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      )}
      {state && "success" in state && (
        <p className="text-sm text-emerald-400">{state.success}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? t("saving") : submitLabel}
      </button>
    </form>
  );
}
