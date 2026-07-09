export type StockLevel = "in_stock" | "low" | "out";

export function stockLevel(
  stockCases: number,
  lowStockThreshold: number
): StockLevel {
  if (stockCases <= 0) return "out";
  if (stockCases <= lowStockThreshold) return "low";
  return "in_stock";
}
