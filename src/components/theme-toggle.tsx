"use client";

import { Moon, Sun, Clock } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const cycleTheme = () => {
    // Cycle through: auto -> light -> dark -> auto
    if (theme === "auto") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("auto");
    }
  };

  const getLabel = () => {
    if (theme === "auto") return "Auto (time-based)";
    return theme === "dark" ? "Dark mode" : "Light mode";
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className="relative text-muted-foreground"
      aria-label={`Current: ${getLabel()}. Click to switch theme.`}
      title={getLabel()}
    >
      {/* Clock icon for auto mode */}
      <Clock 
        className={`h-4 w-4 transition-all ${theme === "auto" ? "scale-100 rotate-0" : "scale-0 rotate-90 absolute"}`}
        strokeWidth={1.75}
      />
      {/* Sun icon for light mode */}
      <Sun 
        className={`h-4 w-4 transition-all ${theme === "light" ? "scale-100 rotate-0" : "scale-0 -rotate-90 absolute"}`}
        strokeWidth={1.75} 
      />
      {/* Moon icon for dark mode */}
      <Moon 
        className={`h-4 w-4 transition-all ${theme === "dark" ? "scale-100 rotate-0" : "scale-0 rotate-90 absolute"}`}
        strokeWidth={1.75} 
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
