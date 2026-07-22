"use client";

import Link from "next/link";
import { useI18n, LangToggle } from "@/lib/i18n";
import { LogoutButton } from "./LogoutButton";

export function CustomerNav({
  userName,
  isCustomer,
  isAdmin,
  cartCount,
}: {
  userName: string;
  isCustomer: boolean;
  isAdmin: boolean;
  cartCount: number;
}) {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <nav className="flex items-center gap-6">
          <Link href="/catalog" className="text-sm font-semibold text-gray-900">
            {t("orderPortal")}
          </Link>
          <Link
            href="/catalog"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            {t("catalog")}
          </Link>
          {isCustomer && (
            <>
              <Link
                href="/orders"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {t("myOrders")}
              </Link>
              <Link
                href="/cart"
                className="relative text-sm text-gray-600 hover:text-gray-900"
              >
                {t("cart")}
                {cartCount > 0 && (
                  <span className="absolute -right-4 -top-2 rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            </>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              className="text-sm text-blue-600 hover:underline"
            >
              {t("backToAdmin")}
            </Link>
          )}
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
