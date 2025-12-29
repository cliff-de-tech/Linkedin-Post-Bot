/**
 * Onboarding Page - Simple, Non-Technical Setup
 * 
 * SECURITY: No credential input fields. All secrets managed server-side.
 * 
 * Flow:
 * 1. Welcome - Simple intro
 * 2. GitHub Username - Tell us who you are on GitHub (required)
 *    + Optional: Connect GitHub OAuth for private repos
 * 3. Connect LinkedIn - One-click OAuth (required for posting)
 * 4. All Done - Ready to create posts
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useUser } from '@clerk/nextjs';
import { showToast } from '@/lib/toast';
import SEOHead from '@/components/SEOHead';
import ThemeToggle from '@/components/ThemeToggle';
import PersonaQuiz from '@/components/settings/PersonaQuiz';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Onboarding() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const userId = user?.id;

  // User inputs
  const [githubUsername, setGithubUsername] = useState('');
  const [savedGithubUsername, setSavedGithubUsername] = useState(''); // Track saved value
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [isUsernameSaved, setIsUsernameSaved] = useState(false);
  const [linkedinConnected, setLinkedinConnected] = useState(false);
  const [githubOAuthConnected, setGithubOAuthConnected] = useState(false);

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  // Check for OAuth callbacks
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    // LinkedIn OAuth callback
    const linkedinSuccess = urlParams.get('linkedin_success');
    const linkedinUrnParam = urlParams.get('linkedin_urn');

    if (linkedinSuccess === 'true' && linkedinUrnParam) {
      setLinkedinConnected(true);
      showToast.success('LinkedIn connected! 🎉');
      window.history.replaceState({}, document.title, window.location.pathname);
      setStep(4); // Move to completion step
    } else if (linkedinSuccess === 'false') {
      const error = urlParams.get('error') || 'Something went wrong';
      showToast.error(`Couldn't connect LinkedIn: ${error}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // GitHub OAuth callback
    const githubSuccess = urlParams.get('github_success');
    if (githubSuccess === 'true') {
      setGithubOAuthConnected(true);
      showToast.success('GitHub connected! Private repos now accessible.');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (githubSuccess === 'false') {
      showToast.error('GitHub connection cancelled or failed');
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Note: We no longer check localStorage for linkedin_user_urn here
    // Connection status should be determined by the API (checkSettings) to ensure
    // proper per-user state. localStorage is only used for OAuth callback handling.
  }, []);

  // Load existing settings
  useEffect(() => {
    if (!isLoaded || !userId) return;

    const checkSettings = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/connection-status/${userId}`);
        if (response.data && !response.data.error) {
          if (response.data.github_username) {
            setGithubUsername(response.data.github_username);
            setSavedGithubUsername(response.data.github_username); // Track saved value
          }
          if (response.data.linkedin_connected) {
            setLinkedinConnected(true);
          }
          if (response.data.github_oauth_connected) {
            setGithubOAuthConnected(true);
          }
        }
      } catch (e) {
        // No existing settings, that's fine
      }
    };
    checkSettings();
  }, [isLoaded, userId]);

  // Auto-save GitHub username with debounce (500ms after typing stops)
  useEffect(() => {
    // Don't save if empty, no userId, or same as saved value
    if (!githubUsername.trim() || !userId || githubUsername.trim() === savedGithubUsername) {
      return;
    }

    // Reset saved state when typing
    setIsUsernameSaved(false);

    const timeoutId = setTimeout(async () => {
      setIsSavingUsername(true);
      try {
        await axios.post(`${API_BASE}/api/settings`, {
          user_id: userId,
          github_username: githubUsername.trim()
        });
        setSavedGithubUsername(githubUsername.trim());
        setIsUsernameSaved(true);
      } catch (error) {
        showToast.error('Failed to save username');
      } finally {
        setIsSavingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [githubUsername, userId, savedGithubUsername]);

  const handleConnectLinkedIn = async () => {
    if (!userId) {
      showToast.error('Please sign in first');
      return;
    }

    const toastId = showToast.loading('Connecting to LinkedIn...');
    try {
      await axios.get(`${API_BASE}/health`, { timeout: 2000 });
      showToast.dismiss(toastId);

      // Redirect to LinkedIn OAuth
      const redirectUri = `${window.location.origin}/onboarding`;
      window.location.href = `${API_BASE}/auth/linkedin/start?redirect_uri=${encodeURIComponent(redirectUri)}&user_id=${encodeURIComponent(userId)}`;
    } catch (error) {
      showToast.dismiss(toastId);
      showToast.error('Server is starting up. Please try again in a moment.');
    }
  };

  const handleConnectGitHub = async () => {
    if (!userId) {
      showToast.error('Please sign in first');
      return;
    }

    const toastId = showToast.loading('Connecting to GitHub...');
    try {
      await axios.get(`${API_BASE}/health`, { timeout: 2000 });
      showToast.dismiss(toastId);

      // Mark that we're coming from onboarding for the callback page
      localStorage.setItem('github_oauth_from_onboarding', 'true');

      // Redirect to GitHub OAuth
      const redirectUri = `${window.location.origin}/auth/github/callback`;
      window.location.href = `${API_BASE}/auth/github/start?redirect_uri=${encodeURIComponent(redirectUri)}&user_id=${encodeURIComponent(userId)}`;
    } catch (error) {
      showToast.dismiss(toastId);
      showToast.error('Server is starting up. Please try again in a moment.');
    }
  };

  const handleComplete = async () => {
    if (!userId) return;

    setLoading(true);
    const toastId = showToast.loading('Saving...');

    try {
      await axios.post(`${API_BASE}/api/settings`, {
        user_id: userId,
        github_username: githubUsername.trim(),
        onboarding_complete: true
      });

      showToast.dismiss(toastId);
      showToast.success("You're all set! Let's create some posts 🚀");

      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error: any) {
      showToast.dismiss(toastId);
      showToast.error('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary transition-colors duration-300 overflow-hidden relative">
      <SEOHead
        title="Get Started - PostBot"
        description="Set up your AI-powered LinkedIn assistant in 2 minutes"
      />

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[70vw] h-[70vw] bg-purple-500/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-[20%] -left-[10%] w-[70vw] h-[70vw] bg-blue-500/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-gray-200/50 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight">PostBot</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-all"
            >
              Home
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-6 py-16 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">

        {/* Progress - Simple dots */}
        <div className="flex items-center gap-3 mb-12">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`
                w-3 h-3 rounded-full transition-all duration-300
                ${step >= s ? 'bg-blue-600 scale-100' : 'bg-gray-300 dark:bg-white/20 scale-75'}
              `}></div>
              {s < 5 && (
                <div className={`w-8 h-0.5 mx-1 transition-all duration-300 ${step > s ? 'bg-blue-600' : 'bg-gray-300 dark:bg-white/20'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="w-full bg-white/90 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden">

          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="p-8 md:p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-xl animate-float">
                <span className="text-3xl">👋</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                Welcome to PostBot!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Turn your GitHub activity into engaging LinkedIn posts. Setup takes about 2 minutes.
              </p>

              <button
                onClick={nextStep}
                className="w-full max-w-xs mx-auto bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl"
              >
                Let's Go →
              </button>
            </div>
          )}

          {/* Step 2: GitHub Username + Optional OAuth */}
          {step === 2 && (
            <div className="p-8 md:p-12">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🐙</span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your GitHub</h2>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                We'll use your activity to help write posts about your coding projects.
              </p>

              {/* Username Input */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    GitHub Username <span className="text-red-500">*</span>
                  </label>
                  {isSavingUsername && (
                    <span className="flex items-center gap-1 text-xs font-medium text-gray-400">
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Saving...
                    </span>
                  )}
                  {!isSavingUsername && isUsernameSaved && (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-500">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Saved
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-gray-400">github.com/</span>
                  <input
                    type="text"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    placeholder="your-username"
                    className="w-full bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl pl-28 pr-4 py-3.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    autoFocus
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  This is your public username — we use it to fetch your public activity.
                </p>
              </div>

              {/* Optional OAuth Section */}
              <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">🔓 Private Repository Access</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Optional: Include commits from private repos
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${githubOAuthConnected
                    ? 'bg-green-500/20 text-green-500'
                    : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                    }`}>
                    {githubOAuthConnected ? '✓ Connected' : 'Optional'}
                  </span>
                </div>

                {githubOAuthConnected ? (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Private repos will be included
                  </div>
                ) : (
                  <button
                    onClick={handleConnectGitHub}
                    className="w-full bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    Connect GitHub (Optional)
                  </button>
                )}
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-100 dark:border-white/5">
                <button
                  onClick={prevStep}
                  className="px-5 py-3 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 font-medium transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={nextStep}
                  disabled={!githubUsername.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all py-3"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Connect LinkedIn */}
          {step === 3 && (
            <div className="p-8 md:p-12">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🔗</span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Connect LinkedIn</h2>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-8">
                This lets PostBot publish posts to your LinkedIn profile.
              </p>

              {linkedinConnected ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 rounded-2xl p-6 flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-green-700 dark:text-green-400 font-semibold">LinkedIn Connected!</p>
                    <p className="text-green-600/70 text-sm">Ready to post</p>
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <button
                    onClick={handleConnectLinkedIn}
                    className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                    Connect with LinkedIn
                  </button>
                  <p className="text-center text-gray-500 text-sm mt-3">
                    You'll be taken to LinkedIn to securely authorize access.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-6 border-t border-gray-100 dark:border-white/5">
                <button
                  onClick={prevStep}
                  className="px-5 py-3 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 font-medium transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={nextStep}
                  disabled={!linkedinConnected}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all py-3"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Persona Quiz */}
          {step === 4 && (
            <PersonaQuiz
              onComplete={() => setStep(5)}
              onSkip={() => setStep(5)}
            />
          )}

          {/* Step 5: All Done */}
          {step === 5 && (
            <div className="p-8 md:p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-tr from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-xl">
                <span className="text-3xl">🎉</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                You're All Set!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                PostBot will now help you share your coding journey on LinkedIn.
              </p>

              {/* Summary */}
              <div className="max-w-sm mx-auto space-y-3 mb-8">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <span className="text-gray-700 dark:text-gray-300">GitHub</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 dark:text-white font-medium">@{githubUsername}</span>
                    {githubOAuthConnected && (
                      <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">+private</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <span className="text-green-700 dark:text-green-400">LinkedIn</span>
                  <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Connected
                  </span>
                </div>
              </div>

              <button
                onClick={handleComplete}
                disabled={loading}
                className="w-full max-w-xs mx-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                    Finishing...
                  </>
                ) : (
                  'Go to Dashboard →'
                )}
              </button>
            </div>
          )}

        </div>
      </main>

      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 10s infinite;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
}
