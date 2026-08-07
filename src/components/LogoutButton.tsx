"use client";

import { useTransition } from "react";
import { logout } from "@/app/(auth)/actions";
import { useI18n } from "@/lib/i18n";

export function LogoutButton() {
  const [pending, startTransition] = useTransition();
  const { t } = useI18n();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => logout())}
      className="rounded-lg border border-admin-input-border px-3 py-1.5 text-sm text-admin-text-secondary hover:bg-admin-surface-hover disabled:opacity-50"
    >
      {pending ? t("signingOut") : t("signOut")}
    </button>
  );
}
