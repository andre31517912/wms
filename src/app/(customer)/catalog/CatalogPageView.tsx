"use client";

import { useI18n } from "@/lib/i18n";
import { CatalogGrid, type CatalogCard } from "./CatalogGrid";

export function CatalogPageView({ cards }: { cards: CatalogCard[] }) {
  const { t } = useI18n();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">{t("catalog")}</h1>
      <CatalogGrid cards={cards} />
    </div>
  );
}
