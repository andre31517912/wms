import { prisma } from "@/lib/prisma";
import { CustomerStatusButtons } from "./CustomerStatusButtons";

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  DISABLED: "bg-gray-200 text-gray-600",
};

export default async function CustomersPage() {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: [{ accountStatus: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Customers</h1>
      {customers.length === 0 ? (
        <p className="text-sm text-gray-500">
          No customer accounts yet. Customers can self-register at /register.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Registered</th>
                <th className="px-4 py-3">History</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {c.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[c.accountStatus]}`}
                    >
                      {c.accountStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {c.createdAt.toLocaleDateString("en-CA")}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/admin/orders?customer=${c.id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Orders
                    </a>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <CustomerStatusButtons
                      userId={c.id}
                      status={c.accountStatus}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
