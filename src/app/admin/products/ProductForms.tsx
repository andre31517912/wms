"use client";

import { useActionState, useState, useTransition } from "react";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  type ActionState,
} from "../actions";

const inputCls =
  "rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none";

export function NewProductForm() {
  const [state, formAction, pending] = useActionState(createProduct, null);

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

export function ProductRow({
  product,
}: {
  product: {
    id: string;
    name: string;
    sortOrder: number;
    itemCount: number;
  };
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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

  if (editing) {
    return (
      <tr className="bg-blue-50/50">
        <td colSpan={4} className="px-4 py-3">
          <form action={formAction} className="flex flex-wrap items-end gap-3">
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
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
      <td className="px-4 py-3 text-gray-500">{product.sortOrder}</td>
      <td className="px-4 py-3 text-gray-500">{product.itemCount}</td>
      <td className="px-4 py-3 text-right">
        <span className="inline-flex items-center gap-2">
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
            disabled={pending || product.itemCount > 0}
            onClick={onDelete}
            title={
              product.itemCount > 0
                ? "Move or delete its items first"
                : undefined
            }
            className="rounded-lg border border-red-300 px-3 py-1 text-xs text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Delete
          </button>
        </span>
      </td>
    </tr>
  );
}
