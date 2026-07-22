"use client";

import { useState, useActionState, useTransition } from "react";
import {
  updateCartLine,
  removeCartLine,
  type CartActionState,
} from "../actions";
import { useI18n } from "@/lib/i18n";

export function CartLineRow({
  line,
}: {
  line: {
    itemId: string;
    qtyCases: number;
    name: string;
    productName: string;
    sku: string | null;
    minOrderCases: number;
    stockCases: number;
    isActive: boolean;
    imageId: string | null;
  };
}) {
  const { t } = useI18n();
  const [qty, setQty] = useState(line.qtyCases);
  const [removing, startRemove] = useTransition();
  const [state, formAction, saving] = useActionState(
    async (prev: CartActionState, formData: FormData) =>
      updateCartLine(prev, formData),
    null
  );

  const warning = !line.isActive
    ? t("noLongerAvailable")
    : line.qtyCases > line.stockCases
      ? t("onlyNCasesInStock", { n: line.stockCases })
      : line.qtyCases < line.minOrderCases
        ? t("minOrderIs", { n: line.minOrderCases })
        : null;

  return (
    <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {line.imageId ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`/api/images/${line.imageId}`}
            alt={line.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-2xl text-gray-300">
            📦
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-gray-900">{line.name}</p>
        <p className="text-xs text-gray-500">
          {line.productName}
          {line.sku ? ` · ${line.sku}` : ""}
        </p>
        {warning && <p className="mt-0.5 text-xs text-amber-600">{warning}</p>}
        {state && "error" in state && (
          <p className="mt-0.5 text-xs text-red-600">{state.error}</p>
        )}
      </div>

      <form action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="itemId" value={line.itemId} />
        <input
          name="qtyCases"
          type="number"
          min={line.minOrderCases}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
          className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-center text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
          aria-label={`Cases of ${line.name}`}
        />
        {qty !== line.qtyCases && (
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "..." : t("update")}
          </button>
        )}
      </form>

      <button
        type="button"
        disabled={removing}
        onClick={() => startRemove(() => removeCartLine(line.itemId))}
        className="text-sm text-red-600 hover:underline disabled:opacity-50"
      >
        {t("remove")}
      </button>
    </div>
  );
}
