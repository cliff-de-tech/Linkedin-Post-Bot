import React from 'react';

interface AnalyticsData {
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    postsScheduled: number;
    postsThisMonth: number;
    postsThisWeek: number;
    avgEngagement?: number;
    topPerformingPost?: {
        title: string;
        engagement: number;
    };
}

interface AnalyticsProps {
    data?: AnalyticsData;
    loading?: boolean;
}

/**
 * Analytics component showing post performance metrics
 */
const Analytics: React.FC<AnalyticsProps> = ({ data, loading }) => {
    // Default data for demonstration
    const analytics = data || {
        totalPosts: 0,
        publishedPosts: 0,
        draftPosts: 0,
        postsScheduled: 0,
        postsThisMonth: 0,
        postsThisWeek: 0,
        avgEngagement: 0,
    };

    if (loading) {
        return (
            <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm" role="status" aria-label="Loading analytics">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Analytics Overview</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">Last 30 days</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {/* Total Posts */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-500/10 dark:to-blue-600/10 rounded-xl p-4">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {analytics.totalPosts}
                    </div>
                    <div className="text-sm text-blue-600/70 dark:text-blue-400/70">Total Posts</div>
                </div>

                {/* Published */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-500/10 dark:to-green-600/10 rounded-xl p-4">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {analytics.publishedPosts}
                    </div>
                    <div className="text-sm text-green-600/70 dark:text-green-400/70">Published</div>
                </div>

                {/* Drafts */}
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-500/10 dark:to-yellow-600/10 rounded-xl p-4">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {analytics.draftPosts}
                    </div>
                    <div className="text-sm text-yellow-600/70 dark:text-yellow-400/70">Drafts</div>
                </div>

                {/* Scheduled */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-500/10 dark:to-orange-600/10 rounded-xl p-4">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {analytics.postsScheduled}
                    </div>
                    <div className="text-sm text-orange-600/70 dark:text-orange-400/70">Scheduled</div>
                </div>
            </div>

            {/* Activity Chart Placeholder */}
            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Post Activity</h4>
                <div className="flex items-end gap-1 h-24">
                    {[30, 45, 20, 55, 40, 60, 35, 50, 25, 70, 45, 55].map((height, i) => (
                        <div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t opacity-70 hover:opacity-100 transition-opacity"
                            style={{ height: `${height}%` }}
                            title={`Week ${i + 1}`}
                        />
                    ))}
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>12 weeks ago</span>
                    <span>Now</span>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                            +{Math.round((analytics.postsThisWeek / Math.max(analytics.postsThisMonth, 1)) * 100)}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">vs last week</div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </div>
                    <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {analytics.avgEngagement || 0}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Avg. views/post</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
