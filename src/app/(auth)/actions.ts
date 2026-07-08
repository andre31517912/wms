"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  destroySession,
  hashPassword,
  homePathFor,
  verifyPassword,
} from "@/lib/auth";
import { loginSchema, registerSchema } from "@/lib/validation";
import { Prisma } from "@/generated/prisma/client";

export type AuthFormState = { error: string } | null;

export async function register(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, email, password } = parsed.data;
  const passwordHash = await hashPassword(password);

  let userId: string;
  try {
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
    });
    userId = user.id;
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { error: "An account with this email already exists" };
    }
    throw e;
  }

  await createSession(userId);
  redirect("/pending");
}

export async function login(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  const passwordOk = await verifyPassword(password, user?.passwordHash ?? null);
  if (!user || !passwordOk) {
    return { error: "Invalid email or password" };
  }
  if (user.accountStatus === "DISABLED") {
    return { error: "This account has been disabled. Contact your supplier." };
  }

  await createSession(user.id);
  redirect(homePathFor(user));
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
