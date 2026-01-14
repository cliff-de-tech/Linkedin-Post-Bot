import { ReactNode } from 'react';

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}

export function EmptyState({
    icon,
    title,
    description,
    action,
    className = ''
}: EmptyStateProps) {
    return (
        <div className={`empty-state flex flex-col items-center justify-center p-8 ${className}`}>
            {icon && (
                <div className="w-16 h-16 mb-4 text-gray-400 dark:text-gray-500 flex items-center justify-center text-4xl" aria-hidden="true">
                    {icon}
                </div>
            )}
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {title}
            </h3>
            {description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-4">
                    {description}
                </p>
            )}
            {action && (
                <div className="mt-2">
                    {action}
                </div>
            )}
        </div>
    );
}

// Pre-built empty states for common use cases
export function NoActivitiesState({ onRefresh }: { onRefresh?: () => void }) {
    return (
        <EmptyState
            icon="🔍"
            title="No Activities Found"
            description="We couldn't find any GitHub activity in the selected time range. Try extending the search period."
            action={onRefresh && (
                <button
                    onClick={onRefresh}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                    Try Again
                </button>
            )}
        />
    );
}

export function NoPostsState() {
    return (
        <EmptyState
            icon="📝"
            title="No Posts Yet"
            description="Generate your first post by scanning your GitHub activity and letting AI do the magic."
        />
    );
}

export function NoHistoryState() {
    return (
        <EmptyState
            icon="📜"
            title="No Post History"
            description="Your published posts will appear here. Start by creating and publishing your first post!"
        />
    );
}
