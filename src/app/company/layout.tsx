"use client";

import { usePathname } from "next/navigation";
import {
  CompanySidebar,
  CompanyMobileHeader,
} from "@/components/company/company-sidebar";

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage =
    pathname === "/company/login" || pathname === "/company/register";

  // Auth pages get a clean layout without sidebar
  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <CompanySidebar />
      <CompanyMobileHeader />

      <main className="md:pl-64 pt-16 md:pt-0 pb-20 md:pb-0 min-h-screen overflow-x-hidden">
        <div className="p-6 md:p-8 overflow-x-hidden">{children}</div>
      </main>
    </div>
  );
}
