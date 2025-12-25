import React from 'react';
import { PostContext } from '@/types/dashboard';
import { showToast } from '@/lib/toast';

interface PostEditorProps {
    context: PostContext;
    setContext: (context: PostContext) => void;
    onGenerate: () => void;
    onPublish: (testMode: boolean) => void;
    loading: boolean;
    status: string;
    hasPreview: boolean;
    tier?: string;  // User's subscription tier
}

// Post type options with free tier availability
const POST_TYPES = [
    { value: 'push', label: 'Push Event', icon: '🚀', freeAvailable: true },
    { value: 'generic', label: 'Generic Post', icon: '📝', freeAvailable: true },
    { value: 'pull_request', label: 'Pull Request', icon: '🔀', freeAvailable: false },
    { value: 'new_repo', label: 'New Repository', icon: '✨', freeAvailable: false },
];

export const PostEditor: React.FC<PostEditorProps> = ({
    context,
    setContext,
    onGenerate,
    onPublish,
    loading,
    status,
    hasPreview,
    tier = 'free'
}) => {
    const handlePostTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value;
        const postType = POST_TYPES.find(p => p.value === newType);

        if (tier === 'free' && postType && !postType.freeAvailable) {
            showToast.error('🔒 This post type is a Pro feature!');
            return;
        }
        setContext({ ...context, type: newType });
    };

    return (
        <div className="bg-slate-50 dark:bg-white/5 rounded-2xl shadow-md border border-slate-200 dark:border-white/10 p-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Post Context</h3>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                </div>
            </div>

            <div className="space-y-5">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Post Type
                        {tier === 'free' && <span className="ml-2 text-orange-500 text-xs">🔒 Some types locked</span>}
                    </label>
                    <select
                        value={context.type}
                        onChange={handlePostTypeChange}
                        className="w-full bg-white dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 dark:text-white"
                        aria-label="Post type"
                    >
                        {POST_TYPES.map((type) => (
                            <option
                                key={type.value}
                                value={type.value}
                                disabled={tier === 'free' && !type.freeAvailable}
                            >
                                {type.icon} {type.label} {tier === 'free' && !type.freeAvailable ? '🔒 Pro' : ''}
                            </option>
                        ))}
                    </select>
                    {tier === 'free' && (
                        <p className="mt-1 text-xs text-orange-500">
                            Pro: Unlock Pull Request & New Repo post types
                        </p>
                    )}
                </div>

                {context.type === 'push' && (
                    <>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Number of Commits</label>
                            <input
                                type="number"
                                value={context.commits}
                                onChange={(e) => setContext({ ...context, commits: parseInt(e.target.value) })}
                                className="w-full bg-white dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 dark:text-white"
                                min="1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Repository Name</label>
                            <input
                                type="text"
                                value={context.repo}
                                onChange={(e) => setContext({ ...context, repo: e.target.value })}
                                className="w-full bg-white dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 dark:text-white"
                                placeholder="my-awesome-project"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Repository Path</label>
                            <input
                                type="text"
                                value={context.full_repo}
                                onChange={(e) => setContext({ ...context, full_repo: e.target.value })}
                                className="w-full bg-white dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 dark:text-white"
                                placeholder="username/my-awesome-project"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Time Ago</label>
                            <input
                                type="text"
                                value={context.date}
                                onChange={(e) => setContext({ ...context, date: e.target.value })}
                                className="w-full bg-white dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 dark:text-white"
                                placeholder="2 hours ago"
                            />
                        </div>
                    </>
                )}

                {/* Action Buttons */}
                <div className="pt-6 border-t border-gray-200 dark:border-white/10">
                    <button
                        onClick={onGenerate}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center mb-3"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Generate Preview
                            </>
                        )}
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => onPublish(true)}
                            disabled={loading || !hasPreview}
                            className="bg-green-600 dark:bg-green-600/90 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center border border-transparent shadow-md"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Test Mode
                        </button>
                        <button
                            onClick={() => onPublish(false)}
                            disabled={loading || !hasPreview}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-md"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            Publish
                        </button>
                    </div>
                </div>

                {status && (
                    <div className={`mt-4 p-4 rounded-lg border-2 ${status.includes('❌')
                        ? 'bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-200 border-red-200 dark:border-red-900/30'
                        : 'bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-200 border-green-200 dark:border-green-900/30'
                        } flex items-start`}>
                        <span className="text-lg mr-2">{status.includes('❌') ? '❌' : '✨'}</span>
                        <span className="flex-1">{status.replace(/[❌✨🚀📝]/g, '').trim()}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
