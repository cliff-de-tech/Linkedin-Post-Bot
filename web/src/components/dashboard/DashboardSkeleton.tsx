/**
 * DashboardSkeleton - Loading skeleton for dashboard
 * 
 * Displays a skeleton layout that mimics the dashboard structure
 * to prevent layout shift (CLS) during data loading.
 */

import { Skeleton, StatSkeleton, ActivitySkeleton } from '@/components/ui/Skeleton';

export default function DashboardSkeleton() {
    return (
        <div className="min-h-screen p-6 md:p-8">
            {/* Header skeleton */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <Skeleton width={200} height={32} className="mb-2" />
                    <Skeleton width={300} height={16} />
                </div>
                <div className="flex gap-3">
                    <Skeleton width={100} height={40} className="rounded-lg" />
                    <Skeleton width={100} height={40} className="rounded-lg" />
                </div>
            </div>

            {/* Usage bar skeleton */}
            <div className="mb-6 bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                    <Skeleton width={120} height={14} />
                    <Skeleton width={60} height={14} />
                </div>
                <Skeleton height={8} className="rounded-full" />
            </div>

            {/* Stats row skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatSkeleton />
                <StatSkeleton />
                <StatSkeleton />
                <StatSkeleton />
            </div>

            {/* Main content area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column - Activity feed skeleton */}
                <div className="lg:col-span-1">
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                        <Skeleton width={150} height={24} className="mb-4" />
                        <div className="space-y-3">
                            <ActivitySkeleton />
                            <ActivitySkeleton />
                            <ActivitySkeleton />
                            <ActivitySkeleton />
                            <ActivitySkeleton />
                        </div>
                    </div>
                </div>

                {/* Right column - Post editor skeleton */}
                <div className="lg:col-span-2">
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                        <Skeleton width={200} height={24} className="mb-4" />
                        <Skeleton height={200} className="mb-4 rounded-xl" />
                        <div className="flex justify-end gap-3">
                            <Skeleton width={120} height={44} className="rounded-lg" />
                            <Skeleton width={120} height={44} className="rounded-lg" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
