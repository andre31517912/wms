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
      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
    >
      {pending ? t("signingOut") : t("signOut")}
    </button>
  );
}
