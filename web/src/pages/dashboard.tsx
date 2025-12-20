import { useState, useEffect } from 'react';
import { generatePreview, publishPost } from '@/lib/api';
import { useRouter } from 'next/router';
import axios from 'axios';
import { showToast } from '@/lib/toast';
import SEOHead from '@/components/SEOHead';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface GitHubActivity {
  id: string;
  type: string;
  icon: string;
  title: string;
  description: string;
  time_ago: string;
  context: any;
}

interface Post {
  id: number;
  post_content: string;
  post_type: string;
  status: string;
  created_at: number;
  published_at: number | null;
}

interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  context: any;
}

export default function Dashboard() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // State
  const [context, setContext] = useState({
    type: 'push',
    commits: 3,
    repo: 'my-project',
    full_repo: 'username/my-project',
    date: '2 hours ago',
  });
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [charCount, setCharCount] = useState(0);
  
  // New features
  const [githubActivities, setGithubActivities] = useState<GitHubActivity[]>([]);
  const [postHistory, setPostHistory] = useState<Post[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [stats, setStats] = useState({
    total_posts: 0,
    published_posts: 0,
    posts_this_month: 0,
    draft_posts: 0
  });
  const [showHistory, setShowHistory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    // Get user ID
    let storedUserId = localStorage.getItem('user_id');
    if (!storedUserId) {
      storedUserId = 'user_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('user_id', storedUserId);
    }
    setUserId(storedUserId);

    // Check authentication status
    checkAuthentication(storedUserId);
  }, []);

  const checkAuthentication = async (uid: string) => {
    try {
      // Check if user has LinkedIn access token
      const response = await axios.post(`${API_BASE}/api/auth/refresh`, { user_id: uid });
      
      if (response.data.access_token) {
        setIsAuthenticated(true);
        // Load user settings and data
        loadUserSettings(uid);
        loadStats(uid);
        loadPostHistory(uid);
        loadTemplates();
      } else {
        // No valid token, redirect to onboarding
        setIsAuthenticated(false);
        router.push('/onboarding');
      }
    } catch (error) {
      showToast.error('Session expired. Please sign in again.');
      // Not authenticated, redirect to onboarding to get started
      setIsAuthenticated(false);
      router.push('/onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (githubUsername && isAuthenticated) {
      loadGitHubActivity(githubUsername);
    }
  }, [githubUsername, isAuthenticated]);

  useEffect(() => {
    setCharCount(preview.length);
  }, [preview]);

  const loadUserSettings = async (uid: string) => {
    try {
      const response = await axios.get(`${API_BASE}/api/settings/${uid}`);
      if (response.data && response.data.github_username) {
        setGithubUsername(response.data.github_username);
      }
    } catch (error) {
      console.log('No settings found');
    }
  };

  const loadGitHubActivity = async (username: string) => {
    try {
      const response = await axios.get(`${API_BASE}/api/github/activity/${username}`);
      setGithubActivities(response.data.activities || []);
    } catch (error) {
      showToast.error('Failed to load GitHub activity');
      console.error('Error loading GitHub activity:', error);
    }
  };

  const loadPostHistory = async (uid: string) => {
    try {
      const response = await axios.get(`${API_BASE}/api/posts/${uid}?limit=10`);
      setPostHistory(response.data.posts || []);
    } catch (error) {
      console.error('Error loading post history:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/templates`);
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadStats = async (uid: string) => {
    try {
      const response = await axios.get(`${API_BASE}/api/stats/${uid}`);
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleGeneratePreview = async () => {
    setLoading(true);
    setStatus('');
    const toastId = showToast.loading('Generating preview...');
    try {
      const result = await generatePreview({ context });
      setPreview(result.post || 'No post generated');
      showToast.dismiss(toastId);
      showToast.success('Preview generated successfully!');
      
      // Save as draft
      await savePost(result.post, 'draft');
    } catch (error: any) {
      showToast.dismiss(toastId);
      showToast.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const savePost = async (content: string, postStatus: string) => {
    try {
      await axios.post(`${API_BASE}/api/posts`, {
        user_id: userId,
        post_content: content,
        post_type: context.type,
        context: context,
        status: postStatus
      });
      loadPostHistory(userId);
      loadStats(userId);
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
      }
    } catch (error: any) {
      showToast.dismiss(toastId);
      showToast.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleActivityClick = (activity: GitHubActivity) => {
    setContext(activity.context);
    showToast.success(`📝 Loaded context from: ${activity.title}`);
  };

  const handleTemplateClick = (template: Template) => {
    setContext({ ...context, ...template.context });
    setShowTemplates(false);
    showToast.success(`${template.icon} Template applied: ${template.name}`);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SEOHead 
        title="Dashboard - LinkedIn Post Bot"
        description="Generate and manage your LinkedIn posts with AI-powered content creation"
      />
      {/* Header - keeping existing one */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  LinkedIn Post Bot
                </h1>
                <p className="text-xs text-gray-500">AI-Powered Content Creation</p>
              </div>
            </div>
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              >
                Home
              </button>
              <button
                onClick={() => router.push('/settings')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Content Generator</h2>
            <p className="text-gray-600">Create AI-powered LinkedIn posts from your GitHub activity</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="px-4 py-2 bg-white border-2 border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 transition-all flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              Templates
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-4 py-2 bg-white border-2 border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-all flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </button>
          </div>
        </div>

        {/* Stats Cards - keeping existing */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">This Month</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.posts_this_month}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Published</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.published_posts}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Character Count</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{charCount}</p>
                <p className="text-xs text-gray-400 mt-1">Max: 3,000</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Drafts</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.draft_posts}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${loading ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                {loading ? (
                  <svg className="w-6 h-6 text-yellow-600 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Templates Modal */}
        {showTemplates && (
          <div className="mb-8 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Post Templates</h3>
              <button onClick={() => setShowTemplates(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close templates">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateClick(template)}
                  className="text-left p-4 border-2 border-gray-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all group"
                >
                  <div className="text-3xl mb-2">{template.icon}</div>
                  <h4 className="font-semibold text-gray-900 mb-1">{template.name}</h4>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Post History Modal */}
        {showHistory && (
          <div className="mb-8 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Post History</h3>
              <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close post history">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {postHistory.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No posts yet. Generate your first post!</p>
              ) : (
                postHistory.map((post) => (
                  <div key={post.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${
                            post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {post.status}
                          </span>
                          <span className="text-xs text-gray-500">{formatDate(post.created_at)}</span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">{post.post_content}</p>
                      </div>
                      <button
                        onClick={() => setPreview(post.post_content)}
                        className="ml-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* GitHub Activity Feed - NEW! */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">GitHub Activity</h3>
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </div>
              
              {githubUsername ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {githubActivities.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">No recent activity</p>
                  ) : (
                    githubActivities.map((activity) => (
                      <button
                        key={activity.id}
                        onClick={() => handleActivityClick(activity)}
                        className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{activity.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700 truncate">
                              {activity.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{activity.time_ago}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Connect your GitHub account in Settings to see your activity</p>
                  <button
                    onClick={() => router.push('/settings')}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                  >
                    Go to Settings
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Post Editor & Preview */}
          <div className="lg:col-span-2 space-y-8">
            {/* Context Editor */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Post Context</h3>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Post Type</label>
                  <select
                    value={context.type}
                    onChange={(e) => setContext({ ...context, type: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    aria-label="Post type"
                  >
                    <option value="push">🚀 Push Event</option>
                    <option value="pull_request">🔀 Pull Request</option>
                    <option value="new_repo">✨ New Repository</option>
                    <option value="generic">📝 Generic Post</option>
                  </select>
                </div>

                {context.type === 'push' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Commits</label>
                      <input
                        type="number"
                        value={context.commits}
                        onChange={(e) => setContext({ ...context, commits: parseInt(e.target.value) })}
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        aria-label="Number of commits"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Repository Name</label>
                      <input
                        type="text"
                        value={context.repo}
                        onChange={(e) => setContext({ ...context, repo: e.target.value })}
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        aria-label="Repository name"
                        placeholder="my-awesome-project"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Full Repository Path</label>
                      <input
                        type="text"
                        value={context.full_repo}
                        onChange={(e) => setContext({ ...context, full_repo: e.target.value })}
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        aria-label="Full repository path"
                        placeholder="username/my-awesome-project"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Time Ago</label>
                      <input
                        type="text"
                        value={context.date}
                        onChange={(e) => setContext({ ...context, date: e.target.value })}
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        aria-label="Date of event"
                        placeholder="2 hours ago"
                      />
                    </div>
                  </>
                )}

                {/* Action Buttons */}
                <div className="pt-6 border-t border-gray-200">
                  <button
                    onClick={handleGeneratePreview}
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
                      onClick={() => handlePublish(true)}
                      disabled={loading || !preview}
                      className="bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Test Mode
                    </button>
                    <button
                      onClick={() => handlePublish(false)}
                      disabled={loading || !preview}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Publish
                    </button>
                  </div>
                </div>

                {status && (
                  <div className={`mt-4 p-4 rounded-lg border-2 ${
                    status.includes('❌') 
                      ? 'bg-red-50 text-red-700 border-red-200' 
                      : 'bg-green-50 text-green-700 border-green-200'
                  } flex items-start`}>
                    <span className="text-lg mr-2">{status.includes('❌') ? '❌' : '✨'}</span>
                    <span className="flex-1">{status.replace(/[❌✨🚀📝]/g, '').trim()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Preview */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Post Preview</h3>
                <div className="flex items-center space-x-2">
                  {preview && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(preview);
                        setStatus('✨ Copied to clipboard!');
                      }}
                      className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-all flex items-center"
                      title="Copy to clipboard"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </button>
                  )}
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="border-2 border-gray-200 rounded-xl p-6 min-h-[450px] bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
                {preview ? (
                  <div className="relative z-10">
                    <div className="absolute -top-2 -left-2 w-16 h-16 bg-blue-500 rounded-full opacity-10 blur-xl"></div>
                    <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-purple-500 rounded-full opacity-10 blur-xl"></div>
                    <div className="whitespace-pre-wrap text-gray-800 leading-relaxed font-normal">{preview}</div>
                    
                    {/* LinkedIn Post Preview Frame */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                        Preview on LinkedIn
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center mb-4">
                      <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-400 italic text-lg mb-2">No preview yet</p>
                    <p className="text-gray-500 text-sm max-w-xs">Click a GitHub activity or configure your context and click "Generate Preview"</p>
                  </div>
                )}
              </div>

              {/* Tips Section */}
              <div className="mt-6 bg-blue-50 border-l-4 border-blue-600 rounded-r-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900 mb-2">Quick Tips</p>
                    <ul className="space-y-1 text-sm text-blue-800">
                      <li className="flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        <span>Click any GitHub activity to auto-populate context</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        <span>Use templates for quick post ideas</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        <span>Test mode shows preview without posting to LinkedIn</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
