import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Button } from "@/components/ui/button";
import { ShieldCheck, User } from "lucide-react";
import { getCurrentAdmin } from "@/lib/auth";
import { getCurrentUser } from "@/lib/user-auth";

export default async function Home() {
  // Check if user is logged in as admin
  const admin = await getCurrentAdmin();
  if (admin) {
    redirect("/admin");
  }

  // Check if user is logged in as a regular user
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen gradient-mesh flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt="AirLog" width={100} height={26} className="dark:hidden" />
          <Image src="/logo-dark.svg" alt="AirLog" width={100} height={26} className="hidden dark:block" />
        </div>
        <ThemeToggle />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Welcome to AirLog
            </h1>
            <p className="text-muted-foreground">
              Voice-first testing feedback platform
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <Button asChild size="lg" className="w-full h-14 text-base">
              <Link href="/login" className="flex items-center justify-center gap-3">
                <User className="w-5 h-5" />
                User Login
              </Link>
            </Button>

            <Button asChild variant="outline" size="lg" className="w-full h-14 text-base">
              <Link href="/admin/login" className="flex items-center justify-center gap-3">
                <ShieldCheck className="w-5 h-5" />
                Admin Login
              </Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground pt-4">
            New user?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-muted-foreground">
        <p>© 2025 AirLog. All rights reserved.</p>
      </footer>
    </div>
  );
}
