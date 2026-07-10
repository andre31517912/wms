"use client";

import { useState, useActionState } from "react";
import type { StockLevel } from "@/lib/display";
import { addToCart, type CartActionState } from "../../actions";

export type CatalogItem = {
  id: string;
  name: string;
  detail: string | null;
  sku: string | null;
  piecesPerCase: number;
  dims: string;
  unitWeightG: number | null;
  minOrderCases: number;
  level: StockLevel;
  imageIds: string[];
};

const LEVEL_BADGE: Record<StockLevel, [string, string]> = {
  in_stock: ["In stock", "bg-green-100 text-green-800"],
  low: ["Low stock", "bg-amber-100 text-amber-800"],
  out: ["Out of stock", "bg-red-100 text-red-800"],
};

export function ItemRow({
  item,
  canOrder,
}: {
  item: CatalogItem;
  canOrder: boolean;
}) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [label, badgeCls] = LEVEL_BADGE[item.level];

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm sm:flex-row">
      <button
        type="button"
        onClick={() => item.imageIds.length > 0 && setLightbox(0)}
        className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-gray-100"
        aria-label={`View photos of ${item.name}`}
      >
        {item.imageIds.length > 0 ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/images/${item.imageIds[0]}`}
              alt={item.name}
              className="h-full w-full object-cover"
            />
            {item.imageIds.length > 1 && (
              <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                {item.imageIds.length} 📷
              </span>
            )}
          </>
        ) : (
          <span className="flex h-full w-full items-center justify-center text-3xl text-gray-300">
            📦
          </span>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-medium text-gray-900">{item.name}</h2>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeCls}`}
          >
            {label}
          </span>
        </div>
        {item.detail && (
          <p className="mt-0.5 text-sm text-gray-500">{item.detail}</p>
        )}
        <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-500 sm:grid-cols-4">
          {item.sku && (
            <div>
              <dt className="inline text-gray-400">SKU </dt>
              <dd className="inline font-mono">{item.sku}</dd>
            </div>
          )}
          <div>
            <dt className="inline text-gray-400">Pieces/case </dt>
            <dd className="inline">{item.piecesPerCase}</dd>
          </div>
          <div>
            <dt className="inline text-gray-400">Case </dt>
            <dd className="inline">{item.dims} cm</dd>
          </div>
          <div>
            <dt className="inline text-gray-400">Min order </dt>
            <dd className="inline">{item.minOrderCases} case(s)</dd>
          </div>
        </dl>
      </div>

      {canOrder && (
        <div className="flex items-center sm:w-64">
          {item.level === "out" ? (
            <p className="text-sm text-gray-400">Currently unavailable</p>
          ) : (
            <AddToCartForm itemId={item.id} minOrder={item.minOrderCases} />
          )}
        </div>
      )}

      {lightbox !== null && (
        <Lightbox
          imageIds={item.imageIds}
          index={lightbox}
          onIndex={setLightbox}
          onClose={() => setLightbox(null)}
          alt={item.name}
        />
      )}
    </div>
  );
}

function AddToCartForm({
  itemId,
  minOrder,
}: {
  itemId: string;
  minOrder: number;
}) {
  const [qty, setQty] = useState(minOrder);
  const [state, formAction, pending] = useActionState(
    async (prev: CartActionState, formData: FormData) => addToCart(prev, formData),
    null
  );

  return (
    <form action={formAction} className="w-full">
      <input type="hidden" name="itemId" value={itemId} />
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-lg border border-gray-300">
          <button
            type="button"
            onClick={() => setQty((v) => Math.max(minOrder, v - 1))}
            className="px-3 py-1.5 text-gray-600 hover:bg-gray-100"
            aria-label="Decrease"
          >
            −
          </button>
          <input
            name="qtyCases"
            type="number"
            min={minOrder}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
            className="w-16 border-x border-gray-300 py-1.5 text-center text-sm text-gray-900 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setQty((v) => v + 1)}
            className="px-3 py-1.5 text-gray-600 hover:bg-gray-100"
            aria-label="Increase"
          >
            +
          </button>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "Adding..." : "Add to cart"}
        </button>
      </div>
      <p className="mt-1 h-4 text-xs">
        {state && "error" in state && (
          <span className="text-red-600">{state.error}</span>
        )}
        {state && "success" in state && (
          <span className="text-green-600">{state.success}</span>
        )}
      </p>
    </form>
  );
}

function Lightbox({
  imageIds,
  index,
  onIndex,
  onClose,
  alt,
}: {
  imageIds: string[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  alt: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative max-h-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/images/${imageIds[index]}`}
          alt={alt}
          className="max-h-[80vh] rounded-xl object-contain"
        />
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-2 -top-2 rounded-full bg-white px-2.5 py-1 text-sm shadow"
          aria-label="Close"
        >
          ✕
        </button>
        {imageIds.length > 1 && (
          <div className="mt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onIndex((index - 1 + imageIds.length) % imageIds.length)}
              className="rounded-lg bg-white/90 px-3 py-1 text-sm shadow"
            >
              ← Prev
            </button>
            <span className="text-xs text-white">
              {index + 1} / {imageIds.length}
            </span>
            <button
              type="button"
              onClick={() => onIndex((index + 1) % imageIds.length)}
              className="rounded-lg bg-white/90 px-3 py-1 text-sm shadow"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
