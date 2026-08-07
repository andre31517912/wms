"use client";

import Link from "next/link";
import { useMemo, useState, useTransition, useActionState } from "react";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  type ActionState,
} from "../actions";
import { formatDims, stockLevel } from "@/lib/display";
import { useI18n, type TKey } from "@/lib/i18n";

export type ExplorerItem = {
  id: string;
  sku: string | null;
  name: string;
  detail: string | null;
  piecesPerCase: number;
  caseLengthCm: number | null;
  caseWidthCm: number | null;
  caseHeightCm: number | null;
  minOrderCases: number;
  stockCases: number;
  lowStockThreshold: number;
  isActive: boolean;
};

export type ExplorerProduct = {
  id: string;
  name: string;
  sortOrder: number;
  items: ExplorerItem[];
};

const LEVEL_BADGE = {
  in_stock: "bg-emerald-500/20 text-emerald-400",
  low: "bg-amber-500/20 text-amber-400",
  out: "bg-red-500/20 text-red-400",
} as const;

const LEVEL_KEY: Record<keyof typeof LEVEL_BADGE, TKey> = {
  in_stock: "inStock",
  low: "lowStock",
  out: "outOfStock",
};

const inputCls =
  "rounded-lg border border-admin-input-border bg-admin-input-bg px-3 py-1.5 text-sm text-admin-text focus:border-admin-accent focus:outline-none";

export function ProductsExplorer({ products }: { products: ExplorerProduct[] }) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = useState(false);

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  const visible = useMemo(() => {
    if (!searching) return products.map((p) => ({ product: p, items: p.items }));
    const result: { product: ExplorerProduct; items: ExplorerItem[] }[] = [];
    for (const p of products) {
      if (p.name.toLowerCase().includes(q)) {
        result.push({ product: p, items: p.items });
        continue;
      }
      const matched = p.items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.sku ?? "").toLowerCase().includes(q) ||
          (i.detail ?? "").toLowerCase().includes(q)
      );
      if (matched.length > 0) result.push({ product: p, items: matched });
    }
    return result;
  }, [products, q, searching]);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className={`${inputCls} w-72`}
        />
        <button
          type="button"
          onClick={() => setShowAdd((s) => !s)}
          className="rounded-lg border border-admin-accent px-4 py-1.5 text-sm font-medium text-admin-accent hover:bg-admin-accent/10"
        >
          {showAdd ? t("close") : t("addProduct")}
        </button>
        <Link
          href="/admin/items/new"
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          + {t("addItem")}
        </Link>
      </div>

      {showAdd && (
        <div className="mb-4 rounded-xl bg-admin-surface p-4 ring-1 ring-white/5">
          <NewProductForm onCreated={() => setShowAdd(false)} />
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-sm text-admin-text-muted">
          {searching ? t("noSearchMatch") : t("noProductsYet")}
        </p>
      ) : (
        <div className="space-y-2">
          {visible.map(({ product, items }) => (
            <ProductSection
              key={product.id}
              product={product}
              items={items}
              open={searching || expanded.has(product.id)}
              onToggle={() => toggle(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NewProductForm({ onCreated }: { onCreated: () => void }) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await createProduct(prev, formData);
      if (result && "success" in result) onCreated();
      return result;
    },
    null
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs text-admin-text-muted">{t("name")}</label>
        <input name="name" type="text" required className={`${inputCls} w-64`} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-admin-text-muted">{t("sortOrder")}</label>
        <input
          name="sortOrder"
          type="number"
          defaultValue={0}
          min={0}
          className={`${inputCls} w-24`}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {t("add")}
      </button>
      {state && "error" in state && (
        <p className="w-full text-sm text-red-400">{state.error}</p>
      )}
    </form>
  );
}

function ProductSection({
  product,
  items,
  open,
  onToggle,
}: {
  product: ExplorerProduct;
  items: ExplorerItem[];
  open: boolean;
  onToggle: () => void;
}) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const updateWithId = updateProduct.bind(null, product.id);
  const [state, formAction, saving] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await updateWithId(prev, formData);
      if (result && "success" in result) setEditing(false);
      return result;
    },
    null
  );

  const onDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteProduct(product.id);
      if (result && "error" in result) setError(result.error);
    });
  };

  return (
    <div className="rounded-xl bg-admin-surface ring-1 ring-white/5">
      <div className="flex items-center justify-between px-4 py-3">
        {editing ? (
          <form action={formAction} className="flex flex-1 flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs text-admin-text-muted">{t("name")}</label>
              <input
                name="name"
                type="text"
                required
                defaultValue={product.name}
                className={`${inputCls} w-64`}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-admin-text-muted">{t("sort")}</label>
              <input
                name="sortOrder"
                type="number"
                defaultValue={product.sortOrder}
                min={0}
                className={`${inputCls} w-24`}
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {t("save")}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-admin-input-border px-4 py-1.5 text-sm text-admin-text-secondary hover:bg-admin-surface-hover"
            >
              {t("cancel")}
            </button>
            {state && "error" in state && (
              <p className="w-full text-sm text-red-400">{state.error}</p>
            )}
          </form>
        ) : (
          <button
            type="button"
            onClick={onToggle}
            className="flex flex-1 items-center gap-3 text-left"
          >
            <span
              className={`text-admin-text-muted transition-transform ${open ? "rotate-90" : ""}`}
            >
              ▶
            </span>
            <span className="font-medium">{product.name}</span>
            <span className="rounded-full bg-admin-surface-hover px-2 py-0.5 text-xs text-admin-text-secondary">
              {t("nItemsCount", { n: product.items.length })}
            </span>
          </button>
        )}
        {!editing && (
          <span className="ml-3 inline-flex items-center gap-2">
            {error && <span className="text-xs text-red-400">{error}</span>}
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg border border-admin-input-border px-3 py-1 text-xs text-admin-text-secondary hover:bg-admin-surface-hover"
            >
              {t("edit")}
            </button>
            <button
              type="button"
              disabled={pending || product.items.length > 0}
              onClick={onDelete}
              title={
                product.items.length > 0
                  ? t("moveOrDeleteFirst")
                  : undefined
              }
              className="rounded-lg border border-red-500/50 px-3 py-1 text-xs text-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("delete_")}
            </button>
          </span>
        )}
      </div>

      {open && (
        <div className="border-t border-admin-border-subtle">
          {items.length === 0 ? (
            <p className="px-4 py-3 text-sm text-admin-text-muted">
              {t("noItemsUnderProduct")}
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-admin-border-subtle text-xs uppercase text-admin-text-muted">
                <tr>
                  <th className="px-4 py-2">{t("sku")}</th>
                  <th className="px-4 py-2">{t("item")}</th>
                  <th className="px-4 py-2 text-right">{t("piecesPerCase")}</th>
                  <th className="px-4 py-2 text-right">{t("caseDimsCm")}</th>
                  <th className="px-4 py-2 text-right">{t("minOrder")}</th>
                  <th className="px-4 py-2 text-right">{t("stockCases")}</th>
                  <th className="px-4 py-2">{t("status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border-subtle">
                {items.map((item) => {
                  const level = stockLevel(item.stockCases, item.lowStockThreshold);
                  return (
                    <tr key={item.id} className={`hover:bg-admin-surface-hover ${item.isActive ? "" : "opacity-50"}`}>
                      <td className="px-4 py-2 font-mono text-xs text-admin-text-muted">
                        {item.sku ?? "—"}
                      </td>
                      <td className="px-4 py-2">
                        <Link
                          href={`/admin/items/${item.id}`}
                          className="font-medium text-admin-accent hover:underline"
                        >
                          {item.name}
                        </Link>
                        {item.detail && (
                          <p className="text-xs text-admin-text-muted">{item.detail}</p>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right text-admin-text-secondary">
                        {item.piecesPerCase}
                      </td>
                      <td className="px-4 py-2 text-right text-admin-text-secondary whitespace-nowrap">
                        {formatDims(item.caseLengthCm, item.caseWidthCm, item.caseHeightCm)}
                      </td>
                      <td className="px-4 py-2 text-right text-admin-text-secondary">
                        {item.minOrderCases}
                      </td>
                      <td className="px-4 py-2 text-right font-medium">
                        {item.stockCases}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${LEVEL_BADGE[level]}`}
                        >
                          {item.isActive ? t(LEVEL_KEY[level]) : t("inactive")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
