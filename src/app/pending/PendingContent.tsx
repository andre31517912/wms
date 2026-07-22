"use client";

import { useI18n } from "@/lib/i18n";
import { LogoutButton } from "@/components/LogoutButton";

export function PendingContent({ name }: { name: string }) {
  const { t } = useI18n();

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow">
        <h1 className="mb-2 text-2xl font-semibold text-gray-900">
          {t("accountPending")}
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          {t("pendingMessage", { name })}
        </p>
        <LogoutButton />
      </div>
    </main>
  );
}
