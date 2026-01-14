interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    count?: number;
}

export function Skeleton({
    className = '',
    variant = 'rectangular',
    width,
    height,
    count = 1
}: SkeletonProps) {
    const baseClasses = 'skeleton rounded animate-pulse';

    const variantClasses = {
        text: 'h-4 rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-lg'
    };

    const style = {
        width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
    };

    if (count > 1) {
        return (
            <div className="space-y-2">
                {Array.from({ length: count }).map((_, i) => (
                    <div
                        key={i}
                        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
                        style={style}
                    />
                ))}
            </div>
        );
    }

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    );
}

// Pre-built skeleton patterns for common use cases
export function CardSkeleton() {
    return (
        <div className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/10">
            <div className="flex items-center gap-4 mb-4">
                <Skeleton variant="circular" width={48} height={48} />
                <div className="flex-1">
                    <Skeleton width="60%" height={16} className="mb-2" />
                    <Skeleton width="40%" height={12} />
                </div>
            </div>
            <Skeleton height={80} className="mb-4" />
            <div className="flex gap-2">
                <Skeleton width={80} height={32} />
                <Skeleton width={80} height={32} />
            </div>
        </div>
    );
}

export function ActivitySkeleton() {
    return (
        <div className="flex items-start gap-3 p-3 rounded-lg">
            <Skeleton variant="circular" width={36} height={36} />
            <div className="flex-1">
                <Skeleton width="80%" height={14} className="mb-2" />
                <Skeleton width="50%" height={12} />
            </div>
        </div>
    );
}

export function StatSkeleton() {
    return (
        <div className="bg-white dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/10">
            <Skeleton width={60} height={12} className="mb-2" />
            <Skeleton width={80} height={28} />
        </div>
    );
}

// Specialized Skeletons (migrated from SkeletonLoader)

export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
                />
            ))}
        </div>
    );
}

export function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
    };
    return <Skeleton className={`${sizeClasses[size]} rounded-full`} />;
}

export function SkeletonStatCard() {
    return (
        <div className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/10">
            <div className="flex items-center justify-between mb-4">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="w-16 h-6 rounded-full" />
            </div>
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-4 w-32" />
        </div>
    );
}

export function SkeletonActivityItem() {
    return (
        <div className="flex items-start gap-3 p-4 border border-gray-100 dark:border-white/10 rounded-xl">
            <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
            </div>
        </div>
    );
}

export function SkeletonPostCard() {
    return (
        <div className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/10">
            <div className="flex items-center gap-3 mb-4">
                <SkeletonAvatar size="md" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </div>
            <SkeletonText lines={4} />
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10 flex gap-4">
                <Skeleton className="h-8 w-16 rounded" />
                <Skeleton className="h-8 w-20 rounded" />
                <Skeleton className="h-8 w-16 rounded" />
            </div>
        </div>
    );
}
