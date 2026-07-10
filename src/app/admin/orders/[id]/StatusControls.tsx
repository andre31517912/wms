"use client";

import { useState, useTransition } from "react";
import type { OrderStatus } from "@/generated/prisma/client";
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TRANSITIONS,
} from "@/lib/orderStatus";
import { updateOrderStatus } from "../../actions";

export function StatusControls({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const [selected, setSelected] = useState<OrderStatus>(status);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const nexts = ORDER_STATUS_TRANSITIONS[status];

  const changed = selected !== status;
  const cancelling = selected === "CANCELLED";
  const reinstating = status === "CANCELLED" && changed;

  const apply = () => {
    if (!changed) return;
    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, selected);
      if (result && "error" in result) setError(result.error);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value as OrderStatus)}
        disabled={pending}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
      >
        <option value={status}>{ORDER_STATUS_LABEL[status]} (current)</option>
        {nexts.map((s) => (
          <option key={s} value={s}>
            {ORDER_STATUS_LABEL[s]}
          </option>
        ))}
      </select>

      {changed && (
        <button
          type="button"
          disabled={pending}
          onClick={apply}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50 ${
            cancelling
              ? "bg-red-600 hover:bg-red-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {pending
            ? "Updating..."
            : cancelling
              ? "Cancel order (restores stock)"
              : reinstating
                ? "Reinstate order (re-deducts stock)"
                : `Set to ${ORDER_STATUS_LABEL[selected].toLowerCase()}`}
        </button>
      )}

      {cancelling && changed && !pending && (
        <p className="text-xs text-amber-600">
          Cancelling returns all cases in this order to stock.
        </p>
      )}
      {reinstating && !pending && (
        <p className="text-xs text-amber-600">
          Reinstating takes the cases back out of stock — it will fail if
          stock has since run out.
        </p>
      )}
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </div>
  );
}
