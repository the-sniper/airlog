import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", {
  variants: { 
    variant: { 
      default: "border-transparent bg-primary/15 text-primary", 
      secondary: "border-transparent bg-secondary text-secondary-foreground", 
      destructive: "border-transparent bg-[#fb7088]/15 text-[#fb7088] dark:bg-[#fb7088]/15 dark:text-[#fb7088]", 
      outline: "border-border text-muted-foreground",
      // Category badges - Light/Dark optimized
      bug: "border-[#fb7088]/30 bg-[#fb7088]/10 text-[#fb7088] dark:border-[#fb7088]/30 dark:bg-[#fb7088]/15 dark:text-[#fb7088]", 
      feature: "border-[#6e71f1]/30 bg-[#6e71f1]/10 text-[#6e71f1] dark:border-[#6e71f1]/30 dark:bg-[#6e71f1]/15 dark:text-[#6e71f1]", 
      ux: "border-[#03bcfa]/30 bg-[#03bcfa]/10 text-[#03bcfa] dark:border-[#03bcfa]/30 dark:bg-[#03bcfa]/15 dark:text-[#03bcfa]", 
      performance: "border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/15 dark:text-amber-400",
      other: "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-400/30 dark:bg-slate-400/15 dark:text-slate-400",
      // Status badges
      draft: "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-400/30 dark:bg-slate-400/15 dark:text-slate-400", 
      active: "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/15 dark:text-emerald-400", 
      completed: "border-sky-300 bg-sky-100 text-sky-700 dark:border-sky-400/30 dark:bg-sky-400/15 dark:text-sky-400" 
    } 
  },
  defaultVariants: { variant: "default" },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}
function Badge({ className, variant, ...props }: BadgeProps) { return <div className={cn(badgeVariants({ variant }), className)} {...props} />; }
export { Badge, badgeVariants };
