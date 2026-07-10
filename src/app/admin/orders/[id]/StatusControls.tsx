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
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const nexts = ORDER_STATUS_TRANSITIONS[status];
  if (nexts.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        This order is {ORDER_STATUS_LABEL[status].toLowerCase()} — no further
        changes.
      </p>
    );
  }

  const apply = (next: OrderStatus) => {
    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, next);
      if (result && "error" in result) setError(result.error);
      setConfirmingCancel(false);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {nexts
        .filter((s) => s !== "CANCELLED")
        .map((s) => (
          <button
            key={s}
            type="button"
            disabled={pending}
            onClick={() => apply(s)}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Mark {ORDER_STATUS_LABEL[s].toLowerCase()}
          </button>
        ))}

      {nexts.includes("CANCELLED") &&
        (confirmingCancel ? (
          <span className="inline-flex items-center gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => apply("CANCELLED")}
              className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              Confirm cancel (restores stock)
            </button>
            <button
              type="button"
              onClick={() => setConfirmingCancel(false)}
              className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
            >
              Keep order
            </button>
          </span>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirmingCancel(true)}
            className="rounded-lg border border-red-300 px-4 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Cancel order
          </button>
        ))}

      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </div>
  );
}
