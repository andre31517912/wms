"use client";

import { useTransition } from "react";
import { useI18n } from "@/lib/i18n";
import { setCustomerStatus } from "../actions";

export function CustomerStatusButtons({
  userId,
  status,
}: {
  userId: string;
  status: "PENDING" | "APPROVED" | "DISABLED";
}) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();

  const set = (next: "APPROVED" | "DISABLED") =>
    startTransition(() => setCustomerStatus(userId, next));

  return (
    <span className="inline-flex gap-2">
      {status !== "APPROVED" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => set("APPROVED")}
          className="rounded-lg bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {status === "PENDING" ? t("approve") : t("enable")}
        </button>
      )}
      {status !== "DISABLED" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => set("DISABLED")}
          className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          {t("disable")}
        </button>
      )}
    </span>
  );
}
