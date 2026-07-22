"use client";

import { useI18n } from "@/lib/i18n";
import { createItem } from "../../actions";
import { ItemForm } from "../ItemForm";

export function NewItemView({
  products,
}: {
  products: { id: string; label: string }[];
}) {
  const { t } = useI18n();

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">
        {t("addItem")}
      </h1>
      {products.length === 0 ? (
        <p className="text-sm text-gray-500">{t("createProductFirst")}</p>
      ) : (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <ItemForm
            action={createItem}
            products={products}
            submitLabel={t("createItem")}
          />
        </div>
      )}
    </div>
  );
}
