import { useState } from 'react';
import { CompactCharCounter } from '@/components/ui/CharacterCounter';
import { PostPreviewModal } from '@/components/ui/PostPreviewModal';
import { showToast } from '@/lib/toast';

interface Post {
    id: string;
    activity_id: string;
    activity_type: string;
    activity_title: string;
    content: string | null;
    status: 'pending' | 'published' | 'failed' | 'editing';
    image_url: string | null;
    error?: string;
}

interface PostQueuePanelProps {
    posts: Post[];
    onEdit: (postId: string, newContent: string) => void;
    onPublish: (postId: string) => void;
    onDiscard: (postId: string) => void;
    onSelectImage: (postId: string) => void;
    isPublishing: string | null;
    testMode: boolean;
}

/**
 * Post Queue Panel - Displays generated posts with edit, preview, and publish options.
 * 
 * Features:
 * - LinkedIn-native styling
 * - Edit before publish/copy
 * - Preview modal with LinkedIn layout
 * - Copy to clipboard
 * - Clear user guidance
 */
export function PostQueuePanel({
    posts,
    onEdit,
    onPublish,
    onDiscard,
    onSelectImage,
    isPublishing,
    testMode
}: PostQueuePanelProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [previewPost, setPreviewPost] = useState<Post | null>(null);

    const handleStartEdit = (post: Post) => {
        setEditingId(post.id);
        setEditContent(post.content || '');
    };

    const handleSaveEdit = (postId: string) => {
        onEdit(postId, editContent);
        setEditingId(null);
        setEditContent('');
        showToast.success('Changes saved');
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditContent('');
    };

    const handleCopyToClipboard = async (content: string) => {
        try {
            await navigator.clipboard.writeText(content);
            showToast.success('Post copied to clipboard!');
        } catch {
            showToast.error('Failed to copy');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, { bg: string; text: string; icon: string }> = {
            pending: {
                bg: 'bg-amber-100 dark:bg-amber-900/30',
                text: 'text-amber-800 dark:text-amber-400',
                icon: '⏳'
            },
            published: {
                bg: 'bg-green-100 dark:bg-green-900/30',
                text: 'text-green-800 dark:text-green-400',
                icon: '✅'
            },
            failed: {
                bg: 'bg-red-100 dark:bg-red-900/30',
                text: 'text-red-800 dark:text-red-400',
                icon: '❌'
            },
            editing: {
                bg: 'bg-blue-100 dark:bg-blue-900/30',
                text: 'text-blue-800 dark:text-blue-400',
                icon: '✏️'
            }
        };
        return styles[status] || styles.pending;
    };

    const getTypeIcon = (type: string) => {
        const icons: Record<string, string> = {
            push: '🚀',
            pull_request: '🔀',
            new_repo: '✨',
            issue: '🐛',
            release: '🎉'
        };
        return icons[type] || '📦';
    };

    if (posts.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
                <div className="text-5xl mb-4">📭</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No posts in queue
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    Scan your GitHub activity to generate posts. You can edit, preview, and publish them here.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                {/* Header with guidance */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Post Queue ({posts.length})
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Review and edit your posts before publishing
                        </p>
                    </div>
                    {testMode && (
                        <span className="px-3 py-1.5 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 rounded-full text-sm font-medium flex items-center gap-1.5">
                            <span>🧪</span>
                            Test Mode
                        </span>
                    )}
                </div>

                {/* Quick actions guidance */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-100 dark:border-blue-800 mb-4">
                    <div className="flex items-start gap-2 text-sm">
                        <span className="text-blue-500 text-lg">💡</span>
                        <div>
                            <p className="font-medium text-blue-900 dark:text-blue-200 mb-1">Quick Tips</p>
                            <ul className="text-blue-700 dark:text-blue-300 text-xs space-y-0.5">
                                <li>• <strong>Preview</strong> to see how your post will look on LinkedIn</li>
                                <li>• <strong>Edit</strong> to customize the content before publishing</li>
                                <li>• <strong>Add Image</strong> to include a visual with your post</li>
                                <li>• <strong>Copy</strong> to paste directly into LinkedIn</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {posts.map((post, index) => {
                        const statusStyle = getStatusBadge(post.status);
                        const isExpanded = expandedId === post.id || posts.length <= 3;

                        return (
                            <div
                                key={post.id}
                                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800"
                            >
                                {/* Header */}
                                <div
                                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 cursor-pointer"
                                    onClick={() => setExpandedId(isExpanded && posts.length > 3 ? null : post.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl">
                                            {getTypeIcon(post.activity_type)}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                                                {post.activity_title || `${post.activity_type} activity`}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                                                    {statusStyle.icon} {post.status}
                                                </span>
                                                {post.image_url && (
                                                    <span className="text-green-500 text-xs" title="Image attached">🖼️ Image</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-400">#{index + 1}</span>
                                        <button
                                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
                                        >
                                            <svg
                                                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                {isExpanded && (
                                    <div className="p-4">
                                        {editingId === post.id ? (
                                            /* Editing mode */
                                            <div className="space-y-3">
                                                <div className="relative">
                                                    <textarea
                                                        value={editContent}
                                                        onChange={(e) => setEditContent(e.target.value)}
                                                        className="w-full h-56 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm leading-relaxed"
                                                        placeholder="Write your post content..."
                                                        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
                                                    />
                                                    {editContent.length > 2700 && (
                                                        <div className={`absolute bottom-3 right-3 text-xs font-medium ${editContent.length > 3000 ? 'text-red-500' : 'text-amber-500'
                                                            }`}>
                                                            {editContent.length > 3000 ? '❌' : '⚠️'} {editContent.length}/3000
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <CompactCharCounter text={editContent} />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={handleCancelEdit}
                                                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => handleSaveEdit(post.id)}
                                                            disabled={editContent.length > 3000}
                                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            Save Changes
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            /* View mode */
                                            <>
                                                {post.content ? (
                                                    <div
                                                        className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed"
                                                        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
                                                    >
                                                        {post.content.length > 300 && expandedId !== post.id ? (
                                                            <>
                                                                {post.content.slice(0, 300)}...
                                                                <button
                                                                    onClick={() => setExpandedId(post.id)}
                                                                    className="text-blue-600 dark:text-blue-400 ml-1 hover:underline"
                                                                >
                                                                    see more
                                                                </button>
                                                            </>
                                                        ) : (
                                                            post.content
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-red-500 flex items-center gap-2">
                                                        <span>❌</span>
                                                        Failed to generate: {post.error || 'Unknown error'}
                                                    </p>
                                                )}

                                                {/* Image preview */}
                                                {post.image_url && (
                                                    <div className="mt-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                                                        <img
                                                            src={post.image_url}
                                                            alt="Post image"
                                                            className="w-full h-40 object-cover"
                                                        />
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                {post.content && editingId !== post.id && (
                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                                        <div className="flex gap-2">
                                            {/* Preview button */}
                                            <button
                                                onClick={() => setPreviewPost(post)}
                                                className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1.5 font-medium"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                Preview
                                            </button>

                                            {/* Edit button */}
                                            <button
                                                onClick={() => handleStartEdit(post)}
                                                className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-1.5"
                                            >
                                                ✏️ Edit
                                            </button>

                                            {/* Copy button */}
                                            <button
                                                onClick={() => handleCopyToClipboard(post.content!)}
                                                className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-1.5"
                                            >
                                                📋 Copy
                                            </button>

                                            {/* Image button */}
                                            <button
                                                onClick={() => onSelectImage(post.id)}
                                                className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-1.5"
                                            >
                                                🖼️ {post.image_url ? 'Change' : 'Add'} Image
                                            </button>

                                            {/* Discard button */}
                                            <button
                                                onClick={() => onDiscard(post.id)}
                                                className="px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1.5"
                                            >
                                                🗑️
                                            </button>
                                        </div>

                                        {/* Publish button */}
                                        <button
                                            onClick={() => onPublish(post.id)}
                                            disabled={isPublishing === post.id || post.status === 'published'}
                                            className={`px-4 py-2 text-sm rounded-lg font-semibold transition-all flex items-center gap-2 ${post.status === 'published'
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 cursor-not-allowed'
                                                    : isPublishing === post.id
                                                        ? 'bg-blue-400 text-white cursor-wait'
                                                        : testMode
                                                            ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg'
                                                            : 'bg-[#0a66c2] hover:bg-[#004182] text-white shadow-md hover:shadow-lg'
                                                }`}
                                        >
                                            {isPublishing === post.id ? (
                                                <>
                                                    <span className="animate-spin">⏳</span>
                                                    Publishing...
                                                </>
                                            ) : post.status === 'published' ? (
                                                <>
                                                    <span>✅</span>
                                                    Published
                                                </>
                                            ) : testMode ? (
                                                <>
                                                    <span>🧪</span>
                                                    Test Publish
                                                </>
                                            ) : (
                                                <>
                                                    <span>🚀</span>
                                                    Publish
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Preview Modal */}
            {previewPost && (
                <PostPreviewModal
                    isOpen={true}
                    onClose={() => setPreviewPost(null)}
                    postContent={previewPost.content || ''}
                    imageUrl={previewPost.image_url}
                    onEdit={() => {
                        handleStartEdit(previewPost);
                        setPreviewPost(null);
                    }}
                    onPublish={() => {
                        onPublish(previewPost.id);
                        setPreviewPost(null);
                    }}
                    isPublishing={isPublishing === previewPost.id}
                    testMode={testMode}
                />
            )}
        </>
    );
}

export default PostQueuePanel;
