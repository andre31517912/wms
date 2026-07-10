import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { User } from "@/generated/prisma/client";

const SESSION_COOKIE = "wms_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const BCRYPT_ROUNDS = 12;

// Constant-time-ish dummy hash so login with an unknown email still costs a
// bcrypt compare (avoids leaking account existence via response timing)
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", BCRYPT_ROUNDS);

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function verifyPassword(
  password: string,
  passwordHash: string | null
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash ?? DUMMY_HASH);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: { tokenHash: hashToken(token), userId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Returns the logged-in user or null. DB-backed check — the single source of
 * truth for authentication. Cached per request.
 */
export const getSessionUser = cache(async (): Promise<User | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }
  if (session.user.accountStatus === "DISABLED") return null;

  return session.user;
});

/** Any logged-in user; redirects to /login otherwise. */
export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** Logged-in ADMIN; redirects others to where they belong. */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  return user;
}

/** Logged-in APPROVED user (customer pages); pending users go to /pending. */
export async function requireApprovedUser(): Promise<User> {
  const user = await requireUser();
  if (user.accountStatus === "PENDING") redirect("/pending");
  return user;
}

/** Logged-in, APPROVED, role CUSTOMER — for cart/order actions. */
export async function requireApprovedCustomer(): Promise<User> {
  const user = await requireApprovedUser();
  if (user.role !== "CUSTOMER") redirect("/admin");
  return user;
}

/** Where a user should land after login / on the root route. */
export function homePathFor(user: User): string {
  if (user.accountStatus === "PENDING") return "/pending";
  if (user.role === "ADMIN") return "/admin";
  return "/catalog";
}
