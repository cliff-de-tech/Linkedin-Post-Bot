/**
 * Settings Page - Connection Status Only
 * 
 * SECURITY: This page displays connection STATUS only.
 * No credential input fields are exposed to the frontend.
 * 
 * All secrets (API keys, tokens) are managed server-side via:
 * - Environment variables (GROQ_API_KEY, LINKEDIN_CLIENT_SECRET, etc.)
 * - Encrypted token_store.db (OAuth tokens)
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useUser, UserButton } from '@clerk/nextjs';
import { showToast } from '@/lib/toast';
import SEOHead from '@/components/SEOHead';
import ThemeToggle from '@/components/ThemeToggle';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ConnectionStatus {
  linkedin_connected: boolean;
  linkedin_urn?: string;
  github_connected: boolean;
  github_username?: string;
  github_oauth_connected: boolean;
  token_expires_at?: number;
}

export default function Settings() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Connection status state
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    linkedin_connected: false,
    github_connected: false,
    github_oauth_connected: false
  });

  // GitHub username for display/edit (only public identifier)
  const [githubUsername, setGithubUsername] = useState('');
  const [savingGithub, setSavingGithub] = useState(false);

  const userId = user?.id || '';

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  // State to trigger refresh after OAuth callback
  const [shouldRefresh, setShouldRefresh] = useState(false);

  // Handle OAuth callbacks - set flags for refresh
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    // Handle GitHub OAuth callback
    const githubSuccess = urlParams.get('github_success');
    if (githubSuccess === 'true') {
      showToast.success('GitHub connected! Private repos now accessible.');
      setShouldRefresh(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (githubSuccess === 'false') {
      const error = urlParams.get('error') || 'Unknown error';
      showToast.error(`GitHub connection failed: ${error}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Handle LinkedIn OAuth callback
    const linkedinSuccess = urlParams.get('linkedin_success');
    const linkedinUrn = urlParams.get('linkedin_urn');
    const linkedinError = urlParams.get('error');

    if (linkedinSuccess === 'true') {
      showToast.success('LinkedIn connected!');
      setShouldRefresh(prev => !prev); // Toggle to trigger refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (linkedinSuccess === 'false') {
      showToast.error(`LinkedIn connection failed: ${linkedinError || 'Unknown error'}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Load connection status function
  const loadConnectionStatus = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/api/connection-status/${userId}`);
      if (response.data && !response.data.error) {
        setConnectionStatus({
          linkedin_connected: response.data.linkedin_connected || false,
          linkedin_urn: response.data.linkedin_urn || '',
          github_connected: response.data.github_connected || false,
          github_username: response.data.github_username || '',
          github_oauth_connected: response.data.github_oauth_connected || false,
          token_expires_at: response.data.token_expires_at
        });
        setGithubUsername(response.data.github_username || '');
      }
    } catch (error) {
      console.log('Error loading connection status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load connection status on mount and when shouldRefresh changes
  useEffect(() => {
    if (!isLoaded || !userId) return;
    setMounted(true);
    loadConnectionStatus();
  }, [isLoaded, userId, shouldRefresh]);

  // LinkedIn OAuth
  const handleConnectLinkedIn = async () => {
    if (!userId) {
      showToast.error('User not authenticated');
      return;
    }

    const toastId = showToast.loading('Connecting to LinkedIn...');
    try {
      await axios.get(`${API_BASE}/health`, { timeout: 2000 });
      showToast.dismiss(toastId);
      // LinkedIn requires exact match of registered redirect_uri (no query params)
      const redirectUri = `${window.location.origin}/settings`;
      window.location.href = `${API_BASE}/auth/linkedin/start?redirect_uri=${encodeURIComponent(redirectUri)}&user_id=${encodeURIComponent(userId)}`;
    } catch (error) {
      showToast.dismiss(toastId);
      showToast.error('Backend server is unreachable.');
    }
  };

  const handleDisconnectLinkedIn = async () => {
    try {
      await axios.post(`${API_BASE}/api/disconnect-linkedin`, { user_id: userId });
      localStorage.removeItem('linkedin_user_urn');
      setConnectionStatus(prev => ({ ...prev, linkedin_connected: false, linkedin_urn: '' }));
      showToast.success('LinkedIn disconnected');
    } catch (error) {
      showToast.error('Failed to disconnect LinkedIn');
    }
  };

  // GitHub OAuth
  const handleConnectGitHub = async () => {
    if (!userId) {
      showToast.error('User not authenticated');
      return;
    }

    const toastId = showToast.loading('Connecting to GitHub...');
    try {
      await axios.get(`${API_BASE}/health`, { timeout: 2000 });
      showToast.dismiss(toastId);
      const redirectUri = `${window.location.origin}/auth/github/callback`;
      window.location.href = `${API_BASE}/auth/github/start?redirect_uri=${encodeURIComponent(redirectUri)}&user_id=${encodeURIComponent(userId)}`;
    } catch (error) {
      showToast.dismiss(toastId);
      showToast.error('Backend server is unreachable.');
    }
  };

  const handleDisconnectGitHub = async () => {
    try {
      await axios.post(`${API_BASE}/api/disconnect-github`, { user_id: userId });
      setConnectionStatus(prev => ({ ...prev, github_oauth_connected: false }));
      showToast.success('GitHub OAuth disconnected');
    } catch (error) {
      showToast.error('Failed to disconnect GitHub');
    }
  };

  // Save GitHub username
  const handleSaveGithubUsername = async () => {
    if (!userId || !githubUsername.trim()) return;

    setSavingGithub(true);
    try {
      await axios.post(`${API_BASE}/api/settings`, {
        user_id: userId,
        github_username: githubUsername.trim()
      });
      setConnectionStatus(prev => ({
        ...prev,
        github_connected: true,
        github_username: githubUsername.trim()
      }));
      showToast.success('GitHub username saved!');
    } catch (error) {
      showToast.error('Failed to save GitHub username');
    } finally {
      setSavingGithub(false);
    }
  };

  const formatExpiryDate = (timestamp: number | undefined) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent text-text-primary transition-colors duration-300">
      <SEOHead title="Settings - PostBot" description="Manage your connections" />

      {/* Background provided globally by _app.tsx */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0"></div>

      {/* Header */}
      <header className="relative bg-white/10 dark:bg-white/5 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <p className="text-xs text-gray-600 dark:text-purple-200">Manage your connections</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="group flex items-center px-4 py-2 text-gray-700 dark:text-purple-200 hover:text-blue-600 dark:hover:text-white bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 rounded-lg transition-all border border-gray-200 dark:border-white/10"
            >
              <svg className="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
            <ThemeToggle />
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className={`relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">

            {/* LinkedIn Connection Card */}
            <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">LinkedIn</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Required for posting</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${connectionStatus.linkedin_connected
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-gray-500/20 text-gray-400'
                  }`}>
                  {connectionStatus.linkedin_connected ? '✓ Connected' : 'Not Connected'}
                </div>
              </div>

              {connectionStatus.linkedin_connected ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 dark:text-green-400 font-medium">Account Connected</p>
                      {connectionStatus.token_expires_at && (
                        <p className="text-green-500/70 text-sm">
                          Token expires: {formatExpiryDate(connectionStatus.token_expires_at)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleDisconnectLinkedIn}
                      className="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleConnectLinkedIn}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  Connect LinkedIn Account
                </button>
              )}
            </div>

            {/* GitHub Connection Card */}
            <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-500/20 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">GitHub</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">For activity tracking</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${connectionStatus.github_connected
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-gray-500/20 text-gray-400'
                  }`}>
                  {connectionStatus.github_connected ? '✓ Connected' : 'Not Set'}
                </div>
              </div>

              {/* Username Section */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    GitHub Username (Public Activity)
                  </label>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-3 text-gray-400 text-sm">github.com/</span>
                      <input
                        type="text"
                        value={githubUsername}
                        onChange={(e) => setGithubUsername(e.target.value)}
                        placeholder="username"
                        className="w-full pl-24 pr-4 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                    <button
                      onClick={handleSaveGithubUsername}
                      disabled={savingGithub || !githubUsername.trim()}
                      className="px-6 py-3 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all"
                    >
                      {savingGithub ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    We use your public activity (commits, PRs) to generate post content.
                  </p>
                </div>

                {/* OAuth Section */}
                <div className="pt-4 border-t border-gray-200 dark:border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Private Repository Access</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Connect GitHub to include private repo activity
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${connectionStatus.github_oauth_connected
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-400'
                      }`}>
                      {connectionStatus.github_oauth_connected ? '✓ OAuth Connected' : 'Optional'}
                    </div>
                  </div>

                  {connectionStatus.github_oauth_connected ? (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-600 dark:text-green-400 font-medium">GitHub OAuth Connected</p>
                          <p className="text-green-500/70 text-sm">Private repos are now included</p>
                        </div>
                        <button
                          onClick={handleDisconnectGitHub}
                          className="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleConnectGitHub}
                      className="w-full bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                      Connect GitHub for Private Repos
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-blue-600 dark:text-blue-400 font-medium">API Keys Managed Server-Side</p>
                  <p className="text-blue-500/70 text-sm mt-1">
                    AI and service credentials are securely managed through environment variables on the server.
                    Contact your administrator to update API keys.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>


    </div>
  );
}
