"use client";

import { type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  description?: string;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
    label?: string;
  };
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
  className?: string;
}

const variantStyles = {
  default: {
    icon: "bg-secondary/50 text-foreground",
    trend: {
      up: "text-green-600 dark:text-green-400",
      down: "text-red-600 dark:text-red-400",
      neutral: "text-muted-foreground",
    },
  },
  primary: {
    icon: "bg-primary/10 text-primary",
    trend: {
      up: "text-green-600 dark:text-green-400",
      down: "text-red-600 dark:text-red-400",
      neutral: "text-muted-foreground",
    },
  },
  success: {
    icon: "bg-green-500/10 text-green-600 dark:text-green-400",
    trend: {
      up: "text-green-600 dark:text-green-400",
      down: "text-red-600 dark:text-red-400",
      neutral: "text-muted-foreground",
    },
  },
  warning: {
    icon: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    trend: {
      up: "text-orange-600 dark:text-orange-400",
      down: "text-green-600 dark:text-green-400",
      neutral: "text-muted-foreground",
    },
  },
  destructive: {
    icon: "bg-destructive/10 text-destructive",
    trend: {
      up: "text-red-600 dark:text-red-400",
      down: "text-green-600 dark:text-green-400",
      neutral: "text-muted-foreground",
    },
  },
};

export function StatCard({
  title,
  value,
  icon,
  description,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {(description || trend) && (
              <div className="flex items-center gap-2 text-xs">
                {trend && (
                  <span
                    className={cn(
                      "flex items-center gap-0.5 font-medium",
                      styles.trend[trend.direction],
                    )}
                  >
                    {trend.direction === "up" && (
                      <TrendingUp className="h-3 w-3" />
                    )}
                    {trend.direction === "down" && (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {trend.direction === "neutral" && (
                      <Minus className="h-3 w-3" />
                    )}
                    {trend.value > 0 ? "+" : ""}
                    {trend.value}%
                    {trend.label && (
                      <span className="text-muted-foreground ml-1">
                        {trend.label}
                      </span>
                    )}
                  </span>
                )}
                {description && (
                  <span className="text-muted-foreground">{description}</span>
                )}
              </div>
            )}
          </div>
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
              styles.icon,
            )}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
