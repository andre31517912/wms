import { prisma } from "@/lib/prisma";
import { CustomersView, type CustomerRow } from "./CustomersView";

export default async function CustomersPage() {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: [{ accountStatus: "asc" }, { createdAt: "desc" }],
  });

  const rows: CustomerRow[] = customers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    accountStatus: c.accountStatus as "PENDING" | "APPROVED" | "DISABLED",
    createdAtLabel: c.createdAt.toLocaleDateString("en-CA"),
  }));

  return <CustomersView customers={rows} />;
}
