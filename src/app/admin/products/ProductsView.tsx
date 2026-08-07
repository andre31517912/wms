"use client";

import { useI18n } from "@/lib/i18n";
import { ProductsExplorer, type ExplorerProduct } from "./ProductsExplorer";

export function ProductsView({ products }: { products: ExplorerProduct[] }) {
  const { t } = useI18n();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">
        {t("productsAndItems")}
      </h1>
      <ProductsExplorer products={products} />
    </div>
  );
}
