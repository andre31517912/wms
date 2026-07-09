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
  in_stock: "bg-green-100 text-green-800",
  low: "bg-amber-100 text-amber-800",
  out: "bg-red-100 text-red-800",
} as const;

const LEVEL_LABEL = {
  in_stock: "In stock",
  low: "Low",
  out: "Out",
} as const;

const inputCls =
  "rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none";

export function ProductsExplorer({ products }: { products: ExplorerProduct[] }) {
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
          placeholder="Search products, items, SKUs..."
          className={`${inputCls} w-72`}
        />
        <button
          type="button"
          onClick={() => setShowAdd((s) => !s)}
          className="rounded-lg border border-blue-600 px-4 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50"
        >
          {showAdd ? "Close" : "+ Add product"}
        </button>
        <Link
          href="/admin/items/new"
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Add item
        </Link>
      </div>

      {showAdd && (
        <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
          <NewProductForm onCreated={() => setShowAdd(false)} />
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-sm text-gray-500">
          {searching
            ? "Nothing matches your search."
            : "No products yet — add one above or use the bulk import."}
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
        <label className="mb-1 block text-xs text-gray-500">Name</label>
        <input name="name" type="text" required className={`${inputCls} w-64`} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-gray-500">Sort order</label>
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
        Add
      </button>
      {state && "error" in state && (
        <p className="w-full text-sm text-red-600">{state.error}</p>
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
    <div className="rounded-xl bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        {editing ? (
          <form action={formAction} className="flex flex-1 flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-500">Name</label>
              <input
                name="name"
                type="text"
                required
                defaultValue={product.name}
                className={`${inputCls} w-64`}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Sort</label>
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
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            {state && "error" in state && (
              <p className="w-full text-sm text-red-600">{state.error}</p>
            )}
          </form>
        ) : (
          <button
            type="button"
            onClick={onToggle}
            className="flex flex-1 items-center gap-3 text-left"
          >
            <span
              className={`text-gray-400 transition-transform ${open ? "rotate-90" : ""}`}
            >
              ▶
            </span>
            <span className="font-medium text-gray-900">{product.name}</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {product.items.length} item{product.items.length === 1 ? "" : "s"}
            </span>
          </button>
        )}
        {!editing && (
          <span className="ml-3 inline-flex items-center gap-2">
            {error && <span className="text-xs text-red-600">{error}</span>}
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-100"
            >
              Edit
            </button>
            <button
              type="button"
              disabled={pending || product.items.length > 0}
              onClick={onDelete}
              title={
                product.items.length > 0
                  ? "Move or delete its items first"
                  : undefined
              }
              className="rounded-lg border border-red-300 px-3 py-1 text-xs text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Delete
            </button>
          </span>
        )}
      </div>

      {open && (
        <div className="border-t border-gray-100">
          {items.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-400">
              No items under this product yet.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2">SKU</th>
                  <th className="px-4 py-2">Item</th>
                  <th className="px-4 py-2 text-right">Pcs/case</th>
                  <th className="px-4 py-2 text-right">Case dims (cm)</th>
                  <th className="px-4 py-2 text-right">Min order</th>
                  <th className="px-4 py-2 text-right">Stock (cases)</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => {
                  const level = stockLevel(item.stockCases, item.lowStockThreshold);
                  return (
                    <tr key={item.id} className={item.isActive ? "" : "opacity-50"}>
                      <td className="px-4 py-2 font-mono text-xs text-gray-600">
                        {item.sku ?? "—"}
                      </td>
                      <td className="px-4 py-2">
                        <Link
                          href={`/admin/items/${item.id}`}
                          className="font-medium text-blue-700 hover:underline"
                        >
                          {item.name}
                        </Link>
                        {item.detail && (
                          <p className="text-xs text-gray-400">{item.detail}</p>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-600">
                        {item.piecesPerCase}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-600 whitespace-nowrap">
                        {formatDims(item.caseLengthCm, item.caseWidthCm, item.caseHeightCm)}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-600">
                        {item.minOrderCases}
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-gray-900">
                        {item.stockCases}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${LEVEL_BADGE[level]}`}
                        >
                          {item.isActive ? LEVEL_LABEL[level] : "Inactive"}
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
