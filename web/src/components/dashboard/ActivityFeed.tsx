import React from 'react';
import { Skeleton, SkeletonActivityItem } from '@/components/ui/SkeletonLoader';
import { GitHubActivity } from '@/types/dashboard';

interface ActivityFeedProps {
    activities: GitHubActivity[];
    loading: boolean;
    selectedActivity: string | null;
    onSelect: (activity: GitHubActivity) => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
    activities,
    loading,
    selectedActivity,
    onSelect
}) => {
    if (loading) {
        return (
            <div className="space-y-4" role="status" aria-label="Loading activities">
                {[1, 2, 3].map((i) => (
                    <SkeletonActivityItem key={i} />
                ))}
                <span className="sr-only">Loading GitHub activities...</span>
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="text-center py-10 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 border-dashed" role="status">
                <div className="text-4xl mb-3" aria-hidden="true">🔗</div>
                <p className="text-gray-900 dark:text-white font-medium mb-1">No GitHub activity found</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Connect your GitHub account to see your recent activity here
                </p>
                <a
                    href="/settings"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Go to Settings
                </a>
            </div>
        );
    }

    return (
        <div className="space-y-4" role="list" aria-label="GitHub activities">
            {activities.map((activity) => (
                <button
                    key={activity.id}
                    type="button"
                    onClick={() => onSelect(activity)}
                    aria-pressed={selectedActivity === activity.id}
                    aria-label={`Select activity: ${activity.title}`}
                    className={`group w-full text-left cursor-pointer relative bg-slate-50 dark:bg-white/5 border rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm ${selectedActivity === activity.id
                        ? 'border-blue-500 ring-1 ring-blue-500 dark:bg-blue-500/10'
                        : 'border-slate-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-white/20'
                        }`}
                    role="listitem"
                >
                    <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-inner ${selectedActivity === activity.id
                            ? 'bg-blue-100 dark:bg-blue-500/20'
                            : 'bg-gray-50 dark:bg-white/5 group-hover:bg-blue-50 dark:group-hover:bg-white/10'
                            } transition-colors`} aria-hidden="true">
                            {activity.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <h4 className={`font-semibold truncate pr-2 ${selectedActivity === activity.id
                                    ? 'text-blue-700 dark:text-blue-300'
                                    : 'text-gray-900 dark:text-white'
                                    }`}>
                                    {activity.title}
                                </h4>
                                <span className="text-xs text-gray-500 whitespace-nowrap bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-full">
                                    <time>{activity.time_ago}</time>
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                {activity.description}
                            </p>
                            {activity.repo && (
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded border border-gray-200 dark:border-white/5">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                                        </svg>
                                        {activity.repo}
                                    </span>
                                </div>
                            )}

                        </div>
                        {selectedActivity === activity.id && (
                            <div className="absolute top-1/2 right-4 transform -translate-y-1/2" aria-hidden="true">
                                <svg className="w-5 h-5 text-blue-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        )}
                    </div>
                </button>
            ))}
        </div>
    );
};

