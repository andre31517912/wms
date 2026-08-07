"use client";

import Link from "next/link";
import { useI18n, type TKey } from "@/lib/i18n";
import { CustomerStatusButtons } from "./CustomerStatusButtons";

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-500/20 text-amber-400",
  APPROVED: "bg-emerald-500/20 text-emerald-400",
  DISABLED: "bg-gray-500/20 text-gray-400",
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
      <h1 className="mb-6 text-2xl font-semibold">
        {t("customers")}
      </h1>
      {customers.length === 0 ? (
        <p className="text-sm text-admin-text-muted">{t("noCustomersYet")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-admin-surface ring-1 ring-white/5">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-admin-border text-xs uppercase text-admin-text-muted">
              <tr>
                <th className="px-4 py-3">{t("name")}</th>
                <th className="px-4 py-3">{t("email")}</th>
                <th className="px-4 py-3">{t("status")}</th>
                <th className="px-4 py-3">{t("registered")}</th>
                <th className="px-4 py-3">{t("history")}</th>
                <th className="px-4 py-3 text-right">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border-subtle">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-admin-surface-hover">
                  <td className="px-4 py-3 font-medium">
                    {c.name}
                  </td>
                  <td className="px-4 py-3 text-admin-text-secondary">{c.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[c.accountStatus]}`}
                    >
                      {t(STATUS_KEY[c.accountStatus])}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-admin-text-muted">
                    {c.createdAtLabel}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders?customer=${c.id}`}
                      className="text-xs text-admin-accent hover:underline"
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
