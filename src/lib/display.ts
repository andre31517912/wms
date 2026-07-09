/** "60×40×30" when all three are present, otherwise "—". */
export function formatDims(
  l: number | null,
  w: number | null,
  h: number | null
): string {
  if (l === null || w === null || h === null) return "—";
  return `${l}×${w}×${h}`;
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
