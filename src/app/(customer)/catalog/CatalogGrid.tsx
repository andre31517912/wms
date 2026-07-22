"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { StockLevel } from "@/lib/display";
import { useI18n, type TKey } from "@/lib/i18n";

export type CatalogCard = {
  id: string;
  name: string;
  itemCount: number;
  imageId: string | null;
  level: StockLevel;
  searchText: string;
};

const LEVEL_KEY: Record<StockLevel, TKey> = {
  in_stock: "inStock",
  low: "lowStock",
  out: "outOfStock",
};

const LEVEL_CLS: Record<StockLevel, string> = {
  in_stock: "bg-green-100 text-green-800",
  low: "bg-amber-100 text-amber-800",
  out: "bg-red-100 text-red-800",
};

export function CatalogGrid({ cards }: { cards: CatalogCard[] }) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const visible = useMemo(
    () => (q ? cards.filter((c) => c.searchText.includes(q)) : cards),
    [cards, q]
  );

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("searchCatalog")}
        className="mb-6 w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
      />

      {visible.length === 0 ? (
        <p className="text-sm text-gray-500">
          {q ? t("noSearchMatch") : t("catalogEmpty")}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((card) => (
            <Link
              key={card.id}
              href={`/catalog/${card.id}`}
              className="group overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="flex aspect-square items-center justify-center overflow-hidden bg-gray-100">
                {card.imageId ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={`/api/images/${card.imageId}`}
                    alt={card.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <span className="text-4xl text-gray-300">📦</span>
                )}
              </div>
              <div className="p-3">
                <p className="truncate font-medium text-gray-900">
                  {card.name}
                </p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {t("nSizes", { n: card.itemCount })}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${LEVEL_CLS[card.level]}`}
                  >
                    {t(LEVEL_KEY[card.level])}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
