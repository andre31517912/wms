"use client";

import { useActionState, useState, useTransition } from "react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  type ActionState,
} from "../actions";

const inputCls =
  "rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none";

export function NewCategoryForm() {
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await createCategory(prev, formData);
      return result;
    },
    null
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs text-gray-500">
          Chinese name 中文名
        </label>
        <input name="nameZh" type="text" className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-gray-500">English name</label>
        <input name="nameEn" type="text" className={inputCls} />
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

export function CategoryRow({
  category,
}: {
  category: {
    id: string;
    nameEn: string | null;
    nameZh: string | null;
    sortOrder: number;
    productCount: number;
  };
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const updateWithId = updateCategory.bind(null, category.id);
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
      const result = await deleteCategory(category.id);
      if (result && "error" in result) setError(result.error);
    });
  };

  if (editing) {
    return (
      <tr className="bg-blue-50/50">
        <td colSpan={5} className="px-4 py-3">
          <form action={formAction} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-500">
                Chinese name 中文名
              </label>
              <input
                name="nameZh"
                type="text"
                defaultValue={category.nameZh ?? ""}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">
                English name
              </label>
              <input
                name="nameEn"
                type="text"
                defaultValue={category.nameEn ?? ""}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Sort</label>
              <input
                name="sortOrder"
                type="number"
                defaultValue={category.sortOrder}
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
      <td className="px-4 py-3 text-gray-900">{category.nameZh ?? "—"}</td>
      <td className="px-4 py-3 text-gray-900">{category.nameEn ?? "—"}</td>
      <td className="px-4 py-3 text-gray-500">{category.sortOrder}</td>
      <td className="px-4 py-3 text-gray-500">{category.productCount}</td>
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
            disabled={pending || category.productCount > 0}
            onClick={onDelete}
            title={
              category.productCount > 0
                ? "Move or delete its products first"
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
