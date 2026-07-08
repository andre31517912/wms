"use client";

import { useActionState } from "react";
import type { ActionState } from "../actions";

export type ProductFormValues = {
  categoryId: string;
  sku: string | null;
  nameEn: string | null;
  nameZh: string | null;
  detailEn: string | null;
  detailZh: string | null;
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
  "w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none";
const labelCls = "mb-1 block text-xs text-gray-500";

export function ProductForm({
  action,
  categories,
  initial,
  submitLabel,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  categories: { id: string; label: string }[];
  initial?: ProductFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Category *</label>
          <select
            name="categoryId"
            required
            defaultValue={initial?.categoryId ?? ""}
            className={inputCls}
          >
            <option value="" disabled>
              Select category...
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>SKU / product code</label>
          <input
            name="sku"
            type="text"
            defaultValue={initial?.sku ?? ""}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Chinese name 中文品名</label>
          <input
            name="nameZh"
            type="text"
            defaultValue={initial?.nameZh ?? ""}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>English name</label>
          <input
            name="nameEn"
            type="text"
            defaultValue={initial?.nameEn ?? ""}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Detail / spec 规格 (Chinese)</label>
          <input
            name="detailZh"
            type="text"
            defaultValue={initial?.detailZh ?? ""}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Detail / spec (English)</label>
          <input
            name="detailEn"
            type="text"
            defaultValue={initial?.detailEn ?? ""}
            className={inputCls}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <label className={labelCls}>Unit weight (g)</label>
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
          <label className={labelCls}>Pieces per case *</label>
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
          <label className={labelCls}>Min order (cases)</label>
          <input
            name="minOrderCases"
            type="number"
            min="1"
            defaultValue={initial?.minOrderCases ?? 1}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Low-stock threshold</label>
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
        <label className={labelCls}>Case dimensions (cm)</label>
        <div className="flex items-center gap-2">
          <input
            name="caseLengthCm"
            type="number"
            step="0.1"
            min="0"
            placeholder="L 长"
            defaultValue={initial?.caseLengthCm ?? ""}
            className={`${inputCls} w-24`}
          />
          <span className="text-gray-400">×</span>
          <input
            name="caseWidthCm"
            type="number"
            step="0.1"
            min="0"
            placeholder="W 宽"
            defaultValue={initial?.caseWidthCm ?? ""}
            className={`${inputCls} w-24`}
          />
          <span className="text-gray-400">×</span>
          <input
            name="caseHeightCm"
            type="number"
            step="0.1"
            min="0"
            placeholder="H 高"
            defaultValue={initial?.caseHeightCm ?? ""}
            className={`${inputCls} w-24`}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          name="isActive"
          type="checkbox"
          defaultChecked={initial?.isActive ?? true}
          className="h-4 w-4 rounded border-gray-300"
        />
        Active (visible to customers)
      </label>

      {state && "error" in state && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state && "success" in state && (
        <p className="text-sm text-green-600">{state.success}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
