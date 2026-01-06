"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system" | "auto";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Helper function to determine if it should be dark based on time of day
// Dark mode from 6 PM (18:00) to 6 AM (06:00)
function isDarkTimeOfDay(): boolean {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 6;
}

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "airlog-theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(storageKey) as Theme | null;
    if (stored) {
      setThemeState(stored);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;

    const applyTheme = (isDark: boolean) => {
      root.classList.remove("light", "dark");
      root.classList.add(isDark ? "dark" : "light");
      setResolvedTheme(isDark ? "dark" : "light");
    };

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    } else if (theme === "auto") {
      // Time-based theme: dark from 6 PM to 6 AM
      applyTheme(isDarkTimeOfDay());

      // Check every minute for time changes
      const interval = setInterval(() => {
        applyTheme(isDarkTimeOfDay());
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    } else {
      applyTheme(theme === "dark");
    }
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme);
    setThemeState(newTheme);
  };

  // Always provide context, even before mounting
  // This prevents "useTheme must be used within ThemeProvider" errors
  const value: ThemeContextValue = {
    theme,
    setTheme,
    resolvedTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
