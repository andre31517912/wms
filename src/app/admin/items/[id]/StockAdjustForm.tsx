"use client";

import { useActionState } from "react";
import { adjustStock } from "../../actions";
import { useI18n } from "@/lib/i18n";

const inputCls =
  "rounded-lg border border-admin-input-border bg-admin-input-bg px-3 py-1.5 text-sm text-admin-text focus:border-admin-accent focus:outline-none";

export function StockAdjustForm({ itemId }: { itemId: string }) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(adjustStock, null);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="itemId" value={itemId} />
      <div>
        <label className="mb-1 block text-xs text-admin-text-muted">
          {t("casesReceiveRemove")}
        </label>
        <input
          name="deltaCases"
          type="number"
          required
          placeholder={t("casesPlaceholder")}
          className={`${inputCls} w-36`}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-admin-text-muted">{t("reason")}</label>
        <select name="reason" required defaultValue="RECEIVING" className={inputCls}>
          <option value="RECEIVING">{t("receiving")}</option>
          <option value="CORRECTION">{t("correction")}</option>
          <option value="DAMAGE">{t("damage")}</option>
        </select>
      </div>
      <div className="min-w-48 flex-1">
        <label className="mb-1 block text-xs text-admin-text-muted">{t("note")}</label>
        <input name="note" type="text" className={`${inputCls} w-full`} />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {t("apply")}
      </button>
      {state && "error" in state && (
        <p className="w-full text-sm text-red-400" role="alert">
          {state.error}
        </p>
      )}
      {state && "success" in state && (
        <p className="w-full text-sm text-emerald-400">{state.success}</p>
      )}
    </form>
  );
}
