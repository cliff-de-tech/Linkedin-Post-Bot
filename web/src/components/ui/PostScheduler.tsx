/**
 * Post Scheduler - Schedule LinkedIn posts for later publishing
 * 
 * API TYPES: Uses types from @/types/dashboard (generated from shared/contracts)
 * TO REGENERATE when backend changes: npm run generate:types
 */
import { useState, useEffect } from 'react';
import axios from 'axios';
import { showToast } from '@/lib/toast';
import { CompactCharCounter } from './CharacterCounter';
import type { SchedulePostRequest } from '@/types/dashboard';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ScheduledPost {
    id: number;
    post_content: string;
    image_url: string | null;
    scheduled_time: number;
    status: 'pending' | 'published' | 'failed';
    error_message: string | null;
    created_at: number;
}

interface PostSchedulerProps {
    userId: string;
    postContent: string;
    imageUrl?: string | null;
    onScheduled?: () => void;
    onClose?: () => void;
}


export function PostScheduler({
    userId,
    postContent,
    imageUrl,
    onScheduled,
    onClose
}: PostSchedulerProps) {
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [isScheduling, setIsScheduling] = useState(false);

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];

    // Set minimum time (5 minutes from now if today is selected)
    const getMinTime = () => {
        if (selectedDate === today) {
            const now = new Date();
            now.setMinutes(now.getMinutes() + 5);
            return now.toTimeString().slice(0, 5);
        }
        return '00:00';
    };

    const handleSchedule = async () => {
        if (!selectedDate || !selectedTime) {
            showToast.error('Please select date and time');
            return;
        }

        const scheduledDateTime = new Date(`${selectedDate}T${selectedTime}`);
        const scheduledTimestamp = Math.floor(scheduledDateTime.getTime() / 1000);

        if (scheduledTimestamp <= Date.now() / 1000) {
            showToast.error('Scheduled time must be in the future');
            return;
        }

        setIsScheduling(true);

        try {
            const response = await axios.post(`${API_BASE}/api/scheduled`, {
                user_id: userId,
                post_content: postContent,
                scheduled_time: scheduledTimestamp,
                image_url: imageUrl
            });

            if (response.data.success) {
                showToast.success(`Post scheduled for ${scheduledDateTime.toLocaleString()}`);
                onScheduled?.();
            } else {
                showToast.error(response.data.error || 'Failed to schedule post');
            }
        } catch (error: any) {
            showToast.error(error.message || 'Failed to schedule post');
        } finally {
            setIsScheduling(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 scale-in">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>📅</span>
                Schedule Post
            </h4>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Date</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={today}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Time</label>
                    <input
                        type="time"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        min={getMinTime()}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Preview of scheduled time */}
            {selectedDate && selectedTime && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-400">
                    📌 Will be posted on {new Date(`${selectedDate}T${selectedTime}`).toLocaleString()}
                </div>
            )}

            <div className="flex items-center justify-between">
                <CompactCharCounter text={postContent} />
                <div className="flex gap-2">
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={handleSchedule}
                        disabled={isScheduling || !selectedDate || !selectedTime}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 btn-press"
                    >
                        {isScheduling ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                Scheduling...
                            </>
                        ) : (
                            <>
                                <span>📅</span>
                                Schedule
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Scheduled posts list component
interface ScheduledPostsListProps {
    userId: string;
}

export function ScheduledPostsList({ userId }: ScheduledPostsListProps) {
    const [posts, setPosts] = useState<ScheduledPost[]>([]);
    const [loading, setLoading] = useState(true);

    const loadPosts = async () => {
        try {
            const response = await axios.get(`${API_BASE}/api/scheduled/${userId}`);
            if (response.data.success) {
                setPosts(response.data.posts || []);
            }
        } catch (error) {
            console.error('Failed to load scheduled posts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPosts();
    }, [userId]);

    const handleCancel = async (postId: number) => {
        try {
            const response = await axios.delete(`${API_BASE}/api/scheduled/${postId}?user_id=${userId}`);
            if (response.data.success) {
                showToast.success('Scheduled post cancelled');
                loadPosts();
            } else {
                showToast.error(response.data.error || 'Failed to cancel');
            }
        } catch (error) {
            showToast.error('Failed to cancel post');
        }
    };

    if (loading) {
        return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Loading scheduled posts...
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <span className="text-4xl mb-2 block">📅</span>
                No scheduled posts
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {posts.map(post => (
                <div
                    key={post.id}
                    className={`p-4 rounded-xl border ${post.status === 'published'
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : post.status === 'failed'
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                        }`}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                                {post.post_content.substring(0, 100)}...
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                {post.status === 'published' ? '✅ Published' : post.status === 'failed' ? '❌ Failed' : '⏰'}{' '}
                                {new Date(post.scheduled_time * 1000).toLocaleString()}
                            </p>
                        </div>
                        {post.status === 'pending' && (
                            <button
                                onClick={() => handleCancel(post.id)}
                                className="px-3 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
