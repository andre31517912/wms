"use client";

import Link from "next/link";
import { useI18n, LangToggle } from "@/lib/i18n";
import { LogoutButton } from "./LogoutButton";

export function AdminNav({ userName }: { userName: string }) {
  const { t } = useI18n();
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <nav className="flex items-center gap-6">
          <Link href="/admin" className="text-sm font-semibold text-gray-900">
            {t("wmsAdmin")}
          </Link>
          <Link
            href="/admin/orders"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            {t("orders")}
          </Link>
          <Link
            href="/admin/customers"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            {t("customers")}
          </Link>
          <Link
            href="/admin/products"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            {t("productsAndItems")}
          </Link>
          <Link
            href="/admin/stock-history"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            {t("globalStockHistory")}
          </Link>
          <Link
            href="/admin/import"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            {t("import_")}
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <LangToggle />
          <span className="text-sm text-gray-500">{userName}</span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
