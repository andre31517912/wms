"use client";

import Link from "next/link";
import { useI18n, type TKey } from "@/lib/i18n";

export type DashboardCardData = {
  key: TKey;
  value: number;
  href: string;
  alert?: boolean;
};

export function DashboardView({ cards }: { cards: DashboardCardData[] }) {
  const { t } = useI18n();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">
        {t("dashboard")}
      </h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.key}
            href={c.href}
            className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow"
          >
            <p className="text-sm text-gray-500">{t(c.key)}</p>
            <p
              className={`mt-1 text-3xl font-semibold ${c.alert ? "text-amber-600" : "text-gray-900"}`}
            >
              {c.value}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
