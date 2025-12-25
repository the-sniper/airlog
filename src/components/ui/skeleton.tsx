import { cn } from "@/lib/utils";

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-lg bg-muted/50",
                className
            )}
            {...props}
        />
    );
}

// Pre-built skeleton patterns for common use cases
function SkeletonText({
    lines = 3,
    className,
}: {
    lines?: number;
    className?: string;
}) {
    return (
        <div className={cn("space-y-2", className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={cn(
                        "h-4",
                        i === lines - 1 ? "w-3/4" : "w-full"
                    )}
                />
            ))}
        </div>
    );
}

function SkeletonCard({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "rounded-xl border border-border/50 bg-card p-4 space-y-4",
                className
            )}
        >
            <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                </div>
            </div>
            <SkeletonText lines={2} />
        </div>
    );
}

function SkeletonListItem({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "flex items-center gap-3 p-3 rounded-lg bg-secondary/30",
                className
            )}
        >
            <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="w-16 h-8 rounded-lg shrink-0" />
        </div>
    );
}

function SkeletonAvatar({ className }: { className?: string }) {
    return (
        <Skeleton className={cn("w-10 h-10 rounded-full shrink-0", className)} />
    );
}

function SkeletonButton({ className }: { className?: string }) {
    return (
        <Skeleton className={cn("h-10 w-24 rounded-lg", className)} />
    );
}

function SkeletonBadge({ className }: { className?: string }) {
    return (
        <Skeleton className={cn("h-6 w-16 rounded-full", className)} />
    );
}

function SkeletonInput({ className }: { className?: string }) {
    return (
        <Skeleton className={cn("h-10 w-full rounded-lg", className)} />
    );
}

function SkeletonTable({
    rows = 5,
    columns = 4,
    className,
}: {
    rows?: number;
    columns?: number;
    className?: string;
}) {
    return (
        <div className={cn("space-y-3", className)}>
            {/* Header */}
            <div className="flex gap-4 pb-2 border-b border-border/50">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} className="h-4 flex-1" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex gap-4">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton
                            key={colIndex}
                            className={cn(
                                "h-4 flex-1",
                                colIndex === 0 && "w-1/4 flex-none"
                            )}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

export {
    Skeleton,
    SkeletonText,
    SkeletonCard,
    SkeletonListItem,
    SkeletonAvatar,
    SkeletonButton,
    SkeletonBadge,
    SkeletonInput,
    SkeletonTable,
};
