import React, { useState } from 'react';
import { PostContext } from '@/types/dashboard';
import { showToast } from '@/lib/toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';

// AI Model options with tier restrictions
type ModelProvider = 'groq' | 'openai' | 'anthropic';

interface AIModel {
    value: ModelProvider;
    label: string;
    description: string;
    icon: string;
    proOnly: boolean;
}

const AI_MODELS: AIModel[] = [
    {
        value: 'groq',
        label: 'Llama 3 (Groq)',
        description: 'Fast & Free',
        icon: '⚡',
        proOnly: false
    },
    {
        value: 'openai',
        label: 'GPT-4o (OpenAI)',
        description: 'High Intelligence',
        icon: '🧠',
        proOnly: true
    },
    {
        value: 'anthropic',
        label: 'Claude 3.5 (Anthropic)',
        description: 'Natural Writing',
        icon: '✨',
        proOnly: true
    },
];

interface PostEditorProps {
    context: PostContext;
    setContext: (context: PostContext) => void;
    onGenerate: (model: ModelProvider) => void;  // Now passes selected model
    onPublish: (testMode: boolean) => void;
    onWriteManually?: () => void;
    loading: boolean;
    status: string;
    hasPreview: boolean;
    tier?: string;  // User's subscription tier: 'free' | 'pro' | 'enterprise'
    // Image support
    selectedImage?: string | null;
    onImageClick?: () => void;
    onRemoveImage?: () => void;
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
    onWriteManually,
    loading,
    status,
    hasPreview,
    tier = 'free',
    selectedImage = null,
    onImageClick,
    onRemoveImage
}) => {
    // State for selected AI model
    const [selectedModel, setSelectedModel] = useState<ModelProvider>('groq');

    const handlePostTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value;
        const postType = POST_TYPES.find(p => p.value === newType);

        if (tier === 'free' && postType && !postType.freeAvailable) {
            showToast.error('🔒 This post type is a Pro feature!');
            return;
        }
        setContext({ ...context, type: newType });
    };

    const handleModelChange = (model: ModelProvider) => {
        const modelInfo = AI_MODELS.find(m => m.value === model);

        // Check if free user trying to select pro model
        if (tier === 'free' && modelInfo?.proOnly) {
            showToast.error('🔒 Upgrade to Pro to use premium AI models!');
            return;
        }
        setSelectedModel(model);
    };

    const handleGenerateClick = () => {
        onGenerate(selectedModel);
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
                    <Select
                        value={context.type}
                        onChange={handlePostTypeChange}
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
                    </Select>
                    {tier === 'free' && (
                        <p className="mt-1 text-xs text-orange-500">
                            Pro: Unlock Pull Request & New Repo post types
                        </p>
                    )}
                </div>

                {context.type === 'push' && (
                    <>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Commits in this Push
                                <span className="ml-2 text-xs text-gray-500 font-normal">(editable)</span>
                            </label>
                            <Input
                                type="number"
                                value={context.commits}
                                onChange={(e) => setContext({ ...context, commits: parseInt(e.target.value) })}
                                min="1"
                                placeholder="1"
                                aria-label="Number of commits in this push"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Total Repo Commits
                                <span className="ml-2 text-xs text-gray-500 font-normal">(from GitHub)</span>
                            </label>
                            <div className="flex items-center px-4 py-3 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800/50 dark:to-slate-700/30 rounded-xl border border-slate-200 dark:border-white/10">
                                {context.total_commits ? (
                                    <>
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/20">
                                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                                    {context.total_commits.toLocaleString()}
                                                </span>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">commits in repository</p>
                                            </div>
                                        </div>
                                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                                            ✓ Fetched
                                        </span>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-3 flex-1 text-gray-500 dark:text-gray-400">
                                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium">Not available</span>
                                            <p className="text-xs">Select a GitHub activity to load commit count</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {context.total_commits && (
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    💡 Use this for posts like &quot;After {context.total_commits.toLocaleString()} commits...&quot;
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Repository Name</label>
                            <Input
                                type="text"
                                value={context.repo}
                                onChange={(e) => setContext({ ...context, repo: e.target.value })}
                                placeholder="my-awesome-project"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Repository Path</label>
                            <Input
                                type="text"
                                value={context.full_repo}
                                onChange={(e) => setContext({ ...context, full_repo: e.target.value })}
                                placeholder="username/my-awesome-project"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Time Ago</label>
                            <Input
                                type="text"
                                value={context.date}
                                onChange={(e) => setContext({ ...context, date: e.target.value })}
                                placeholder="2 hours ago"
                            />
                        </div>
                    </>
                )}

                {/* AI Model Selector */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        AI Model
                        {tier === 'free' && <span className="ml-2 text-orange-500 text-xs">🔒 Premium models locked</span>}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {AI_MODELS.map((model) => {
                            const isLocked = tier === 'free' && model.proOnly;
                            const isSelected = selectedModel === model.value;

                            return (
                                <button
                                    key={model.value}
                                    onClick={() => handleModelChange(model.value)}
                                    disabled={loading}
                                    className={`relative p-4 rounded-xl border-2 transition-all text-left ${isSelected
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/20'
                                        : isLocked
                                            ? 'border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 opacity-60 cursor-not-allowed'
                                            : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-blue-300 dark:hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                                        }`}
                                >
                                    {/* Lock icon for pro models on free tier */}
                                    {isLocked && (
                                        <div className="absolute top-2 right-2">
                                            <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                    )}

                                    {/* Selected checkmark */}
                                    {isSelected && (
                                        <div className="absolute top-2 right-2">
                                            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-lg">{model.icon}</span>
                                        <span className={`font-semibold text-sm ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                                            {model.label}
                                        </span>
                                    </div>
                                    <p className={`text-xs ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {model.description}
                                    </p>
                                    {model.proOnly && (
                                        <span className="inline-block mt-2 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium rounded-full">
                                            Pro
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    {tier === 'free' && (
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            💡 <a href="/pricing" className="text-blue-500 hover:underline">Upgrade to Pro</a> for GPT-4o and Claude 3.5 access
                        </p>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="pt-6 border-t border-gray-200 dark:border-white/10 text-white">
                    <Button
                        onClick={handleGenerateClick}
                        isLoading={loading}
                        variant="premium"
                        size="lg"
                        fullWidth
                        className="mb-3"
                    >
                        {!loading && (
                            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        )}
                        Generate Preview
                    </Button>

                    <Button
                        onClick={onWriteManually}
                        variant="secondary"
                        size="lg"
                        fullWidth
                        className="mb-3 bg-white/10 border-2 border-dashed border-gray-300 dark:border-white/20 hover:bg-white/20 dark:hover:bg-white/10"
                        disabled={loading}
                    >
                        📝 Write from Scratch
                    </Button>

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

                {/* Image Section */}
                {hasPreview && (
                    <div className="pt-4 border-t border-gray-200 dark:border-white/10">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Post Image (Optional)
                        </label>

                        {selectedImage ? (
                            <div className="relative group">
                                <img
                                    src={selectedImage}
                                    alt="Selected post image"
                                    className="w-full h-40 object-cover rounded-lg border-2 border-gray-200 dark:border-white/10"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-3">
                                    <button
                                        onClick={onImageClick}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                    >
                                        Change Image
                                    </button>
                                    <button
                                        onClick={onRemoveImage}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={onImageClick}
                                disabled={!onImageClick}
                                className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Click to add image from Unsplash</span>
                            </button>
                        )}
                    </div>
                )}

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
