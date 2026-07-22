import { requireApprovedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CustomerNav } from "@/components/CustomerNav";

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
      <CustomerNav
        userName={user.name}
        isCustomer={isCustomer}
        isAdmin={user.role === "ADMIN"}
        cartCount={cartCount}
      />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
