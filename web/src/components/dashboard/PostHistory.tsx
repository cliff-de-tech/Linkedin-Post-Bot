import React from 'react';

// Post interface matching the API response from /api/posts/{user_id}
export interface Post {
    id: number;
    post_content: string;
    post_type: string;
    context: Record<string, unknown>;
    status: string;
    linkedin_post_id: string | null;
    engagement: Record<string, unknown>;
    created_at: number;
    published_at: number | null;
}


interface PostHistoryProps {
    posts: Post[];
    isOpen: boolean;
    onClose: () => void;
    onSelect: (content: string) => void;
    formatDate: (timestamp: number) => string;
}

export const PostHistory: React.FC<PostHistoryProps> = ({
    posts,
    isOpen,
    onClose,
    onSelect,
    formatDate
}) => {
    if (!isOpen) return null;

    return (
        <div className="mb-8 bg-slate-50 dark:bg-white/5 rounded-2xl shadow-md border border-slate-200 dark:border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Post History</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" aria-label="Close post history">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {posts.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No posts yet. Generate your first post!</p>
                ) : (
                    posts.map((post) => (
                        <div key={post.id} className="p-4 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded ${post.status === 'published'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                            }`}>
                                            {post.status}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(post.created_at)}</span>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{post.post_content}</p>
                                </div>
                                <button
                                    onClick={() => onSelect(post.post_content)}
                                    className="ml-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium whitespace-nowrap"
                                >
                                    View
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
