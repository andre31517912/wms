"use client";

import { useState, useTransition } from "react";
import { deleteItem } from "../../actions";
import { useI18n } from "@/lib/i18n";

export function DeleteItemButton({ itemId }: { itemId: string }) {
  const { t } = useI18n();
  const [arming, setArming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!arming) {
    return (
      <button
        type="button"
        onClick={() => setArming(true)}
        className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
      >
        {t("deleteItem")}
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await deleteItem(itemId);
            if (result && "error" in result) setError(result.error);
          })
        }
        className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        {pending ? t("deleting") : t("confirmDelete")}
      </button>
      <button
        type="button"
        onClick={() => {
          setArming(false);
          setError(null);
        }}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
      >
        {t("cancel")}
      </button>
    </span>
  );
}
