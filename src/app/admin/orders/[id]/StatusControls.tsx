"use client";

import { useState, useTransition } from "react";
import type { OrderStatus } from "@/generated/prisma/client";
import { useI18n } from "@/lib/i18n";
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
  const { t } = useI18n();
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
        className="rounded-lg border border-admin-input-border bg-admin-input-bg px-3 py-1.5 text-sm text-admin-text focus:border-admin-accent focus:outline-none"
      >
        <option value={status}>
          {t(ORDER_STATUS_LABEL[status])} {t("current")}
        </option>
        {nexts.map((s) => (
          <option key={s} value={s}>
            {t(ORDER_STATUS_LABEL[s])}
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
            ? t("updating")
            : cancelling
              ? t("cancelOrderRestore")
              : reinstating
                ? t("reinstateOrder")
                : t("setTo", { status: t(ORDER_STATUS_LABEL[selected]).toLowerCase() })}
        </button>
      )}

      {cancelling && changed && !pending && (
        <p className="text-xs text-amber-400">{t("cancellingNote")}</p>
      )}
      {reinstating && !pending && (
        <p className="text-xs text-amber-400">{t("reinstatingNote")}</p>
      )}
      {error && <p className="w-full text-sm text-red-400">{error}</p>}
    </div>
  );
}
