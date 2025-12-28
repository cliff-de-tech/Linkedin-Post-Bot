import React from 'react';
import { Skeleton } from '@/components/ui/SkeletonLoader';

interface StatsProps {
    stats: {
        posts_generated: number;
        posts_published: number;
        growth_percentage?: number;  // Week-over-week growth
        posts_this_week?: number;
        posts_last_week?: number;
    } | null;
    loading: boolean;
}

const StatsOverviewComponent: React.FC<StatsProps> = ({ stats, loading }) => {
    // Get growth data
    const growthPercent = stats?.growth_percentage ?? 0;
    const isPositive = growthPercent >= 0;
    const hasNoHistory = (stats?.posts_last_week ?? 0) === 0 && (stats?.posts_this_week ?? 0) > 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8" role="region" aria-label="Dashboard statistics">
            {/* Generated Card */}
            <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-600 dark:text-gray-400 font-medium" id="generated-label">Generated Posts</h3>
                    <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg" aria-hidden="true">
                        <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                </div>
                {loading ? (
                    <Skeleton className="h-8 w-16" />
                ) : (
                    <div className="flex items-baseline gap-2" aria-labelledby="generated-label">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.posts_generated || 0}</span>

                        {/* Dynamic Week-over-Week Percentage */}
                        {hasNoHistory ? (
                            <span className="text-sm text-blue-500 flex items-center" aria-label="New this week">
                                ✨ New!
                            </span>
                        ) : growthPercent !== 0 ? (
                            <span
                                className={`text-sm flex items-center ${isPositive ? 'text-green-500' : 'text-red-500'}`}
                                aria-label={`${Math.abs(growthPercent)} percent ${isPositive ? 'increase' : 'decrease'}`}
                            >
                                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    {isPositive ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                    )}
                                </svg>
                                {isPositive ? '+' : ''}{growthPercent}%
                            </span>
                        ) : (
                            <span className="text-sm text-gray-400 flex items-center">
                                — same as last week
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Published Card */}
            <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-600 dark:text-gray-400 font-medium" id="published-label">Published</h3>
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg" aria-hidden="true">
                        <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
                {loading ? (
                    <Skeleton className="h-8 w-16" />
                ) : (
                    <div className="flex items-baseline gap-2" aria-labelledby="published-label">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.posts_published || 0}</span>
                        <span className="text-sm text-gray-500">this month</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// Memoize to prevent re-renders when props haven't changed
export const StatsOverview = React.memo(StatsOverviewComponent);
