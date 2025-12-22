"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
  disabled?: boolean;
}

export function Tooltip({
  content,
  children,
  className,
  side = "top",
  disabled = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  if (disabled || !content) {
    return <>{children}</>;
  }

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-popover border-x-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-popover border-x-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-popover border-y-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-popover border-y-transparent border-l-transparent",
  };

  return (
    <div
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={cn(
            "absolute z-50 px-3 py-1.5 text-xs font-medium text-popover-foreground bg-popover border border-border rounded-md shadow-md whitespace-nowrap pointer-events-none transition-opacity duration-100 ease-out max-w-xs overflow-hidden",
            positionClasses[side]
          )}
          role="tooltip"
        >
          {content}
          <span
            className={cn(
              "absolute w-0 h-0 border-4",
              arrowClasses[side]
            )}
          />
        </div>
      )}
    </div>
  );
}
