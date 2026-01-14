/**
 * HistoryModal Component
 * 
 * Modal popup showing user's post history with tabs for Published and Scheduled posts.
 */

import React, { useState } from 'react';

interface PostHistoryItem {
    id: string;
    post_content: string;
    status: 'published' | 'scheduled' | 'draft';
    created_at: string;
    scheduled_for?: string;
    linkedin_post_id?: string;
}

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    posts: PostHistoryItem[];
    scheduledPosts?: ScheduledPostItem[];
    loading?: boolean;
}

interface ScheduledPostItem {
    id: number;
    post_content: string;
    image_url?: string;
    scheduled_time: number;
    status: string;
    error_message?: string;
    created_at: number;
    published_at?: number;
}

export default function HistoryModal({ isOpen, onClose, posts, scheduledPosts = [], loading = false }: HistoryModalProps) {
    const [activeTab, setActiveTab] = useState<'published' | 'scheduled'>('published');

    if (!isOpen) return null;

    const publishedPosts = posts.filter(p => p.status === 'published');
    // Use scheduledPosts prop instead of filtering from posts
    const displayPosts = activeTab === 'published' ? publishedPosts : [];
    const displayScheduled = scheduledPosts.filter(p => p.status === 'pending');

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const truncateContent = (content: string, maxLength: number = 120) => {
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength).trim() + '...';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Post History</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {posts.length + scheduledPosts.length} total posts
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('published')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-all relative ${activeTab === 'published'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Published
                            <span className="px-1.5 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700">
                                {publishedPosts.length}
                            </span>
                        </div>
                        {activeTab === 'published' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('scheduled')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-all relative ${activeTab === 'scheduled'
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Scheduled
                            <span className="px-1.5 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700">
                                {displayScheduled.length}
                            </span>
                        </div>
                        {activeTab === 'scheduled' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 dark:bg-orange-400" />
                        )}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        // Loading skeleton
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="animate-pulse p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2" />
                                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/4" />
                                </div>
                            ))}
                        </div>
                    ) : activeTab === 'published' ? (
                        // Published posts
                        displayPosts.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                                    No published posts yet
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Your published posts will appear here
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {displayPosts.map(post => (
                                    <div
                                        key={post.id}
                                        className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-900 dark:text-white mb-2 line-clamp-2">
                                                    {truncateContent(post.post_content)}
                                                </p>
                                                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Published
                                                    </span>
                                                    <span>{formatDate(post.created_at)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        // Scheduled posts
                        displayScheduled.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                                    No scheduled posts yet
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Schedule a post to see it here
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {displayScheduled.map(post => (
                                    <div
                                        key={post.id}
                                        className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-900 dark:text-white mb-2 line-clamp-2">
                                                    {truncateContent(post.post_content)}
                                                </p>
                                                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-3 h-3 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        Scheduled for
                                                    </span>
                                                    <span>{new Date(post.scheduled_time * 1000).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
