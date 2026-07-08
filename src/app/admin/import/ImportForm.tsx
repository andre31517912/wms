"use client";

import { useActionState } from "react";
import { importSheet } from "./actions";

const ACTION_BADGE = {
  create: "bg-green-100 text-green-800",
  update: "bg-blue-100 text-blue-800",
  error: "bg-red-100 text-red-800",
} as const;

export function ImportForm() {
  const [state, formAction, pending] = useActionState(importSheet, null);

  return (
    <div className="space-y-6">
      <form action={formAction} className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <input
            name="file"
            type="file"
            accept=".xlsx,.xls,.csv"
            required
            className="text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
          />
          <button
            type="submit"
            name="mode"
            value="preview"
            disabled={pending}
            className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
          >
            {pending ? "Working..." : "Preview"}
          </button>
          <button
            type="submit"
            name="mode"
            value="import"
            disabled={pending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {pending ? "Working..." : "Import"}
          </button>
        </div>
        {state?.error && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}
      </form>

      {state && !state.error && (
        <div className="rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <p className="text-sm font-medium text-gray-900">
              {state.mode === "import" ? "✅ " : "🔍 "}
              {state.summary}
            </p>
            <p className="text-xs text-gray-400">{state.fileName}</p>
            {state.mode === "preview" && (
              <p className="mt-1 text-xs text-amber-600">
                Nothing was written — click Import (with the same file) to
                apply.
              </p>
            )}
          </div>

          {state.parseErrors.length > 0 && (
            <div className="border-b border-gray-100 px-6 py-3">
              <p className="mb-1 text-xs font-medium text-red-700">
                Skipped rows
              </p>
              <ul className="list-inside list-disc text-xs text-red-600">
                {state.parseErrors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-2">Row</th>
                <th className="px-6 py-2">Product</th>
                <th className="px-6 py-2">Action</th>
                <th className="px-6 py-2">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {state.plans.map((p) => (
                <tr key={p.rowNumber}>
                  <td className="px-6 py-2 text-gray-400">{p.rowNumber}</td>
                  <td className="px-6 py-2 text-gray-900">{p.label}</td>
                  <td className="px-6 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_BADGE[p.action]}`}
                    >
                      {p.action}
                    </span>
                  </td>
                  <td className="px-6 py-2 text-gray-500">{p.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
