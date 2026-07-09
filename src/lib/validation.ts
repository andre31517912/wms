import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.email("Invalid email address").trim().toLowerCase().max(254),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
});

export const loginSchema = z.object({
  email: z.email("Invalid email address").trim().toLowerCase().max(254),
  password: z.string().min(1, "Password is required").max(100),
});

/** Empty form field → null, otherwise trimmed string. */
const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().max(max).nullable()
  );

/** Empty form field → null, otherwise coerced positive number. */
const optionalPositiveNumber = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : v),
  z.coerce.number().positive().nullable()
);

export const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  sortOrder: z.coerce.number().int().min(0).max(100000).default(0),
});

export const itemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  sku: optionalText(100),
  name: z.string().trim().min(1, "Item name is required").max(300),
  detail: optionalText(500),
  unitWeightG: optionalPositiveNumber,
  piecesPerCase: z.coerce
    .number()
    .int("Pieces per case must be a whole number")
    .positive("Pieces per case is required"),
  caseLengthCm: optionalPositiveNumber,
  caseWidthCm: optionalPositiveNumber,
  caseHeightCm: optionalPositiveNumber,
  minOrderCases: z.coerce.number().int().positive().default(1),
  lowStockThreshold: z.coerce.number().int().min(0).default(10),
  isActive: z.coerce.boolean().default(true),
});

export const stockAdjustmentSchema = z.object({
  itemId: z.string().min(1),
  deltaCases: z.coerce
    .number()
    .int("Cases must be a whole number")
    .refine((n) => n !== 0, "Adjustment cannot be zero"),
  reason: z.enum(["RECEIVING", "CORRECTION", "DAMAGE"]),
  note: optionalText(500),
});
