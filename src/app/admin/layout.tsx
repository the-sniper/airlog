"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar, AdminMobileHeader } from "@/components/admin-sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  // Login page gets a clean layout without sidebar
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <AdminSidebar />
      <AdminMobileHeader />

      <main className="md:pl-64 pt-16 md:pt-0 pb-20 md:pb-0 min-h-screen overflow-x-hidden">
        <div className="p-6 md:p-8 overflow-x-hidden">{children}</div>
      </main>
    </div>
  );
}
