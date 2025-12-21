/**
 * Bot Mode Panel - Automated LinkedIn post generation from GitHub activity
 * 
 * API TYPES: This component uses types from shared/contracts.
 * TO REGENERATE when backend changes: npm run generate:types
 */
import { useState, useCallback } from 'react';
import axios, { AxiosResponse } from 'axios';
import { showToast } from '@/lib/toast';
import { PostQueuePanel } from './PostQueuePanel';
import { ImageSelector } from './ImageSelector';
import { ActivitySkeleton } from '@/components/ui/Skeleton';
import { NoActivitiesState } from '@/components/ui/EmptyState';

// Import API types from shared contracts
import type {
    ScanRequest,
    BatchGenerateRequest,
    FullPublishRequest,
    ImagePreviewRequest,
    GitHubActivity
} from '@/types/dashboard';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Local UI-specific types that extend or complement API types
interface Activity extends GitHubActivity {
    // Additional UI-specific properties can be added here
}

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

interface UnsplashImage {
    id: string;
    url: string;
    thumb: string;
    description: string;
    photographer: string;
    download_url: string;
}

interface BotModePanelProps {
    userId: string;
}


// Activity type options
const ACTIVITY_TYPES = [
    { value: 'all', label: 'All Activities', icon: '📋' },
    { value: 'push', label: 'Push Events', icon: '🚀' },
    { value: 'commits', label: 'Commits', icon: '📝' },
    { value: 'pull_request', label: 'Pull Requests', icon: '🔀' },
    { value: 'new_repo', label: 'New Repositories', icon: '✨' },
    { value: 'generic', label: 'Generic Post', icon: '📄' }
];

// Template options
const TEMPLATE_OPTIONS = [
    { value: 'standard', label: 'Standard Update', icon: '📝' },
    { value: 'build_in_public', label: 'Build in Public', icon: '🔨' },
    { value: 'thought_leadership', label: 'Thought Leadership', icon: '💡' },
    { value: 'job_search', label: 'Job Search / Portfolio', icon: '💼' }
];

const DAY_OPTIONS = [1, 3, 7, 14, 30];

export function BotModePanel({ userId }: BotModePanelProps) {
    // State
    const [activities, setActivities] = useState<Activity[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [images, setImages] = useState<UnsplashImage[]>([]);

    // Filter states
    const [searchDays, setSearchDays] = useState(3);
    const [activityType, setActivityType] = useState('all');
    const [selectedTemplate, setSelectedTemplate] = useState('standard');
    const [suggestedActivities, setSuggestedActivities] = useState<Activity[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Loading states
    const [scanning, setScanning] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [loadingImages, setLoadingImages] = useState(false);
    const [publishingId, setPublishingId] = useState<string | null>(null);

    // UI state
    const [testMode, setTestMode] = useState(true);
    const [selectedPostForImage, setSelectedPostForImage] = useState<string | null>(null);
    const [step, setStep] = useState<'idle' | 'scanned' | 'generated'>('idle');

    // Scan GitHub for activities
    const handleScanGitHub = useCallback(async () => {
        setScanning(true);
        setShowSuggestions(false);
        setSuggestedActivities([]);

        try {
            const hours = searchDays * 24;
            const response = await axios.post(`${API_BASE}/api/github/scan`, {
                user_id: userId,
                hours: hours,
                activity_type: activityType !== 'all' ? activityType : undefined
            });

            if (response.data.error) {
                showToast.error(response.data.error);
                return;
            }

            const allActivities = response.data.all_activities || [];
            let filteredActivities = response.data.activities || [];

            // If specific type selected but none found, show suggestions
            if (activityType !== 'all' && filteredActivities.length === 0 && allActivities.length > 0) {
                setSuggestedActivities(allActivities);
                setShowSuggestions(true);
                const typeName = ACTIVITY_TYPES.find(t => t.value === activityType)?.label || activityType;
                showToast.error(`No ${typeName} found. Showing alternatives.`);
                setActivities([]);
                setStep('scanned');
                return;
            }

            setActivities(filteredActivities);

            if (filteredActivities.length === 0) {
                showToast.error(`No GitHub activity found in the last ${searchDays} day${searchDays > 1 ? 's' : ''}`);
            } else {
                showToast.success(`Found ${filteredActivities.length} activities!`);
                setStep('scanned');
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            showToast.error('Failed to scan GitHub: ' + errorMessage);
        } finally {
            setScanning(false);
        }
    }, [userId, searchDays, activityType]);

    // Generate posts for selected activities
    const handleGeneratePosts = useCallback(async (selectedActivities?: Activity[]) => {
        const toGenerate = selectedActivities || activities;

        if (toGenerate.length === 0) {
            showToast.error('No activities to generate posts from');
            return;
        }

        setGenerating(true);
        const toastId = showToast.loading(`Generating ${toGenerate.length} posts...`);

        try {
            const response = await axios.post(`${API_BASE}/api/post/generate-batch`, {
                user_id: userId,
                activities: toGenerate,
                style: selectedTemplate
            });

            showToast.dismiss(toastId);

            if (response.data.error) {
                showToast.error(response.data.error);
                return;
            }

            const newPosts = response.data.posts || [];
            setPosts(newPosts);
            setStep('generated');

            const successCount = response.data.generated_count || 0;
            const failedCount = response.data.failed_count || 0;

            if (successCount > 0) {
                showToast.success(`Generated ${successCount} posts!`);
            }
            if (failedCount > 0) {
                showToast.error(`${failedCount} posts failed to generate`);
            }
        } catch (error: unknown) {
            showToast.dismiss(toastId);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            showToast.error('Failed to generate posts: ' + errorMessage);
        } finally {
            setGenerating(false);
        }
    }, [activities, userId]);

    // Load images for a post
    const handleLoadImages = useCallback(async (postId: string) => {
        const post = posts.find(p => p.id === postId);
        if (!post || !post.content) return;

        setSelectedPostForImage(postId);
        setLoadingImages(true);

        try {
            const response = await axios.post(`${API_BASE}/api/image/preview`, {
                post_content: post.content,
                count: 3
            });

            setImages(response.data.images || []);
        } catch (error) {
            showToast.error('Failed to load images');
            setImages([]);
        } finally {
            setLoadingImages(false);
        }
    }, [posts]);

    // Select image for a post
    const handleSelectImage = useCallback((imageUrl: string | null) => {
        if (selectedPostForImage) {
            setPosts(prev => prev.map(post =>
                post.id === selectedPostForImage
                    ? { ...post, image_url: imageUrl }
                    : post
            ));
        }
    }, [selectedPostForImage]);

    // Edit post content
    const handleEditPost = useCallback((postId: string, newContent: string) => {
        setPosts(prev => prev.map(post =>
            post.id === postId
                ? { ...post, content: newContent }
                : post
        ));
    }, []);

    // Discard post
    const handleDiscardPost = useCallback((postId: string) => {
        setPosts(prev => prev.filter(post => post.id !== postId));
        showToast.success('Post discarded');
    }, []);

    // Publish post
    const handlePublishPost = useCallback(async (postId: string) => {
        const post = posts.find(p => p.id === postId);
        if (!post || !post.content) return;

        setPublishingId(postId);

        try {
            const response = await axios.post(`${API_BASE}/api/publish/full`, {
                user_id: userId,
                post_content: post.content,
                image_url: post.image_url,
                test_mode: testMode
            });

            if (response.data.error) {
                showToast.error(response.data.error);
                return;
            }

            if (response.data.test_mode) {
                showToast.success('Test publish successful! (No real post created)');
            } else {
                showToast.success('Published to LinkedIn! 🎉');
                setPosts(prev => prev.map(p =>
                    p.id === postId ? { ...p, status: 'published' as const } : p
                ));
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            showToast.error('Failed to publish: ' + errorMessage);
        } finally {
            setPublishingId(null);
        }
    }, [posts, userId, testMode]);

    // Reset to start over
    const handleReset = useCallback(() => {
        setActivities([]);
        setPosts([]);
        setStep('idle');
    }, []);

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border border-blue-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-2xl">🤖</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Bot Mode
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Automate your LinkedIn posts from GitHub activity
                        </p>
                    </div>
                </div>

                {/* Test Mode Toggle */}
                <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${testMode ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500'}`}>
                        {testMode ? '🧪 Test Mode' : '🚀 Live Mode'}
                    </span>
                    <button
                        onClick={() => setTestMode(!testMode)}
                        className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${testMode ? 'bg-orange-500' : 'bg-green-500'
                            }`}
                    >
                        <span
                            className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-200 ${testMode ? 'translate-x-0' : 'translate-x-7'
                                }`}
                        />
                    </button>
                </div>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
                {['Scan', 'Generate', 'Publish'].map((s, i) => (
                    <div key={s} className="flex items-center">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${(i === 0 && step !== 'idle') ||
                            (i === 1 && step === 'generated') ||
                            (i === 2 && posts.some(p => p.status === 'published'))
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            }`}>
                            <span>{i + 1}</span>
                            <span>{s}</span>
                        </div>
                        {i < 2 && <span className="mx-2 text-gray-400">→</span>}
                    </div>
                ))}
            </div>

            {/* Main content based on step */}
            {step === 'idle' && (
                <div className="text-center py-8">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Ready to Scan
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                        Configure your search and scan GitHub for recent activity.
                    </p>

                    {/* Filter Controls */}
                    <div className="flex flex-wrap justify-center gap-4 mb-6">
                        {/* Time Range */}
                        <div className="flex flex-col items-start">
                            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-1">Time Range</label>
                            <select
                                value={searchDays}
                                onChange={(e) => setSearchDays(Number(e.target.value))}
                                className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            >
                                {DAY_OPTIONS.map(days => (
                                    <option key={days} value={days}>
                                        {days === 1 ? 'Last 24 hours' : `Last ${days} days`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Activity Type */}
                        <div className="flex flex-col items-start">
                            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-1">Activity Type</label>
                            <select
                                value={activityType}
                                onChange={(e) => setActivityType(e.target.value)}
                                className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 min-w-[180px]"
                            >
                                {ACTIVITY_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.icon} {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Post Template */}
                        <div className="flex flex-col items-start">
                            <label className="text-xs text-blue-600 dark:text-blue-400 mb-1 ml-1 font-medium">Post Style</label>
                            <select
                                value={selectedTemplate}
                                onChange={(e) => setSelectedTemplate(e.target.value)}
                                className="px-4 py-2.5 bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-700 rounded-xl text-blue-700 dark:text-blue-300 focus:ring-2 focus:ring-blue-500 min-w-[200px] font-medium"
                            >
                                {TEMPLATE_OPTIONS.map(template => (
                                    <option key={template.value} value={template.value}>
                                        {template.icon} {template.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={handleScanGitHub}
                        disabled={scanning}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                    >
                        {scanning ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                Scanning...
                            </>
                        ) : (
                            <>
                                <span>🔍</span>
                                Scan GitHub Activity
                            </>
                        )}
                    </button>
                </div>
            )}

            {step === 'scanned' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {showSuggestions ? 'Suggested Activities' : `Found ${activities.length} Activities`}
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={handleReset}
                                className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                ← Back
                            </button>
                            <button
                                onClick={() => handleGeneratePosts(showSuggestions ? suggestedActivities : undefined)}
                                disabled={generating || (activities.length === 0 && suggestedActivities.length === 0)}
                                className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {generating ? (
                                    <>
                                        <span className="animate-spin">⏳</span>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <span>✨</span>
                                        Generate All ({selectedTemplate.replace(/_/g, ' ')})
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {showSuggestions && (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
                            💡 No {activityType} activities found. Showing other recent activities instead.
                        </div>
                    )}

                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {(showSuggestions ? suggestedActivities : activities).map(activity => (
                            <div
                                key={activity.id}
                                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition-colors"
                                onClick={() => handleGeneratePosts([activity])}
                            >
                                <span className="text-2xl">{activity.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                        {activity.title}
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {activity.time_ago} • {activity.repo}
                                    </p>
                                </div>
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs font-medium">
                                    {activity.type}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {step === 'generated' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handleReset}
                            className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            ← Start Over
                        </button>
                    </div>

                    <PostQueuePanel
                        posts={posts}
                        onEdit={handleEditPost}
                        onPublish={handlePublishPost}
                        onDiscard={handleDiscardPost}
                        onSelectImage={handleLoadImages}
                        isPublishing={publishingId}
                        testMode={testMode}
                    />
                </div>
            )}

            {/* Image selector modal */}
            {selectedPostForImage && (
                <ImageSelector
                    images={images}
                    selectedImage={posts.find(p => p.id === selectedPostForImage)?.image_url || null}
                    onSelect={handleSelectImage}
                    onClose={() => setSelectedPostForImage(null)}
                    loading={loadingImages}
                    onRefresh={() => handleLoadImages(selectedPostForImage)}
                />
            )}
        </div>
    );
}

export default BotModePanel;
