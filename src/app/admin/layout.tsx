import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="admin-dark flex h-screen bg-admin-bg text-admin-text">
      <AdminSidebar userName={admin.name} />
      <div className="flex-1 overflow-auto pt-14 md:pt-0">
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
