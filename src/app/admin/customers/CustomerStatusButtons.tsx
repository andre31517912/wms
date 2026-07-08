"use client";

import { useTransition } from "react";
import { setCustomerStatus } from "../actions";

export function CustomerStatusButtons({
  userId,
  status,
}: {
  userId: string;
  status: "PENDING" | "APPROVED" | "DISABLED";
}) {
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
          {status === "PENDING" ? "Approve" : "Re-enable"}
        </button>
      )}
      {status !== "DISABLED" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => set("DISABLED")}
          className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          Disable
        </button>
      )}
    </span>
  );
}
