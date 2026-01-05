"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

interface HeaderProps {
  variant?: "home" | "minimal";
}

export function Header({ variant = "home" }: HeaderProps) {
  return (
    <header className="border-b border-border/40 glass sticky top-0 z-50 pwa-fixed-header">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="AirLog"
            width={120}
            height={32}
            className="dark:hidden"
          />
          <Image
            src="/logo-dark.svg"
            alt="AirLog"
            width={120}
            height={32}
            className="hidden dark:block"
          />
        </Link>

        <nav className="flex items-center gap-2">
          <ThemeToggle />
          {variant === "home" && (
            <>
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  Admin
                </Button>
              </Link>
              <Link href="/join">
                <Button size="sm">
                  Join Session
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
