import Link from "next/link";
import { requireApprovedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/LogoutButton";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireApprovedUser();
  const isCustomer = user.role === "CUSTOMER";

  const cartCount = isCustomer
    ? await prisma.cartLine.count({ where: { userId: user.id } })
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <nav className="flex items-center gap-6">
            <Link href="/catalog" className="text-sm font-semibold text-gray-900">
              Order Portal
            </Link>
            <Link
              href="/catalog"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Catalog
            </Link>
            {isCustomer && (
              <>
                <Link
                  href="/orders"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  My orders
                </Link>
                <Link
                  href="/cart"
                  className="relative text-sm text-gray-600 hover:text-gray-900"
                >
                  Cart
                  {cartCount > 0 && (
                    <span className="absolute -right-4 -top-2 rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </>
            )}
            {user.role === "ADMIN" && (
              <Link
                href="/admin"
                className="text-sm text-blue-600 hover:underline"
              >
                ← Back to admin
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user.name}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
