"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { ItemRow, type CatalogItem } from "./ItemRow";

export function ProductCatalogView({
  productName,
  items,
  canOrder,
}: {
  productName: string;
  items: CatalogItem[];
  canOrder: boolean;
}) {
  const { t } = useI18n();

  return (
    <div>
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/catalog" className="text-blue-600 hover:underline">
          {t("catalog")}
        </Link>{" "}
        / {productName}
      </nav>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">
        {productName}
      </h1>

      <div className="space-y-3">
        {items.map((item) => (
          <ItemRow key={item.id} canOrder={canOrder} item={item} />
        ))}
      </div>
    </div>
  );
}
