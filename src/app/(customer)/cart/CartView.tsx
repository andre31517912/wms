"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { CartLineRow } from "./CartLineRow";
import { CheckoutForm } from "./CheckoutForm";

export type CartLineData = {
  itemId: string;
  qtyCases: number;
  name: string;
  productName: string;
  sku: string | null;
  minOrderCases: number;
  stockCases: number;
  isActive: boolean;
  imageId: string | null;
};

export function CartView({
  lines,
  totalCases,
  totalWeightKg,
}: {
  lines: CartLineData[];
  totalCases: number;
  totalWeightKg: number;
}) {
  const { t } = useI18n();

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">{t("cart")}</h1>

      {lines.length === 0 ? (
        <p className="text-sm text-gray-500">
          {t("cartEmpty")}{" "}
          <Link href="/catalog" className="text-blue-600 hover:underline">
            {t("browseTheCatalog")}
          </Link>
          .
        </p>
      ) : (
        <>
          <div className="mb-6 space-y-3">
            {lines.map((line) => (
              <CartLineRow key={line.itemId} line={line} />
            ))}
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex justify-between text-sm text-gray-600">
              <span>
                {t("nItems", { n: lines.length })} ·{" "}
                <strong className="text-gray-900">
                  {t("nCases", { n: totalCases })}
                </strong>
              </span>
              {totalWeightKg > 0 && (
                <span>{t("kgTotal", { n: totalWeightKg.toFixed(1) })}</span>
              )}
            </div>
            <CheckoutForm />
          </div>
        </>
      )}
    </div>
  );
}
