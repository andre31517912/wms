import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const [customerCount, pendingCount] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER", accountStatus: "APPROVED" } }),
    prisma.user.count({ where: { role: "CUSTOMER", accountStatus: "PENDING" } }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Approved customers</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">
            {customerCount}
          </p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Pending approvals</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">
            {pendingCount}
          </p>
        </div>
      </div>
      <p className="mt-8 text-sm text-gray-400">
        Catalog and inventory management arrive in Phase 2.
      </p>
    </div>
  );
}
