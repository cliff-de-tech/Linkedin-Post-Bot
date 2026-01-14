import { useEffect, useRef, useState } from 'react';
import { CompactCharCounter } from './CharacterCounter';
import { showToast } from '@/lib/toast';

interface PostPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    postContent: string;
    imageUrl?: string | null;
    onPublish?: () => void;
    onEdit?: () => void;
    isPublishing?: boolean;
    testMode?: boolean;
    userName?: string;
    userTitle?: string;
}

/**
 * LinkedIn-native post preview modal with copy, edit, and publish actions.
 * 
 * Features:
 * - LinkedIn-style typography and spacing
 * - Hashtag highlighting
 * - URL detection and linking
 * - Character count with LinkedIn limits
 * - Copy to clipboard
 * - Edit before publish
 */
export function PostPreviewModal({
    isOpen,
    onClose,
    postContent,
    imageUrl,
    onPublish,
    onEdit,
    isPublishing = false,
    testMode = true,
    userName = 'You',
    userTitle = 'Your headline'
}: PostPreviewModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState(false);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    // Handle copy to clipboard
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(postContent);
            setCopied(true);
            showToast.success('Post copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            showToast.error('Failed to copy');
        }
    };

    if (!isOpen) return null;

    // Format post content with LinkedIn-style formatting
    const formatContent = (text: string) => {
        return text.split('\n').map((line, i) => {
            // Split by URLs and hashtags
            const parts = line.split(/(https?:\/\/[^\s]+|#\w+)/g);
            return (
                <span key={i}>
                    {parts.map((part, j) => {
                        if (part.startsWith('#')) {
                            // Hashtag styling
                            return (
                                <span
                                    key={j}
                                    className="text-[#0a66c2] dark:text-blue-400 hover:underline cursor-pointer font-medium"
                                >
                                    {part}
                                </span>
                            );
                        } else if (part.match(/^https?:\/\//)) {
                            // URL styling
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

    const charCount = postContent.length;
    const isOverLimit = charCount > 3000;
    const isNearLimit = charCount > 2700;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                ref={modalRef}
                className="bg-white dark:bg-[#1d2226] rounded-lg shadow-2xl max-w-[552px] w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
            >
                {/* Header - LinkedIn style */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-[16px] font-semibold text-[#000000e6] dark:text-white">
                        Preview your post
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* LinkedIn-style post preview */}
                <div className="overflow-y-auto max-h-[60vh]">
                    <div className="p-4">
                        {/* User guidance banner */}
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                            <div className="flex items-start gap-2">
                                <span className="text-blue-500">💡</span>
                                <div className="text-sm text-blue-700 dark:text-blue-300">
                                    <p className="font-medium mb-1">Review before publishing</p>
                                    <p className="text-blue-600 dark:text-blue-400 text-xs">
                                        Edit your post, add an image, or copy to clipboard. This is exactly how it will appear on LinkedIn.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Post card */}
                        <div className="bg-white dark:bg-[#1d2226] rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                            {/* Author header */}
                            <div className="flex items-start gap-3 p-4 pb-0">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0a66c2] to-[#004182] flex items-center justify-center text-white font-semibold text-lg shrink-0">
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-[14px] text-[#000000e6] dark:text-white leading-tight">
                                        {userName}
                                    </p>
                                    <p className="text-[12px] text-[#00000099] dark:text-gray-400 leading-tight truncate">
                                        {userTitle}
                                    </p>
                                    <p className="text-[12px] text-[#00000099] dark:text-gray-400 leading-tight flex items-center gap-1">
                                        <span>Just now</span>
                                        <span>•</span>
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M8 1a7 7 0 107 7 7 7 0 00-7-7zM3 8a5 5 0 018.48-3.6l-.02.05a4.9 4.9 0 01-1.16 1.42 4.56 4.56 0 01-.77.55 2.21 2.21 0 00-.6.47 1.27 1.27 0 00-.26.82c0 .47.16.82.47 1.12a4.5 4.5 0 001.56.94c1.22.64 2.3 1.63 2.3 3.23a5 5 0 01-10 0z" />
                                        </svg>
                                    </p>
                                </div>
                            </div>

                            {/* Post content */}
                            <div className="px-4 py-3">
                                <div
                                    className="text-[14px] text-[#000000e6] dark:text-gray-200 whitespace-pre-wrap leading-[1.42857]"
                                    style={{ wordBreak: 'break-word' }}
                                >
                                    {formatContent(postContent)}
                                </div>
                            </div>

                            {/* Image preview */}
                            {imageUrl && (
                                <div className="border-t border-gray-100 dark:border-gray-700">
                                    <img
                                        src={imageUrl}
                                        alt="Post image"
                                        className="w-full h-auto max-h-[300px] object-cover"
                                    />
                                </div>
                            )}

                            {/* Engagement bar (mock) */}
                            <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between text-[12px] text-[#00000099] dark:text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <span className="flex">
                                            <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[8px] text-white">👍</span>
                                        </span>
                                        <span className="hover:underline cursor-pointer hover:text-[#0a66c2]">0</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="hover:underline cursor-pointer hover:text-[#0a66c2]">0 comments</span>
                                        <span>•</span>
                                        <span className="hover:underline cursor-pointer hover:text-[#0a66c2]">0 reposts</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action buttons (mock) */}
                            <div className="flex items-center justify-around px-2 py-1 border-t border-gray-100 dark:border-gray-700">
                                {[
                                    { icon: '👍', label: 'Like' },
                                    { icon: '💬', label: 'Comment' },
                                    { icon: '🔄', label: 'Repost' },
                                    { icon: '📤', label: 'Send' }
                                ].map((action) => (
                                    <button
                                        key={action.label}
                                        className="flex items-center gap-2 px-4 py-3 text-[12px] font-medium text-[#00000099] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        disabled
                                    >
                                        <span>{action.icon}</span>
                                        <span>{action.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1d2226]">
                    {/* Character count and warnings */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <CompactCharCounter text={postContent} />
                            {isNearLimit && !isOverLimit && (
                                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                    ⚠️ Approaching limit
                                </span>
                            )}
                            {isOverLimit && (
                                <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                                    ❌ Over 3,000 character limit
                                </span>
                            )}
                        </div>
                        {testMode && (
                            <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-[11px] font-medium">
                                🧪 Test Mode
                            </span>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleCopy}
                            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full font-semibold text-[14px] hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                        >
                            {copied ? (
                                <>
                                    <span>✓</span>
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

                        {onEdit && (
                            <button
                                onClick={() => {
                                    onEdit();
                                    onClose();
                                }}
                                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full font-semibold text-[14px] hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                            </button>
                        )}

                        <button
                            onClick={onPublish}
                            disabled={isPublishing || isOverLimit}
                            className={`flex-[2] px-4 py-2.5 rounded-full font-semibold text-[14px] transition-colors flex items-center justify-center gap-2 ${isOverLimit
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : testMode
                                        ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                        : 'bg-[#0a66c2] hover:bg-[#004182] text-white'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isPublishing ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    Publishing...
                                </>
                            ) : (
                                <>
                                    <span>{testMode ? '🧪' : '🚀'}</span>
                                    {testMode ? 'Test Publish' : 'Post to LinkedIn'}
                                </>
                            )}
                        </button>
                    </div>

                    {/* Safety notice */}
                    {!testMode && (
                        <p className="mt-3 text-center text-[11px] text-gray-500 dark:text-gray-500">
                            This will post directly to your LinkedIn profile. Make sure you've reviewed the content.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
