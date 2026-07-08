"use client";

import { useActionState } from "react";
import { adjustStock } from "../../actions";

const inputCls =
  "rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none";

export function StockAdjustForm({ productId }: { productId: string }) {
  const [state, formAction, pending] = useActionState(adjustStock, null);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="productId" value={productId} />
      <div>
        <label className="mb-1 block text-xs text-gray-500">
          Cases (+ receive / − remove)
        </label>
        <input
          name="deltaCases"
          type="number"
          required
          placeholder="e.g. 50 or -3"
          className={`${inputCls} w-36`}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-gray-500">Reason</label>
        <select name="reason" required defaultValue="RECEIVING" className={inputCls}>
          <option value="RECEIVING">Receiving</option>
          <option value="CORRECTION">Correction</option>
          <option value="DAMAGE">Damage</option>
        </select>
      </div>
      <div className="min-w-48 flex-1">
        <label className="mb-1 block text-xs text-gray-500">Note</label>
        <input name="note" type="text" className={`${inputCls} w-full`} />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        Apply
      </button>
      {state && "error" in state && (
        <p className="w-full text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state && "success" in state && (
        <p className="w-full text-sm text-green-600">{state.success}</p>
      )}
    </form>
  );
}
