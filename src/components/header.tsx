"use client";

import Link from "next/link";
import { Mic, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

interface HeaderProps {
  variant?: "home" | "minimal";
}

export function Header({ variant = "home" }: HeaderProps) {
  return (
    <header className="border-b border-border/40 glass sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Mic className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <span className="font-semibold text-lg tracking-tight">Echo Test</span>
        </Link>
        
        <nav className="flex items-center gap-2">
          <ThemeToggle />
          {variant === "home" && (
            <>
              <Link href="/admin">
                <Button variant="ghost" size="sm">Admin</Button>
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
