import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/auth";
import { AdminNav } from "./_components/AdminNav";

export const metadata: Metadata = { title: { default: "Admin", template: "%s — Admin" } };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex gap-6">
      <aside className="hidden w-48 shrink-0 md:block">
        <AdminNav />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
