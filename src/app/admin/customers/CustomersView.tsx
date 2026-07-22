"use client";

import Link from "next/link";
import { useI18n, type TKey } from "@/lib/i18n";
import { CustomerStatusButtons } from "./CustomerStatusButtons";

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  DISABLED: "bg-gray-200 text-gray-600",
};

const STATUS_KEY: Record<string, TKey> = {
  PENDING: "accountPENDING",
  APPROVED: "accountAPPROVED",
  DISABLED: "accountDISABLED",
};

export type CustomerRow = {
  id: string;
  name: string;
  email: string;
  accountStatus: "PENDING" | "APPROVED" | "DISABLED";
  createdAtLabel: string;
};

export function CustomersView({ customers }: { customers: CustomerRow[] }) {
  const { t } = useI18n();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">
        {t("customers")}
      </h1>
      {customers.length === 0 ? (
        <p className="text-sm text-gray-500">{t("noCustomersYet")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">{t("name")}</th>
                <th className="px-4 py-3">{t("email")}</th>
                <th className="px-4 py-3">{t("status")}</th>
                <th className="px-4 py-3">{t("registered")}</th>
                <th className="px-4 py-3">{t("history")}</th>
                <th className="px-4 py-3 text-right">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {c.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[c.accountStatus]}`}
                    >
                      {t(STATUS_KEY[c.accountStatus])}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {c.createdAtLabel}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders?customer=${c.id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {t("orders")}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <CustomerStatusButtons
                      userId={c.id}
                      status={c.accountStatus}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
