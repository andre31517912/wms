import * as XLSX from "xlsx";

/**
 * Tolerant parser for the client's ordering sheet (XLSX or CSV).
 * Headers are matched case/space-insensitively against English and Chinese
 * aliases so the client's existing sheet needs little or no reshaping.
 * Sheets with separate Chinese/English name columns still parse — the
 * Chinese value wins when both are present (single-name model).
 */

export type ImportRow = {
  rowNumber: number;
  productName: string | null; // grouping (formerly "category")
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

type NumericField =
  | "unitWeightG" | "piecesPerCase" | "caseLengthCm" | "caseWidthCm"
  | "caseHeightCm" | "minOrderCases" | "stockCases";

// Order within each list = priority (first non-empty match wins per row)
const TEXT_ALIASES: Record<
  "productName" | "sku" | "name" | "detail",
  string[]
> = {
  productName: [
    "product", "productname", "分类", "类别", "类目",
    "category", "categoryzh", "categoryen", "categorychinese", "categoryenglish",
  ],
  sku: ["sku", "code", "productcode", "itemcode", "货号", "编号", "编码", "型号"],
  // Chinese name columns first so they win when a sheet has both
  name: [
    "品名", "中文品名", "中文名", "产品名称", "名称", "namezh", "chinesename",
    "name", "itemname", "nameen", "englishname", "英文名", "英文品名",
  ],
  detail: ["规格", "detailzh", "描述", "备注", "detail", "detailen", "description", "specification", "spec"],
};

const NUMBER_ALIASES: Record<NumericField, string[]> = {
  unitWeightG: ["unitweightg", "weightg", "weight", "unitweight", "克重", "重量", "单重"],
  piecesPerCase: [
    "piecespercase", "pcspercase", "pcscase", "pcs", "qtypercase", "casepack",
    "装箱数", "每箱数量", "箱入数", "支箱", "个箱",
  ],
  caseLengthCm: ["caselengthcm", "lengthcm", "length", "l", "长", "长cm"],
  caseWidthCm: ["casewidthcm", "widthcm", "width", "w", "宽", "宽cm"],
  caseHeightCm: ["caseheightcm", "heightcm", "height", "h", "高", "高cm"],
  minOrderCases: ["minordercases", "minorder", "moq", "minimumorder", "起订量", "最低订量"],
  stockCases: ["stockcases", "stock", "inventory", "库存", "库存箱数"],
};

const COMBINED_DIMS_ALIASES = [
  "casedimensions", "casesize", "dimensions", "外箱尺寸", "箱规", "尺寸",
];

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

/** Parse "60x40x30", "60*40*30", "60×40×30" (cm) into L/W/H. */
function parseCombinedDims(
  v: unknown
): { l: number; w: number; h: number } | null {
  const s = toText(v);
  if (!s) return null;
  const m = s.match(/([\d.]+)\s*[x×*]\s*([\d.]+)\s*[x×*]\s*([\d.]+)/i);
  if (!m) return null;
  return { l: Number(m[1]), w: Number(m[2]), h: Number(m[3]) };
}

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

  // Map our fields -> matching sheet headers, in alias priority order
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
  ) as Record<NumericField, string[]>;
  const combinedDimsHeader = headersFor(COMBINED_DIMS_ALIASES)[0];

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
    const rowNumber = i + 2; // 1-based + header row

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

    if (combinedDimsHeader) {
      const dims = parseCombinedDims(r[combinedDimsHeader]);
      if (dims) {
        row.caseLengthCm = row.caseLengthCm ?? dims.l;
        row.caseWidthCm = row.caseWidthCm ?? dims.w;
        row.caseHeightCm = row.caseHeightCm ?? dims.h;
      }
    }

    // Skip fully empty rows silently
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
