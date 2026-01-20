import React, { useState } from 'react';
import Image from 'next/image';
import { showToast } from '@/lib/toast';

interface PostPreviewProps {
    preview: string;
    imageUrl?: string | null;
    onEdit?: (newContent?: string) => void;
    isEditing?: boolean;
    onToggleEditing?: (editing: boolean) => void;
}

/**
 * PostPreview - Shows the generated post with LinkedIn-native styling.
...
 */
const PostPreviewComponent: React.FC<PostPreviewProps> = ({
    preview,
    imageUrl,
    onEdit,
    isEditing = false,
    onToggleEditing
}) => {
    const [copied, setCopied] = useState(false);
    const [editContent, setEditContent] = useState(preview);

    // Sync edit content when preview changes (unless currently editing)
    React.useEffect(() => {
        if (!isEditing) {
            setEditContent(preview);
        }
    }, [preview, isEditing]);

    const handleCopy = async () => {
        if (!preview) return;
        try {
            await navigator.clipboard.writeText(preview);
            setCopied(true);
            showToast.success('Copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            showToast.error('Failed to copy');
        }
    };

    const handleSaveEdit = () => {
        if (onEdit) {
            // onEdit prop now handles saving content
        }
        if (onToggleEditing) onToggleEditing(false);
    };

    // Format content with LinkedIn-style highlighting
    const formatContent = (text: string) => {
        return text.split('\n').map((line, i) => {
            const parts = line.split(/(https?:\/\/[^\s]+|#\w+)/g);
            return (
                <span key={i}>
                    {parts.map((part, j) => {
                        if (part.startsWith('#')) {
                            return (
                                <span key={j} className="text-[#0a66c2] dark:text-blue-400 font-medium">
                                    {part}
                                </span>
                            );
                        } else if (part.match(/^https?:\/\//)) {
                            return (
                                <a
                                    key={j}
                                    href={part}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#0a66c2] dark:text-blue-400 hover:underline break-all"
                                >
                                    {part}
                                </a>
                            );
                        }
                        return <span key={j}>{part}</span>;
                    })}
                    {i < text.split('\n').length - 1 && <br />}
                </span>
            );
        });
    };

    const displayContent = isEditing ? editContent : preview;
    const charCount = displayContent?.length || 0;
    const isNearLimit = charCount > 2700;
    const isOverLimit = charCount > 3000;

    return (
        <div className="bg-slate-50 dark:bg-white/5 rounded-2xl shadow-md border border-slate-200 dark:border-white/10 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#0a66c2] to-[#004182] rounded-lg flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">LinkedIn Preview</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">How your post will appear</p>
                    </div>
                </div>

                {(preview || isEditing) && (
                    <div className="flex items-center gap-2">
                        {!isEditing ? (
                            <>
                                <button
                                    onClick={() => {
                                        if (onToggleEditing) onToggleEditing(true);
                                        setEditContent(preview);
                                    }}
                                    className="px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all flex items-center gap-1.5"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit
                                </button>
                                <button
                                    onClick={handleCopy}
                                    className={`px-3 py-2 text-sm rounded-lg transition-all flex items-center gap-1.5 ${copied
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                        : 'bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200'
                                        }`}
                                >
                                    {copied ? (
                                        <>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            Copy
                                        </>
                                    )}
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => {
                                        if (onToggleEditing) onToggleEditing(false);
                                    }}
                                    className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        if (onEdit) onEdit(editContent);
                                        if (onToggleEditing) onToggleEditing(false);
                                        showToast.success('Changes saved');
                                    }}
                                    className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium"
                                >
                                    Save
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Post Preview Card */}
            <div
                className={`bg-gray-50 dark:bg-[#1d2226] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden ${isEditing ? 'h-[400px]' : 'max-h-[350px] overflow-y-auto'}`}
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
            >
                {preview || isEditing ? (
                    <>
                        {/* Author header */}
                        <div className="flex items-start gap-3 p-4 pb-0">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0a66c2] to-[#004182] flex items-center justify-center text-white font-semibold text-lg shrink-0">
                                Y
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">Your Name</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">Your headline</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight flex items-center gap-1 mt-0.5">
                                    <span>Just now</span>
                                    <span>•</span>
                                    <span>🌐</span>
                                </p>
                            </div>
                        </div>

                        {/* Post content */}
                        <div className="flex-1 px-4 py-3 h-full">
                            {isEditing ? (
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full h-[calc(100%-2rem)] bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Write your post here..."
                                    autoFocus
                                />
                            ) : (
                                <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                                    {formatContent(preview)}
                                </div>
                            )}
                        </div>

                        {/* Image if present */}
                        {!isEditing && imageUrl && (
                            <div className="border-t border-gray-100 dark:border-gray-700 relative w-full h-32">
                                <Image
                                    src={imageUrl}
                                    alt="Post image"
                                    fill
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    className="object-cover"
                                    priority
                                />
                            </div>
                        )}

                        {/* Engagement bar */}
                        {!isEditing && (
                            <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 mt-auto">
                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                                    <span>👍 0</span>
                                    <span>0 comments • 0 reposts</span>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    /* Empty state */
                    <div className="h-full flex flex-col items-center justify-center text-center p-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-white/10 dark:to-white/5 rounded-2xl flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-gray-400 dark:text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium mb-2">No preview yet</p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm max-w-xs">
                            Click a GitHub activity or use a template to generate your post
                        </p>
                    </div>
                )}
            </div>

            {/* Footer with character count and tips */}
            {(preview || isEditing) && (
                <div className="mt-4 space-y-3">
                    {/* Character count */}
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <span className={`font-medium ${isOverLimit ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-gray-600 dark:text-gray-400'
                                }`}>
                                {charCount.toLocaleString()} / 3,000 characters
                            </span>
                            {isOverLimit && <span className="text-red-600 text-xs">❌ Over limit</span>}
                            {isNearLimit && !isOverLimit && <span className="text-amber-600 text-xs">⚠️ Near limit</span>}
                        </div>
                        <span className="text-gray-400 text-xs">
                            ~{Math.ceil(charCount / 250)} min read
                        </span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ${isOverLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-[#0a66c2]'
                                }`}
                            style={{ width: `${Math.min(100, (charCount / 3000) * 100)}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

// Memoize to prevent re-renders when props haven't changed
export const PostPreview = React.memo(PostPreviewComponent);
