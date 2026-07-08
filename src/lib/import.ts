import * as XLSX from "xlsx";

/**
 * Tolerant parser for the client's ordering sheet (XLSX or CSV).
 * Headers are matched case/space-insensitively against English and Chinese
 * aliases so the client's existing sheet needs little or no reshaping.
 */

export type ImportRow = {
  rowNumber: number;
  categoryEn: string | null;
  categoryZh: string | null;
  sku: string | null;
  nameEn: string | null;
  nameZh: string | null;
  detailEn: string | null;
  detailZh: string | null;
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

const HEADER_ALIASES: Record<keyof Omit<ImportRow, "rowNumber">, string[]> = {
  categoryEn: ["categoryen", "category", "categoryenglish"],
  categoryZh: ["categoryzh", "分类", "类别", "类目", "categorychinese"],
  sku: ["sku", "code", "productcode", "itemcode", "货号", "编号", "编码", "型号"],
  nameEn: ["nameen", "name", "productname", "englishname", "英文名", "英文品名"],
  nameZh: ["namezh", "chinesename", "中文名", "品名", "产品名称", "名称", "中文品名"],
  detailEn: ["detailen", "detail", "description", "specification", "spec"],
  detailZh: ["detailzh", "规格", "描述", "备注"],
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
  return h
    .toLowerCase()
    .replace(/[\s_\-()（）.:：/\\]/g, "")
    .replace(/cm$/, "cm"); // keep trailing cm meaningful
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
): { l: number | null; w: number | null; h: number | null } | null {
  const s = toText(v);
  if (!s) return null;
  const m = s.match(
    /([\d.]+)\s*[x×*]\s*([\d.]+)\s*[x×*]\s*([\d.]+)/i
  );
  if (!m) return null;
  return { l: Number(m[1]), w: Number(m[2]), h: Number(m[3]) };
}

export function parseSheet(buffer: Buffer): ParseResult {
  const errors: string[] = [];
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

  // Map actual headers -> our fields
  const headerMap = new Map<string, keyof Omit<ImportRow, "rowNumber">>();
  let combinedDimsHeader: string | null = null;
  for (const header of Object.keys(raw[0])) {
    const norm = normalizeHeader(header);
    if (COMBINED_DIMS_ALIASES.includes(norm)) {
      combinedDimsHeader = header;
      continue;
    }
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.includes(norm)) {
        headerMap.set(header, field as keyof Omit<ImportRow, "rowNumber">);
        break;
      }
    }
  }

  const mappedFields = new Set(headerMap.values());
  if (!mappedFields.has("nameEn") && !mappedFields.has("nameZh")) {
    return {
      rows: [],
      errors: [
        `No product-name column recognized. Found headers: ${Object.keys(raw[0]).join(", ")}`,
      ],
    };
  }

  const rows: ImportRow[] = [];
  raw.forEach((r, i) => {
    const rowNumber = i + 2; // 1-based + header row
    const row: ImportRow = {
      rowNumber,
      categoryEn: null, categoryZh: null, sku: null,
      nameEn: null, nameZh: null, detailEn: null, detailZh: null,
      unitWeightG: null, piecesPerCase: null,
      caseLengthCm: null, caseWidthCm: null, caseHeightCm: null,
      minOrderCases: null, stockCases: null,
    };

    for (const [header, field] of headerMap) {
      const value = r[header];
      switch (field) {
        case "unitWeightG":
        case "piecesPerCase":
        case "caseLengthCm":
        case "caseWidthCm":
        case "caseHeightCm":
        case "minOrderCases":
        case "stockCases":
          row[field] = toNumber(value);
          break;
        default:
          row[field] = toText(value);
      }
    }

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

    if (!row.nameEn && !row.nameZh) {
      errors.push(`Row ${rowNumber}: no product name (English or Chinese)`);
      return;
    }
    if (row.piecesPerCase !== null && !Number.isInteger(row.piecesPerCase)) {
      row.piecesPerCase = Math.round(row.piecesPerCase);
    }
    rows.push(row);
  });

  return { rows, errors };
}
