"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register } from "../actions";
import { useI18n } from "@/lib/i18n";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(register, null);
  const { t } = useI18n();

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow">
        <h1 className="mb-1 text-2xl font-semibold text-gray-900">
          {t("createAccount")}
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          {t("accountReviewNote")}
        </p>
        <form action={formAction} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t("businessName")}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="organization"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t("email")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t("password")}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-400">{t("passwordHint")}</p>
          </div>
          {state?.error && (
            <p className="text-sm text-red-600" role="alert">
              {state.error}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {pending ? t("creatingAccount") : t("createAccount")}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          {t("alreadyHaveAccount")}{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            {t("signIn")}
          </Link>
        </p>
      </div>
    </main>
  );
}
