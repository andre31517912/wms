import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <nav className="flex items-center gap-6">
            <Link href="/admin" className="text-sm font-semibold text-gray-900">
              WMS Admin
            </Link>
            <Link
              href="/admin/customers"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Customers
            </Link>
            <Link
              href="/admin/categories"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Categories
            </Link>
            <Link
              href="/admin/products"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Products
            </Link>
            <Link
              href="/admin/import"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Import
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{admin.name}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
