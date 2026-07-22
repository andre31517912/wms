import * as XLSX from "xlsx";

export type ImportRow = {
  rowNumber: number;
  productName: string | null;
  sku: string | null;
  name: string | null;
  detail: string | null;
  unitWeightG: number | null;
  piecesPerCase: number | null;
  caseLengthCm: number | null;
  caseWidthCm: number | null;
  caseHeightCm: number | null;
  minOrderCases: number | null;
  stockCases: number | null;
};

export type ParseResult = {
  rows: ImportRow[];
  errors: string[];
};

export const IMPORT_FIELDS = [
  { key: "productName", label: "Product (grouping)" },
  { key: "sku", label: "SKU / Code" },
  { key: "name", label: "Item name" },
  { key: "detail", label: "Detail / Spec" },
  { key: "unitWeightG", label: "Weight (g)" },
  { key: "piecesPerCase", label: "Pieces/case" },
  { key: "caseLengthCm", label: "Case length (cm)" },
  { key: "caseWidthCm", label: "Case width (cm)" },
  { key: "caseHeightCm", label: "Case height (cm)" },
  { key: "minOrderCases", label: "Min order (cases)" },
  { key: "stockCases", label: "Stock (cases)" },
] as const;

export type ImportFieldKey = (typeof IMPORT_FIELDS)[number]["key"];

export type ColumnMapping = Partial<Record<ImportFieldKey, number>>;

export type DetectedSheet = {
  headers: string[];
  sampleRows: (string | null)[][];
  totalDataRows: number;
  headerRowIndex: number;
};

const TEXT_FIELDS = new Set<ImportFieldKey>([
  "productName",
  "sku",
  "name",
  "detail",
]);

// ---------- auto-match aliases (used for suggested mapping) ----------

const TEXT_ALIASES: Record<"productName" | "sku" | "name" | "detail", string[]> =
  {
    productName: [
      "product",
      "productname",
      "分类",
      "类别",
      "类目",
      "category",
      "categoryzh",
      "categoryen",
      "categorychinese",
      "categoryenglish",
    ],
    sku: [
      "sku",
      "code",
      "productcode",
      "itemcode",
      "货号",
      "编号",
      "编码",
      "型号",
    ],
    name: [
      "品名",
      "中文品名",
      "中文名",
      "产品名称",
      "名称",
      "namezh",
      "chinesename",
      "name",
      "itemname",
      "nameen",
      "englishname",
      "英文名",
      "英文品名",
    ],
    detail: [
      "规格",
      "detailzh",
      "描述",
      "备注",
      "detail",
      "detailen",
      "description",
      "specification",
      "spec",
    ],
  };

const NUMBER_ALIASES: Record<
  Exclude<ImportFieldKey, "productName" | "sku" | "name" | "detail">,
  string[]
> = {
  unitWeightG: [
    "unitweightg",
    "weightg",
    "weight",
    "unitweight",
    "克重",
    "重量",
    "单重",
  ],
  piecesPerCase: [
    "piecespercase",
    "pcspercase",
    "pcscase",
    "pcs",
    "qtypercase",
    "casepack",
    "装箱数",
    "每箱数量",
    "箱入数",
    "支箱",
    "个箱",
  ],
  caseLengthCm: ["caselengthcm", "lengthcm", "length", "l", "长", "长cm"],
  caseWidthCm: ["casewidthcm", "widthcm", "width", "w", "宽", "宽cm"],
  caseHeightCm: ["caseheightcm", "heightcm", "height", "h", "高", "高cm"],
  minOrderCases: [
    "minordercases",
    "minorder",
    "moq",
    "minimumorder",
    "起订量",
    "最低订量",
  ],
  stockCases: ["stockcases", "stock", "inventory", "库存", "库存箱数"],
};

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[\s_\-()（）.:：/\\]/g, "");
}

function toText(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || String(v).trim() === "") return null;
  const n = Number(String(v).replace(/[,，]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

// ---------- detect header row ----------

function readWorkbook(buffer: Buffer): XLSX.WorkBook {
  return XLSX.read(buffer, { type: "buffer" });
}

function getRawRows(
  wb: XLSX.WorkBook
): { rows: unknown[][]; sheetName: string } {
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error("Workbook has no sheets");
  const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], {
    header: 1,
    defval: null,
  });
  return { rows, sheetName };
}

function findHeaderRow(rows: unknown[][]): number {
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i];
    const nonEmpty = row.filter(
      (c) => c !== null && c !== undefined && String(c).trim() !== ""
    );
    if (nonEmpty.length >= 3) {
      const allText = nonEmpty.every(
        (c) => typeof c === "string" || (typeof c === "number" && isNaN(c))
      );
      if (allText) return i;
    }
  }
  return 0;
}

export function detectColumns(buffer: Buffer): DetectedSheet {
  const wb = readWorkbook(buffer);
  const { rows } = getRawRows(wb);

  const headerRowIndex = findHeaderRow(rows);
  const headerRow = rows[headerRowIndex] ?? [];
  const headers = headerRow.map((c) =>
    c !== null && c !== undefined ? String(c).trim() : ""
  );

  const dataRows = rows.slice(headerRowIndex + 1);
  const sampleRows: (string | null)[][] = [];
  for (const row of dataRows.slice(0, 5)) {
    sampleRows.push(
      headers.map((_, ci) => {
        const v = row[ci];
        return v !== null && v !== undefined ? String(v) : null;
      })
    );
  }

  return {
    headers,
    sampleRows,
    totalDataRows: dataRows.length,
    headerRowIndex,
  };
}

export function suggestMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const normalized = headers.map((h) => normalizeHeader(h));

  for (const [field, aliases] of Object.entries(TEXT_ALIASES)) {
    for (const alias of aliases) {
      const idx = normalized.indexOf(alias);
      if (idx !== -1 && !(field in mapping)) {
        mapping[field as ImportFieldKey] = idx;
        break;
      }
    }
  }
  for (const [field, aliases] of Object.entries(NUMBER_ALIASES)) {
    for (const alias of aliases) {
      const idx = normalized.indexOf(alias);
      if (idx !== -1 && !(field in mapping)) {
        mapping[field as ImportFieldKey] = idx;
        break;
      }
    }
  }
  return mapping;
}

// ---------- parse with explicit column mapping ----------

export function parseSheetWithMapping(
  buffer: Buffer,
  mapping: ColumnMapping,
  headerRowIndex: number
): ParseResult {
  const wb = readWorkbook(buffer);
  const { rows } = getRawRows(wb);

  const dataRows = rows.slice(headerRowIndex + 1);
  if (dataRows.length === 0) {
    return { rows: [], errors: ["Sheet has no data rows"] };
  }

  if (mapping.name === undefined) {
    return { rows: [], errors: ["No column mapped to Item name"] };
  }

  const errors: string[] = [];
  const importRows: ImportRow[] = [];

  let lastProductName: string | null = null;

  for (let i = 0; i < dataRows.length; i++) {
    const r = dataRows[i];
    const rowNumber = headerRowIndex + 2 + i;

    const getVal = (colIdx: number | undefined): unknown =>
      colIdx !== undefined ? r[colIdx] ?? null : null;

    const getText = (colIdx: number | undefined) => toText(getVal(colIdx));
    const getNumber = (colIdx: number | undefined) => toNumber(getVal(colIdx));

    const name = getText(mapping.name);

    const nonEmptyCells = r.filter(
      (c) => c !== null && c !== undefined && String(c).trim() !== ""
    );
    if (!name && nonEmptyCells.length <= 1 && nonEmptyCells.length > 0) {
      lastProductName = toText(nonEmptyCells[0]);
      continue;
    }

    const row: ImportRow = {
      rowNumber,
      productName:
        getText(mapping.productName) ?? lastProductName,
      sku: getText(mapping.sku),
      name,
      detail: getText(mapping.detail),
      unitWeightG: getNumber(mapping.unitWeightG),
      piecesPerCase: getNumber(mapping.piecesPerCase),
      caseLengthCm: getNumber(mapping.caseLengthCm),
      caseWidthCm: getNumber(mapping.caseWidthCm),
      caseHeightCm: getNumber(mapping.caseHeightCm),
      minOrderCases: getNumber(mapping.minOrderCases),
      stockCases: getNumber(mapping.stockCases),
    };

    const hasAnyValue = Object.entries(row).some(
      ([k, v]) => k !== "rowNumber" && v !== null
    );
    if (!hasAnyValue) continue;

    if (!row.name) {
      errors.push(`Row ${rowNumber}: no item name`);
      continue;
    }
    if (row.piecesPerCase !== null && !Number.isInteger(row.piecesPerCase)) {
      row.piecesPerCase = Math.round(row.piecesPerCase);
    }
    importRows.push(row);
  }

  return { rows: importRows, errors };
}

// ---------- legacy auto-match parser (kept for backward compatibility) ----------

export function parseSheet(buffer: Buffer): ParseResult {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer" });
  } catch {
    return { rows: [], errors: ["File could not be parsed as XLSX or CSV"] };
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { rows: [], errors: ["Workbook has no sheets"] };

  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    workbook.Sheets[sheetName],
    { defval: null }
  );
  if (raw.length === 0) {
    return { rows: [], errors: ["Sheet has no data rows"] };
  }

  const headers = Object.keys(raw[0]);
  const normalized = new Map(headers.map((h) => [normalizeHeader(h), h]));

  function headersFor(aliases: string[]): string[] {
    return aliases
      .map((a) => normalized.get(a))
      .filter((h): h is string => h !== undefined);
  }

  const textHeaders = Object.fromEntries(
    Object.entries(TEXT_ALIASES).map(([f, a]) => [f, headersFor(a)])
  ) as Record<keyof typeof TEXT_ALIASES, string[]>;
  const numberHeaders = Object.fromEntries(
    Object.entries(NUMBER_ALIASES).map(([f, a]) => [f, headersFor(a)])
  ) as Record<
    Exclude<ImportFieldKey, "productName" | "sku" | "name" | "detail">,
    string[]
  >;

  if (textHeaders.name.length === 0) {
    return {
      rows: [],
      errors: [
        `No item-name column recognized. Found headers: ${headers.join(", ")}`,
      ],
    };
  }

  const errors: string[] = [];
  const rows: ImportRow[] = [];

  raw.forEach((r, i) => {
    const rowNumber = i + 2;

    const firstText = (hs: string[]) => {
      for (const h of hs) {
        const v = toText(r[h]);
        if (v !== null) return v;
      }
      return null;
    };
    const firstNumber = (hs: string[]) => {
      for (const h of hs) {
        const v = toNumber(r[h]);
        if (v !== null) return v;
      }
      return null;
    };

    const row: ImportRow = {
      rowNumber,
      productName: firstText(textHeaders.productName),
      sku: firstText(textHeaders.sku),
      name: firstText(textHeaders.name),
      detail: firstText(textHeaders.detail),
      unitWeightG: firstNumber(numberHeaders.unitWeightG),
      piecesPerCase: firstNumber(numberHeaders.piecesPerCase),
      caseLengthCm: firstNumber(numberHeaders.caseLengthCm),
      caseWidthCm: firstNumber(numberHeaders.caseWidthCm),
      caseHeightCm: firstNumber(numberHeaders.caseHeightCm),
      minOrderCases: firstNumber(numberHeaders.minOrderCases),
      stockCases: firstNumber(numberHeaders.stockCases),
    };

    const hasAnyValue = Object.entries(row).some(
      ([k, v]) => k !== "rowNumber" && v !== null
    );
    if (!hasAnyValue) return;

    if (!row.name) {
      errors.push(`Row ${rowNumber}: no item name`);
      return;
    }
    if (row.piecesPerCase !== null && !Number.isInteger(row.piecesPerCase)) {
      row.piecesPerCase = Math.round(row.piecesPerCase);
    }
    rows.push(row);
  });

  return { rows, errors };
}
