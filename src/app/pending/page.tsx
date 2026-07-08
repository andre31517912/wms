import { redirect } from "next/navigation";
import { requireUser, homePathFor } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";

export default async function PendingPage() {
  const user = await requireUser();
  if (user.accountStatus !== "PENDING") redirect(homePathFor(user));

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow">
        <h1 className="mb-2 text-2xl font-semibold text-gray-900">
          Account pending approval
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          Thanks for registering, {user.name}. Your account is waiting for
          approval by the supplier. You&apos;ll be able to browse the catalog
          and place orders once it&apos;s approved.
        </p>
        <LogoutButton />
      </div>
    </main>
  );
}
