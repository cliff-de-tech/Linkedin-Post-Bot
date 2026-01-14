import { useState, useEffect } from 'react';
import { generatePreview, publishPost } from '@/lib/api';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useUser, useAuth, UserButton } from '@clerk/nextjs';
import { showToast } from '@/lib/toast';
import SEOHead from '@/components/SEOHead';
import ThemeToggle from '@/components/ThemeToggle';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { PostEditor } from '@/components/dashboard/PostEditor';
import { PostPreview } from '@/components/dashboard/PostPreview';
import { PostHistory, Post } from '@/components/dashboard/PostHistory';
import Analytics from '@/components/dashboard/Analytics';
import ScheduleModal from '@/components/modals/ScheduleModal';
import TemplateLibrary from '@/components/dashboard/TemplateLibrary';
import { BotModePanel } from '@/components/dashboard/BotModePanel';
import { ImageSelector } from '@/components/dashboard/ImageSelector';
import { GitHubActivity, Template, PostContext } from '@/types/dashboard';
import UsageCounter from '@/components/ui/UsageCounter';
import FeatureGate from '@/components/ui/FeatureGate';
import TierBadge from '@/components/ui/TierBadge';
import WaitlistModal from '@/components/modals/WaitlistModal';
import HistoryModal from '@/components/modals/HistoryModal';
import FeedbackModal from '@/components/modals/FeedbackModal';
import { useDashboardData } from '@/hooks/useDashboardData';
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Usage data type
interface UsageData {
  tier: string;
  posts_today: number;
  posts_limit: number;
  posts_remaining: number;
  scheduled_count: number;
  scheduled_limit: number;
  scheduled_remaining: number;
  resets_in_seconds: number;
  resets_at: string | null;
}

export default function Dashboard() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();

  // DEV TEST MODE (DISABLED): To enable, change isTestMode to: router.isReady && router.query.test === 'true'
  // const isTestMode = router.isReady && router.query.test === 'true';
  const isTestMode = false;

  const testUserId = 'test_user_dev';

  const userId = isTestMode ? testUserId : (user?.id || '');


  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ========== REACT QUERY DATA FETCHING ==========
  // User-scoped queries with automatic caching and background refetching
  const {
    stats,
    posts: postHistory,
    usage,
    templates,
    githubActivities,
    githubUsername,
    firstActivityContext,
    isLoadingStats,
    isLoadingGithub,
    isLoadingPosts,
    refetchStats,
    refetchPosts,
    refetchAll,
  } = useDashboardData({ userId, enabled: isAuthenticated && !!userId });

  // Alias for backwards compatibility with existing JSX
  const usageData = usage;

  // State for post generation
  const [context, setContext] = useState<PostContext>({
    type: 'push',
    commits: 3,
    repo: 'my-project',
    full_repo: 'username/my-project',
    date: '2 hours ago',
  });
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  // Computed: is daily limit reached?
  const isLimitReached = usage?.posts_remaining === 0;

  // Auto-populate context from first GitHub activity
  useEffect(() => {
    if (firstActivityContext && context.repo === 'my-project') {
      setContext(firstActivityContext);
    }
  }, [firstActivityContext]);


  // Modals
  const [showHistory, setShowHistory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);

  // Feedback modal state
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackAutoTriggered, setFeedbackAutoTriggered] = useState(false);
  const [sessionPublishCount, setSessionPublishCount] = useState(0);

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Manual mode image state
  const [manualSelectedImage, setManualSelectedImage] = useState<string | null>(null);
  const [manualImages, setManualImages] = useState<Array<{ id: string, url: string, thumb: string, description: string, photographer: string, download_url: string }>>([]);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);

  // Scheduled posts state
  const [scheduledPosts, setScheduledPosts] = useState<Array<{ id: number, post_content: string, image_url?: string, scheduled_time: number, status: string, error_message?: string, created_at: number, published_at?: number }>>([]);

  // Load scheduled posts when history modal opens
  const loadScheduledPosts = async (uid: string) => {
    try {
      const token = await getToken();
      const response = await axios.get(`${API_BASE}/api/scheduled-posts/${uid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setScheduledPosts(response.data.posts || []);
      }
    } catch (error) {
      console.error('Failed to load scheduled posts:', error);
    }
  };

  // Trigger scheduled posts load when history modal opens
  useEffect(() => {
    if (showHistory && userId) {
      loadScheduledPosts(userId);
    }
  }, [showHistory, userId]);

  // DEV TEST MODE: Skip auth and load directly
  useEffect(() => {
    if (!router.isReady) return; // Wait for router to be ready

    if (isTestMode) {
      console.log('🧪 DEV TEST MODE: Bypassing auth');
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    // Normal auth flow
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [router.isReady, isTestMode, isLoaded, isSignedIn]);

  useEffect(() => {
    if (isTestMode || !router.isReady) return; // Skip in test mode or if router not ready
    if (!isLoaded || !userId) return;

    // Check authentication status
    checkAuthentication(userId);
  }, [isLoaded, userId, isTestMode, router.isReady]);


  const checkAuthentication = async (uid: string) => {
    try {
      // First check localStorage for LinkedIn connection
      const linkedinUrn = localStorage.getItem('linkedin_user_urn');
      const authVerified = localStorage.getItem('authentication_verified') === 'true';

      if (linkedinUrn || authVerified) {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // Check backend for saved settings
      const token = await getToken();
      const response = await axios.post(`${API_BASE}/api/auth/refresh`, { user_id: uid }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.access_token || response.data.authenticated) {
        setIsAuthenticated(true);
      } else {
        // User hasn't completed onboarding - redirect them
        setIsAuthenticated(false);
        showToast.error('Please complete setup first');
        router.push('/onboarding');
      }
    } catch (error) {
      // Check localStorage one more time before redirecting
      const linkedinUrn = localStorage.getItem('linkedin_user_urn');
      if (linkedinUrn) {
        setIsAuthenticated(true);
      } else {
        // Redirect to onboarding for incomplete setup
        setIsAuthenticated(false);
        router.push('/onboarding');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePreview = async (model: 'groq' | 'openai' | 'anthropic' = 'groq') => {
    setLoading(true);
    setStatus('');
    const toastId = showToast.loading('Generating preview...');
    try {
      // Get session token for authenticated API call
      const token = await getToken();
      const result = await generatePreview({ context, user_id: userId, model }, token || undefined);
      setPreview(result.post || 'No post generated');
      showToast.dismiss(toastId);

      // Show provider info if available
      if (result.was_downgraded) {
        showToast.success('Preview generated! (Using free model - upgrade to Pro for premium AI)');
      } else {
        showToast.success(`Preview generated with ${result.provider || model}!`);
      }

      // Save as draft
      await savePost(result.post, 'draft');

      // Refresh stats to update "Generated Posts" card immediately
      await refetchStats();
      await refetchPosts();
    } catch (error: unknown) {
      showToast.dismiss(toastId);
      const message = error instanceof Error ? error.message : 'An error occurred';
      showToast.error('Error: ' + message);
    } finally {
      setLoading(false);
    }
  };

  const savePost = async (content: string, postStatus: string) => {
    try {
      const token = await getToken();
      await axios.post(`${API_BASE}/api/posts`, {
        user_id: userId,
        post_content: content,
        post_type: context.type,
        context: context,
        status: postStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      refetchPosts();
      refetchStats();
    } catch (error) {
      showToast.error('Failed to save post');
      console.error('Error saving post:', error);
    }
  };

  const handlePublish = async (testMode: boolean) => {
    setLoading(true);
    setStatus('');
    const toastId = showToast.loading(testMode ? 'Generating preview...' : 'Publishing post...');
    try {
      const result = await publishPost({ context, test_mode: testMode });
      showToast.dismiss(toastId);
      showToast.success(testMode ? 'Preview generated!' : 'Post published successfully!');
      if (result.post) {
        setPreview(result.post);
        await savePost(result.post, testMode ? 'draft' : 'published');

        // Auto-trigger feedback popup after 2nd successful publish
        if (!testMode) {
          const newCount = sessionPublishCount + 1;
          setSessionPublishCount(newCount);

          // Show feedback popup on 2nd publish (if not dismissed before)
          const hasSubmitted = localStorage.getItem('hasSubmittedFeedback') === 'true';
          const hasDismissed = localStorage.getItem('feedbackDismissed') === 'true';

          if (newCount === 2 && !hasSubmitted && !hasDismissed) {
            setFeedbackAutoTriggered(true);
            setShowFeedback(true);
          }

          // Refresh stats to update "Published" card immediately
          await refetchStats();
          await refetchPosts();
        }
      }
    } catch (error: unknown) {
      showToast.dismiss(toastId);
      const message = error instanceof Error ? error.message : 'An error occurred';
      showToast.error('Error: ' + message);
    } finally {
      setLoading(false);
    }
  };

  const handleActivityClick = async (activity: GitHubActivity) => {
    const activityContext = activity.context as PostContext;
    setContext(activityContext);
    showToast.success(`📝 Loaded context from: ${activity.title}`);

    // Fetch total repo commits if we have the full_repo
    if (activityContext.full_repo) {
      try {
        const repoPath = activityContext.full_repo;
        const [owner, repo] = repoPath.split('/');
        if (owner && repo) {
          const response = await axios.get(`${API_BASE}/api/github/repo/${owner}/${repo}`);
          if (response.data && response.data.total_commits) {
            setContext(prev => ({
              ...prev,
              total_commits: response.data.total_commits
            }));
            showToast.success(`📊 Repo has ${response.data.total_commits} total commits`);
          }
        }
      } catch (error) {
        console.log('Could not fetch repo total commits:', error);
        // Not critical, user can still manually enter
      }
    }
  };

  const handleTemplateClick = (template: Template) => {
    setContext({ ...context, type: template.id });
    setShowTemplates(false);
    showToast.success(`${template.icon} Template applied: ${template.name}`);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Show loading skeleton while checking authentication
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Don't render dashboard if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary transition-colors duration-300">
      <SEOHead
        title="Dashboard - Post Bot"
        description="Generate and manage your LinkedIn posts with AI-powered content creation"
      />
      {/* Header */}
      <header className="bg-white dark:bg-white/5 shadow-sm border-b border-gray-200 dark:border-white/10 sticky top-0 z-50 backdrop-blur-lg bg-opacity-80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Post Bot
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">AI-Powered Content Creation</p>
              </div>
            </div>

            {/* Mobile hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-all"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center space-x-2">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-all"
              >
                Home
              </button>
              <button
                onClick={() => router.push('/settings')}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-all flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
              <div className="ml-2 border-l border-gray-200 dark:border-white/10 pl-3 flex items-center gap-2">
                <TierBadge tier={usage?.tier || 'free'} onClick={() => setShowWaitlist(true)} />
                <ThemeToggle />
                <UserButton afterSignOutUrl="/" />
              </div>
            </nav>
          </div>

          {/* Mobile navigation slide-in menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 dark:border-white/10 mt-4 pt-4">
              <nav className="flex flex-col space-y-2">
                <button
                  onClick={() => { router.push('/'); setMobileMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-all"
                >
                  Home
                </button>
                <button
                  onClick={() => { router.push('/settings'); setMobileMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-all flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </button>
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-white/10 mt-2">
                  <div className="flex items-center gap-2">
                    <TierBadge tier={usage?.tier || 'free'} onClick={() => { setShowWaitlist(true); setMobileMenuOpen(false); }} />
                    <ThemeToggle />
                  </div>
                  <UserButton afterSignOutUrl="/" />
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Content Generator</h2>
            <p className="text-gray-600 dark:text-gray-400">Create AI-powered LinkedIn posts from your GitHub activity</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-4 py-2 bg-white dark:bg-white/5 border-2 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all flex items-center"
              aria-label="View post history"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </button>

            {/* Give Feedback Button */}
            <button
              onClick={() => {
                setFeedbackAutoTriggered(false);
                setShowFeedback(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-2 border-purple-300 dark:border-purple-500/30 text-purple-700 dark:text-purple-300 rounded-lg hover:from-purple-500/20 hover:to-pink-500/20 transition-all flex items-center"
              aria-label="Give feedback"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Feedback
            </button>
          </div>
        </div>


        {/* Usage Counter for Free Tier */}
        <div className="mb-6">
          <UsageCounter usage={usage} onUpgradeClick={() => setShowWaitlist(true)} />
        </div>

        <StatsOverview stats={stats} loading={isLoadingStats} />


        {/* Bot Mode Panel */}
        <div className="my-8">
          <BotModePanel
            userId={userId}
            postsRemaining={usage?.posts_remaining ?? 10}
            tier={usage?.tier ?? 'free'}
            isLimitReached={isLimitReached ?? false}
          />
        </div>


        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="px-4 py-2 bg-white dark:bg-white/5 border-2 border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-50 dark:hover:bg-green-500/10 transition-all flex items-center"
            aria-label="Toggle analytics"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Analytics
          </button>

          {/* Schedule button - only shows after post is generated */}
          {preview && (
            <button
              onClick={() => setShowScheduleModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all flex items-center shadow-sm hover:shadow-md"
              aria-label="Schedule post"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Schedule Post
            </button>
          )}
        </div>


        {/* Analytics Panel */}
        {showAnalytics && (
          <div className="mb-8 animate-fade-in-up">
            <Analytics
              data={{
                totalPosts: stats.posts_generated,
                publishedPosts: stats.posts_published,
                draftPosts: stats.draft_posts,
                postsThisMonth: stats.posts_this_month,
                postsThisWeek: Math.floor(stats.posts_this_month / 4),
                avgEngagement: 0,
              }}
              loading={isLoadingStats}
            />
          </div>
        )}

        {/* Template Library Modal */}
        <TemplateLibrary
          isOpen={showTemplateLibrary || showTemplates}
          onClose={() => {
            setShowTemplateLibrary(false);
            setShowTemplates(false);
          }}
          onSelect={(template) => {
            setContext({ ...context, type: template.id as any });
            showToast.success(`${template.icon} Template applied: ${template.name}`);
          }}
        />

        {/* Schedule Modal */}
        <ScheduleModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          postContent={preview}
          onSchedule={(date, time) => {
            showToast.success(`📅 Post scheduled for ${date.toLocaleDateString()} at ${time}`);
            setShowScheduleModal(false);
          }}
        />

        <PostHistory
          posts={postHistory}
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          onSelect={(content) => {
            setPreview(content);
            setShowHistory(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          formatDate={formatDate}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* GitHub Activity Feed */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-white/5 rounded-2xl shadow-lg border border-gray-100 dark:border-white/10 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">GitHub Activity</h3>
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </div>

              <ActivityFeed
                activities={githubActivities}
                loading={isLoadingGithub}
                selectedActivity={null} // Could extend state to track this if needed for styling
                onSelect={handleActivityClick}
              />

              {!isLoadingGithub && !githubUsername && (
                <div className="text-center py-8 mt-4 border-t border-gray-100 dark:border-white/10">
                  <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">Connect your GitHub account in Settings to see your activity</p>
                  <button
                    onClick={() => router.push('/settings')}
                    className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 font-medium text-sm transition-colors"
                  >
                    Go to Settings
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Post Editor & Preview */}
          <div className="lg:col-span-2 space-y-8">
            <PostEditor
              context={context}
              setContext={setContext}
              onGenerate={handleGeneratePreview}
              onPublish={handlePublish}
              loading={loading}
              status={status}
              hasPreview={!!preview}
              tier={usage?.tier ?? 'free'}
              selectedImage={manualSelectedImage}
              onImageClick={async () => {
                setLoadingImages(true);
                setShowImageSelector(true);
                try {
                  const response = await axios.post(`${API_BASE}/api/image/preview`, {
                    post_content: preview || 'coding developer tech',
                    count: 6
                  });
                  setManualImages(response.data.images || []);
                } catch (error) {
                  showToast.error('Failed to load images');
                  setManualImages([]);
                } finally {
                  setLoadingImages(false);
                }
              }}
              onRemoveImage={() => setManualSelectedImage(null)}
            />

            <PostPreview preview={preview} imageUrl={manualSelectedImage} />
          </div>
        </div>
      </main>

      {/* Waitlist Modal for Pro tier */}
      <WaitlistModal isOpen={showWaitlist} onClose={() => setShowWaitlist(false)} />

      {/* History Modal */}
      <HistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        posts={postHistory.map(p => ({
          id: String(p.id),
          post_content: p.post_content,
          status: (p.status as 'published' | 'scheduled' | 'draft') || 'published',
          created_at: String(p.created_at)
        }))}
        scheduledPosts={scheduledPosts}
        loading={isLoadingPosts}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => {
          setShowFeedback(false);
          // Remember dismissal if auto-triggered
          if (feedbackAutoTriggered) {
            localStorage.setItem('feedbackDismissed', 'true');
          }
          setFeedbackAutoTriggered(false);
        }}
        userId={userId}
        autoTriggered={feedbackAutoTriggered}
        autoDismissSeconds={35}
      />

      {/* Manual Mode Image Selector */}
      {showImageSelector && (
        <ImageSelector
          images={manualImages}
          selectedImage={manualSelectedImage}
          onSelect={(imageUrl) => {
            setManualSelectedImage(imageUrl);
            setShowImageSelector(false);
          }}
          onClose={() => setShowImageSelector(false)}
          loading={loadingImages}
          onRefresh={async () => {
            setLoadingImages(true);
            try {
              const response = await axios.post(`${API_BASE}/api/image/preview`, {
                post_content: preview || 'coding developer tech',
                count: 6
              });
              setManualImages(response.data.images || []);
            } catch (error) {
              showToast.error('Failed to refresh images');
            } finally {
              setLoadingImages(false);
            }
          }}
        />
      )}
    </div>
  );
}

