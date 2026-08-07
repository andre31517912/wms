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
      <h1 className="mb-6 text-2xl font-semibold">
        {t("addItem")}
      </h1>
      {products.length === 0 ? (
        <p className="text-sm text-admin-text-muted">{t("createProductFirst")}</p>
      ) : (
        <div className="rounded-xl bg-admin-surface p-6 ring-1 ring-white/5">
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
