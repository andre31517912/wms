"use client";

import { useState, useRef, useTransition, useMemo } from "react";
import { detectSheetColumns, importSheet, importEditedRows } from "./actions";
import type { DetectState, ImportState } from "./actions";
import {
  IMPORT_FIELDS,
  type ImportFieldKey,
  type ImportRow,
  type ColumnMapping,
} from "@/lib/import";
import { useI18n, type TKey } from "@/lib/i18n";

const ACTION_BADGE = {
  create: "bg-green-100 text-green-800",
  update: "bg-blue-100 text-blue-800",
  error: "bg-red-100 text-red-800",
} as const;

const ACTION_LABEL_KEY: Record<keyof typeof ACTION_BADGE, TKey> = {
  create: "actionCreate",
  update: "actionUpdate",
  error: "actionError",
};

const FIELD_LABEL_KEY: Record<ImportFieldKey, TKey> = {
  productName: "fldProduct",
  sku: "fldSku",
  name: "fldName",
  detail: "fldDetail",
  unitWeightG: "fldWeight",
  piecesPerCase: "fldPiecesPerCase",
  caseLengthCm: "fldCaseLength",
  caseWidthCm: "fldCaseWidth",
  caseHeightCm: "fldCaseHeight",
  minOrderCases: "fldMinOrder",
  stockCases: "fldStock",
};

const selectCls =
  "rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none";

const cellInputCls =
  "w-full border-0 bg-transparent px-1 py-0.5 text-sm text-gray-900 focus:bg-blue-50 focus:ring-1 focus:ring-blue-300 focus:outline-none rounded";

type Step = "upload" | "map" | "preview" | "done";

function ProductInput({
  value,
  onChange,
  suggestions,
}: {
  value: string;
  onChange: (val: string) => void;
  suggestions: string[];
}) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);

  const filtered = useMemo(() => {
    if (!value.trim()) return [];
    const words = value
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    return suggestions.filter((s) => {
      const lower = s.toLowerCase();
      return words.some((w) => lower.includes(w));
    });
  }, [value, suggestions]);

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setFocused(true);
          setOpen(true);
        }}
        onBlur={() => {
          setFocused(false);
          setTimeout(() => setOpen(false), 150);
        }}
        className={`${cellInputCls} min-w-32`}
      />
      {open && focused && filtered.length > 0 && (
        <ul className="absolute left-0 z-20 mt-0.5 max-h-40 w-56 overflow-auto rounded-lg border border-gray-200 bg-white py-1 text-sm shadow-lg">
          {filtered.map((name) => (
            <li
              key={name}
              onMouseDown={() => {
                onChange(name);
                setOpen(false);
              }}
              className="cursor-pointer truncate px-2 py-1 hover:bg-blue-50"
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ImportForm() {
  const { t } = useI18n();
  const [detectState, setDetectState] = useState<DetectState>(null);
  const [importState, setImportState] = useState<ImportState>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [editedRows, setEditedRows] = useState<ImportRow[]>([]);
  const [existingProducts, setExistingProducts] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [detecting, startDetect] = useTransition();
  const [importing, startImport] = useTransition();

  function handleFieldChange(field: ImportFieldKey, colIdx: string) {
    setMapping((prev) => {
      const next = { ...prev };
      if (colIdx === "") {
        delete next[field];
      } else {
        next[field] = Number(colIdx);
      }
      return next;
    });
  }

  function resetForm() {
    setStep("upload");
    setMapping({});
    setDetectState(null);
    setImportState(null);
    setEditedRows([]);
    setExistingProducts([]);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleReadColumns() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    startDetect(async () => {
      const result = await detectSheetColumns(null, fd);
      if (result) {
        setDetectState(result);
        setMapping(result.suggestedMapping);
        setStep("map");
      }
    });
  }

  function handlePreview() {
    const file = fileRef.current?.files?.[0];
    if (!detectState || !file) return;
    const fd = new FormData();
    fd.set("file", file);
    fd.set("mode", "preview");
    fd.set("mapping", JSON.stringify(mapping));
    fd.set("headerRowIndex", String(detectState.detected.headerRowIndex));
    startImport(async () => {
      const result = await importSheet(null, fd);
      if (result) {
        setImportState(result);
        if (result.rows) setEditedRows(result.rows);
        if (result.existingProducts) setExistingProducts(result.existingProducts);
        setStep("preview");
      }
    });
  }

  function handleImport() {
    if (editedRows.length === 0) return;
    const fileName = importState?.fileName ?? "";
    startImport(async () => {
      const result = await importEditedRows(editedRows, fileName);
      if (result) {
        setImportState(result);
        setStep("done");
      }
    });
  }

  function updateRow(index: number, field: keyof ImportRow, raw: string) {
    setEditedRows((prev) => {
      const next = [...prev];
      const row = { ...next[index] };

      const textFields: (keyof ImportRow)[] = [
        "productName",
        "sku",
        "name",
        "detail",
      ];
      if (textFields.includes(field)) {
        (row as Record<string, unknown>)[field] = raw.trim() === "" ? null : raw;
      } else if (field !== "rowNumber") {
        const n = Number(raw);
        (row as Record<string, unknown>)[field] =
          raw.trim() === "" || !Number.isFinite(n) ? null : n;
      }

      next[index] = row;
      return next;
    });
  }

  const detected = detectState?.detected;

  return (
    <div className="space-y-6">
      {/* Step 1: Upload */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={() => {
              if (step !== "upload") resetForm();
            }}
            className="text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
          />
          <button
            type="button"
            onClick={handleReadColumns}
            disabled={detecting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {detecting ? t("reading") : t("readColumns")}
          </button>
        </div>
      </div>

      {/* Step 2: Column mapping */}
      {step === "map" && detected && (
        <div className="rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <p className="text-sm font-medium text-gray-900">
              {t("mapColumnsToFields")}
            </p>
            <p className="text-xs text-gray-500">
              {t("columnsDetected", {
                n: detected.headers.filter((h) => h).length,
              })}{" "}
              · {t("dataRows", { n: detected.totalDataRows })} ·{" "}
              {t("headerOnRow", { n: detected.headerRowIndex + 1 })}
            </p>
          </div>

          {/* Sample data preview */}
          <div className="overflow-x-auto border-b border-gray-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  {detected.headers.map((h, i) => (
                    <th
                      key={i}
                      className="whitespace-nowrap px-3 py-2 font-medium"
                    >
                      <span className="mr-1 text-gray-300">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {h || (
                        <span className="italic text-gray-300">{t("empty")}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {detected.sampleRows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className="max-w-48 truncate whitespace-nowrap px-3 py-1.5 text-gray-600"
                      >
                        {cell ?? <span className="text-gray-300">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Field mapping dropdowns */}
          <div className="px-6 py-5">
            {mapping.name === undefined && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {t("selectItemName")}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {IMPORT_FIELDS.map((field) => {
                const isMissing =
                  field.key === "name" && mapping.name === undefined;
                return (
                  <div
                    key={field.key}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 ${isMissing ? "bg-amber-50 ring-1 ring-amber-300" : ""}`}
                  >
                    <label className="w-40 shrink-0 text-sm font-medium text-gray-700">
                      {t(FIELD_LABEL_KEY[field.key])}
                      {field.key === "name" && (
                        <span className="text-red-500"> *</span>
                      )}
                    </label>
                    <select
                      value={
                        mapping[field.key] !== undefined
                          ? String(mapping[field.key])
                          : ""
                      }
                      onChange={(e) =>
                        handleFieldChange(field.key, e.target.value)
                      }
                      className={`${selectCls} w-full`}
                    >
                      <option value="">{t("skip")}</option>
                      {detected.headers.map((h, i) => (
                        <option key={i} value={String(i)}>
                          {String.fromCharCode(65 + i)}
                          {h ? `: ${h}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handlePreview}
                disabled={importing || mapping.name === undefined}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {importing ? t("working") : t("preview")}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                {t("startOver")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Editable preview */}
      {step === "preview" && importState && (
        <div className="space-y-4">
          {importState.error && (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <p className="text-sm text-red-600">{importState.error}</p>
              <button
                type="button"
                onClick={() => setStep("map")}
                className="mt-3 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                {t("backToMapping")}
              </button>
            </div>
          )}

          {!importState.error && editedRows.length > 0 && (
            <div className="rounded-xl bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4">
                <p className="text-sm font-medium text-gray-900">
                  {t("preview")} — {importState.summary}
                </p>
                <p className="text-xs text-gray-400">{importState.fileName}</p>
                <p className="mt-1 text-xs text-amber-600">
                  {t("editBeforeImport")}
                </p>
              </div>

              {importState.parseErrors.length > 0 && (
                <div className="border-b border-gray-100 px-6 py-3">
                  <p className="mb-1 text-xs font-medium text-red-700">
                    {t("skippedRows")}
                  </p>
                  <ul className="list-inside list-disc text-xs text-red-600">
                    {importState.parseErrors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-100 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-2 py-2 text-center">{t("colRow")}</th>
                      <th className="px-2 py-2">{t("colProduct")}</th>
                      <th className="px-2 py-2">{t("colItemName")}</th>
                      <th className="px-2 py-2">{t("colSku")}</th>
                      <th className="px-2 py-2">{t("colDetail")}</th>
                      <th className="px-2 py-2">{t("colWeight")}</th>
                      <th className="px-2 py-2">{t("colPcsCase")}</th>
                      <th className="px-2 py-2">{t("colL")}</th>
                      <th className="px-2 py-2">{t("colW")}</th>
                      <th className="px-2 py-2">{t("colH")}</th>
                      <th className="px-2 py-2">{t("colMinOrd")}</th>
                      <th className="px-2 py-2">{t("colStock")}</th>
                      <th className="px-2 py-2">{t("colAction")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {editedRows.map((row, idx) => {
                      const plan = importState.plans.find(
                        (p) => p.rowNumber === row.rowNumber
                      );
                      return (
                        <tr key={row.rowNumber} className="hover:bg-gray-50/50">
                          <td className="px-2 py-1 text-center text-xs text-gray-400">
                            {row.rowNumber}
                          </td>
                          <td className="px-1 py-1">
                            <ProductInput
                              value={row.productName ?? ""}
                              onChange={(val) =>
                                updateRow(idx, "productName", val)
                              }
                              suggestions={existingProducts}
                            />
                          </td>
                          <td className="px-1 py-1">
                            <input
                              type="text"
                              value={row.name ?? ""}
                              onChange={(e) =>
                                updateRow(idx, "name", e.target.value)
                              }
                              className={`${cellInputCls} min-w-40`}
                            />
                          </td>
                          <td className="px-1 py-1">
                            <input
                              type="text"
                              value={row.sku ?? ""}
                              onChange={(e) =>
                                updateRow(idx, "sku", e.target.value)
                              }
                              className={`${cellInputCls} min-w-20`}
                            />
                          </td>
                          <td className="px-1 py-1">
                            <input
                              type="text"
                              value={row.detail ?? ""}
                              onChange={(e) =>
                                updateRow(idx, "detail", e.target.value)
                              }
                              className={`${cellInputCls} min-w-36`}
                            />
                          </td>
                          <td className="px-1 py-1">
                            <input
                              type="number"
                              value={row.unitWeightG ?? ""}
                              onChange={(e) =>
                                updateRow(idx, "unitWeightG", e.target.value)
                              }
                              className={`${cellInputCls} min-w-16`}
                            />
                          </td>
                          <td className="px-1 py-1">
                            <input
                              type="number"
                              value={row.piecesPerCase ?? ""}
                              onChange={(e) =>
                                updateRow(idx, "piecesPerCase", e.target.value)
                              }
                              className={`${cellInputCls} min-w-16`}
                            />
                          </td>
                          <td className="px-1 py-1">
                            <input
                              type="number"
                              value={row.caseLengthCm ?? ""}
                              onChange={(e) =>
                                updateRow(idx, "caseLengthCm", e.target.value)
                              }
                              className={`${cellInputCls} min-w-14`}
                            />
                          </td>
                          <td className="px-1 py-1">
                            <input
                              type="number"
                              value={row.caseWidthCm ?? ""}
                              onChange={(e) =>
                                updateRow(idx, "caseWidthCm", e.target.value)
                              }
                              className={`${cellInputCls} min-w-14`}
                            />
                          </td>
                          <td className="px-1 py-1">
                            <input
                              type="number"
                              value={row.caseHeightCm ?? ""}
                              onChange={(e) =>
                                updateRow(idx, "caseHeightCm", e.target.value)
                              }
                              className={`${cellInputCls} min-w-14`}
                            />
                          </td>
                          <td className="px-1 py-1">
                            <input
                              type="number"
                              value={row.minOrderCases ?? ""}
                              onChange={(e) =>
                                updateRow(idx, "minOrderCases", e.target.value)
                              }
                              className={`${cellInputCls} min-w-14`}
                            />
                          </td>
                          <td className="px-1 py-1">
                            <input
                              type="number"
                              value={row.stockCases ?? ""}
                              onChange={(e) =>
                                updateRow(idx, "stockCases", e.target.value)
                              }
                              className={`${cellInputCls} min-w-14`}
                            />
                          </td>
                          <td className="px-2 py-1">
                            {plan && (
                              <span
                                className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_BADGE[plan.action]}`}
                              >
                                {t(ACTION_LABEL_KEY[plan.action])}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {!importState.error && editedRows.length > 0 && (
              <button
                type="button"
                onClick={handleImport}
                disabled={importing}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {importing ? t("importing") : t("importNow")}
              </button>
            )}
            <button
              type="button"
              onClick={() => setStep("map")}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              {t("backToMapping")}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              {t("startOver")}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Import results */}
      {step === "done" && importState && (
        <div className="space-y-4">
          {importState.error && (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <p className="text-sm text-red-600">{importState.error}</p>
            </div>
          )}

          {!importState.error && (
            <div className="rounded-xl bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4">
                <p className="text-sm font-medium text-gray-900">
                  {t("done")} — {importState.summary}
                </p>
                <p className="text-xs text-gray-400">{importState.fileName}</p>
              </div>

              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-2">{t("row")}</th>
                    <th className="px-6 py-2">{t("product")}</th>
                    <th className="px-6 py-2">{t("action")}</th>
                    <th className="px-6 py-2">{t("detail")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {importState.plans.map((p) => (
                    <tr key={p.rowNumber}>
                      <td className="px-6 py-2 text-gray-400">{p.rowNumber}</td>
                      <td className="px-6 py-2 text-gray-900">{p.label}</td>
                      <td className="px-6 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_BADGE[p.action]}`}
                        >
                          {t(ACTION_LABEL_KEY[p.action])}
                        </span>
                      </td>
                      <td className="px-6 py-2 text-gray-500">{p.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button
            type="button"
            onClick={resetForm}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            {t("importAnother")}
          </button>
        </div>
      )}
    </div>
  );
}
