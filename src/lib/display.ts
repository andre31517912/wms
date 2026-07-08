/** Join bilingual names gracefully: both → "中文 / English", else whichever exists. */
export function bilingual(
  nameZh: string | null | undefined,
  nameEn: string | null | undefined
): string {
  if (nameZh && nameEn) return `${nameZh} / ${nameEn}`;
  return nameZh || nameEn || "—";
}

export type StockLevel = "in_stock" | "low" | "out";

export function stockLevel(
  stockCases: number,
  lowStockThreshold: number
): StockLevel {
  if (stockCases <= 0) return "out";
  if (stockCases <= lowStockThreshold) return "low";
  return "in_stock";
}
