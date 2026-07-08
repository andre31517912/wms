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
