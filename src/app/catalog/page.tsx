import { requireApprovedUser } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";

export default async function CatalogPage() {
  const user = await requireApprovedUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold text-gray-900">
            Product Catalog
          </span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user.name}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-sm text-gray-500">
          Welcome, {user.name}. The product catalog arrives in Phase 3 — for
          now this page confirms your account is approved and login works.
        </p>
      </main>
    </div>
  );
}
