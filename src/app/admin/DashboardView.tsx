"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useI18n, type TKey } from "@/lib/i18n";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import type { OrderStatus } from "@/generated/prisma/client";

type InventoryItem = {
  id: string;
  name: string;
  sku: string | null;
  productName: string;
  stockCases: number;
  lowStockThreshold: number;
  piecesPerCase: number;
  updatedAt: string;
};

type RecentOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  customerName: string;
  totalCases: number;
  createdAt: string;
};

type StockAlert = {
  id: string;
  name: string;
  productName: string;
  stockCases: number;
  lowStockThreshold: number;
};

type Props = {
  stats: {
    totalInventory: number;
    lowStock: number;
    activeOrders: number;
    pendingApprovals: number;
  };
  inventoryItems: InventoryItem[];
  recentOrders: RecentOrder[];
  stockAlerts: StockAlert[];
  productNames: string[];
};

const STAT_CARDS: {
  key: TKey;
  field: keyof Props["stats"];
  href: string;
  alert?: (v: number) => boolean;
  icon: React.ReactNode;
}[] = [
  {
    key: "activeItems",
    field: "totalInventory",
    href: "/admin/products",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
      </svg>
    ),
  },
  {
    key: "lowStock",
    field: "lowStock",
    href: "/admin/products",
    alert: (v) => v > 0,
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
    ),
  },
  {
    key: "pendingOrders",
    field: "activeOrders",
    href: "/admin/orders",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
      </svg>
    ),
  },
  {
    key: "pendingApprovals",
    field: "pendingApprovals",
    href: "/admin/customers",
    alert: (v) => v > 0,
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
  },
];

type StockLevel = "healthy" | "low" | "critical";

function getStockLevel(stock: number, threshold: number): StockLevel {
  if (stock <= 0) return "critical";
  if (stock <= threshold) return "low";
  return "healthy";
}

export function DashboardView({
  stats,
  inventoryItems,
  recentOrders,
  stockAlerts,
  productNames,
}: Props) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState<StockLevel | "">("");

  const maxStock = useMemo(
    () => Math.max(...inventoryItems.map((i) => i.stockCases), 1),
    [inventoryItems],
  );

  const filtered = useMemo(() => {
    let list = inventoryItems;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.sku ?? "").toLowerCase().includes(q) ||
          i.productName.toLowerCase().includes(q),
      );
    }
    if (productFilter) {
      list = list.filter((i) => i.productName === productFilter);
    }
    if (levelFilter) {
      list = list.filter(
        (i) => getStockLevel(i.stockCases, i.lowStockThreshold) === levelFilter,
      );
    }
    return list;
  }, [inventoryItems, search, productFilter, levelFilter]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">{t("dashboard")}</h1>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STAT_CARDS.map((card) => {
          const value = stats[card.field];
          const isAlert = card.alert?.(value);
          return (
            <Link
              key={card.field}
              href={card.href}
              className="flex items-center gap-4 rounded-xl bg-admin-surface p-5 ring-1 ring-white/5 transition hover:bg-admin-surface-hover"
            >
              <div className={`rounded-lg p-2.5 ${isAlert ? "bg-amber-500/20 text-amber-400" : "bg-admin-accent/15 text-admin-accent"}`}>
                {card.icon}
              </div>
              <div>
                <p className="text-sm text-admin-text-secondary">{t(card.key)}</p>
                <p className={`text-2xl font-bold ${isAlert ? "text-amber-400" : ""}`}>
                  {value}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main content: table + side panels */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        {/* Inventory table */}
        <div className="rounded-xl bg-admin-surface ring-1 ring-white/5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-admin-border px-5 py-4">
            <h2 className="text-lg font-medium">{t("inventory")}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="rounded-lg border border-admin-input-border bg-admin-input-bg px-3 py-1.5 text-sm text-admin-text placeholder:text-admin-text-muted focus:border-admin-accent focus:outline-none"
              />
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="rounded-lg border border-admin-input-border bg-admin-input-bg px-3 py-1.5 text-sm text-admin-text focus:border-admin-accent focus:outline-none"
              >
                <option value="">{t("allProducts")}</option>
                {productNames.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value as StockLevel | "")}
                className="rounded-lg border border-admin-input-border bg-admin-input-bg px-3 py-1.5 text-sm text-admin-text focus:border-admin-accent focus:outline-none"
              >
                <option value="">{t("allLevels")}</option>
                <option value="healthy">{t("healthy")}</option>
                <option value="low">{t("lowStock")}</option>
                <option value="critical">{t("outOfStock")}</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-admin-border text-xs uppercase text-admin-text-muted">
                <tr>
                  <th className="px-5 py-3">{t("item")}</th>
                  <th className="px-5 py-3">{t("sku")}</th>
                  <th className="px-5 py-3">{t("product")}</th>
                  <th className="px-5 py-3">{t("stockCases")}</th>
                  <th className="px-5 py-3 text-right">{t("piecesPerCase")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border-subtle">
                {filtered.map((item) => {
                  const level = getStockLevel(item.stockCases, item.lowStockThreshold);
                  const barPct = Math.min(100, (item.stockCases / maxStock) * 100);
                  const barColor =
                    level === "critical"
                      ? "bg-red-500"
                      : level === "low"
                        ? "bg-amber-500"
                        : "bg-emerald-500";
                  return (
                    <tr key={item.id} className="hover:bg-admin-surface-hover">
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/items/${item.id}`}
                          className="font-medium text-admin-accent hover:underline"
                        >
                          {item.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-admin-text-muted">
                        {item.sku ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-admin-text-secondary">
                        {item.productName}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-24 rounded-full bg-admin-border">
                            <div
                              className={`h-2 rounded-full ${barColor}`}
                              style={{ width: `${barPct}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{item.stockCases}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right text-admin-text-secondary">
                        {item.piecesPerCase}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-admin-text-muted">
                      {t("noSearchMatch")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side panels */}
        <div className="space-y-6">
          {/* Recent Orders */}
          <div className="rounded-xl bg-admin-surface ring-1 ring-white/5">
            <div className="flex items-center justify-between border-b border-admin-border px-5 py-4">
              <h2 className="text-sm font-medium">{t("recentOrders")}</h2>
              <Link href="/admin/orders" className="text-xs text-admin-accent hover:underline">
                {t("viewAll")}
              </Link>
            </div>
            <ul className="divide-y divide-admin-border-subtle">
              {recentOrders.map((o) => (
                <li key={o.id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="text-sm font-medium text-admin-accent hover:underline"
                    >
                      {o.orderNumber}
                    </Link>
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-admin-text-muted">
                    <span>{o.customerName}</span>
                    <span>{o.totalCases} {t("casesUnit")}</span>
                  </div>
                </li>
              ))}
              {recentOrders.length === 0 && (
                <li className="px-5 py-6 text-center text-sm text-admin-text-muted">
                  {t("noOrdersMatch")}
                </li>
              )}
            </ul>
          </div>

          {/* Stock Alerts */}
          {stockAlerts.length > 0 && (
            <div className="rounded-xl bg-admin-surface ring-1 ring-white/5">
              <div className="border-b border-admin-border px-5 py-4">
                <h2 className="text-sm font-medium">{t("stockAlerts")}</h2>
              </div>
              <ul className="divide-y divide-admin-border-subtle">
                {stockAlerts.map((a) => (
                  <li key={a.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <Link
                        href={`/admin/items/${a.id}`}
                        className="text-sm font-medium text-admin-text hover:text-admin-accent"
                      >
                        {a.name}
                      </Link>
                      <p className="text-xs text-admin-text-muted">{a.productName}</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        a.stockCases <= 0
                          ? "bg-red-500/20 text-red-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {a.stockCases} {t("casesUnit")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
