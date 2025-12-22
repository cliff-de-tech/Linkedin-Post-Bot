/**
 * Onboarding Page - Simplified Setup Flow
 * 
 * SECURITY: This page does NOT accept credential input.
 * Users connect accounts via OAuth; API keys are managed server-side.
 * 
 * Flow:
 * 1. Welcome
 * 2. Connect LinkedIn (OAuth)
 * 3. Set GitHub Username (public identifier only)
 * 4. Complete
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useUser } from '@clerk/nextjs';
import { showToast } from '@/lib/toast';
import SEOHead from '@/components/SEOHead';
import ThemeToggle from '@/components/ThemeToggle';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Onboarding() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const userId = user?.id;

  // Only public identifiers
  const [githubUsername, setGithubUsername] = useState('');
  const [linkedinConnected, setLinkedinConnected] = useState(false);

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  // Check for LinkedIn OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const linkedinSuccess = urlParams.get('linkedin_success');
    const linkedinUrnParam = urlParams.get('linkedin_urn');

    if (linkedinSuccess === 'true' && linkedinUrnParam) {
      localStorage.setItem('linkedin_user_urn', linkedinUrnParam);
      setLinkedinConnected(true);
      showToast.success('LinkedIn connected successfully!');
      window.history.replaceState({}, document.title, window.location.pathname);
      setStep(3); // Move to GitHub step
    } else if (linkedinSuccess === 'false') {
      const error = urlParams.get('error') || 'Unknown error';
      showToast.error(`LinkedIn connection failed: ${error}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Check if already connected
    const storedUrn = localStorage.getItem('linkedin_user_urn');
    if (storedUrn) {
      setLinkedinConnected(true);
    }
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
          }
          if (response.data.linkedin_connected) {
            setLinkedinConnected(true);
          }
        }
      } catch (e) {
        // No existing settings
      }
    };
    checkSettings();
  }, [isLoaded, userId]);

  const handleConnectLinkedIn = async () => {
    if (!userId) {
      showToast.error('User not authenticated');
      return;
    }

    const toastId = showToast.loading('Connecting to LinkedIn...');
    try {
      await axios.get(`${API_BASE}/health`, { timeout: 2000 });
      showToast.dismiss(toastId);

      // Redirect to OAuth (credentials managed server-side)
      const redirectUri = `${window.location.origin}/onboarding`;
      window.location.href = `${API_BASE}/auth/linkedin/start?redirect_uri=${encodeURIComponent(redirectUri)}&user_id=${encodeURIComponent(userId)}`;
    } catch (error) {
      showToast.dismiss(toastId);
      showToast.error('Backend server is unreachable. Please ensure the Python server is running.');
    }
  };

  const handleComplete = async () => {
    if (!userId) return;

    setLoading(true);
    const toastId = showToast.loading('Saving your setup...');

    try {
      // Only save public identifiers
      await axios.post(`${API_BASE}/api/settings`, {
        user_id: userId,
        github_username: githubUsername.trim(),
        onboarding_complete: true
      });

      showToast.dismiss(toastId);
      showToast.success('Setup complete! Welcome aboard 🚀');

      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error: any) {
      showToast.dismiss(toastId);
      showToast.error('Failed to save settings: ' + (error.response?.data?.error || error.message));
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
        title="Setup - LinkedIn Post Bot"
        description="Initialize your AI-powered LinkedIn assistant"
      />

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-[0.05] dark:opacity-[0.02]"></div>
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
          <ThemeToggle />
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-16 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">

        {/* Progress */}
        <div className="flex items-center gap-4 mb-16">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500
                ${step === s ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-500/20 scale-110' :
                  step > s ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-white/5 text-gray-500'}
              `}>
                {step > s ? '✓' : s}
              </div>
              {s < 4 && (
                <div className={`w-12 h-1 mx-3 rounded-full transition-all duration-500 ${step > s ? 'bg-green-500' : 'bg-gray-200 dark:bg-white/5'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="w-full bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden min-h-[500px] flex flex-col">

          {/* Step 1: Welcome */}
          <div className={`flex-1 p-10 flex flex-col transition-opacity duration-500 ${step === 1 ? 'opacity-100' : 'hidden opacity-0'}`}>
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
              <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-xl animate-float">
                <span className="text-4xl">🚀</span>
              </div>
              <div>
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
                  Welcome to PostBot
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-lg mx-auto leading-relaxed">
                  Connect your accounts to start generating AI-powered LinkedIn content from your development activity.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                  <div className="font-semibold mb-1 text-gray-900 dark:text-white">🔗 LinkedIn</div>
                  <div className="text-sm text-gray-500">Post directly</div>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                  <div className="font-semibold mb-1 text-gray-900 dark:text-white">🐙 GitHub</div>
                  <div className="text-sm text-gray-500">Track commits</div>
                </div>
              </div>

              <button
                onClick={nextStep}
                className="w-full max-w-md bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-4 rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
              >
                Start Setup
              </button>
            </div>
          </div>

          {/* Step 2: Connect LinkedIn */}
          <div className={`flex-1 p-10 flex flex-col transition-opacity duration-500 ${step === 2 ? 'opacity-100' : 'hidden opacity-0'}`}>
            <h2 className="text-2xl font-bold mb-2">Connect LinkedIn</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Required for posting to your LinkedIn profile.</p>

            {linkedinConnected ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 rounded-2xl p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-green-600 dark:text-green-400 font-semibold">LinkedIn Connected!</p>
                  <p className="text-green-500/70 text-sm">Your account is ready for posting</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center">
                <button
                  onClick={handleConnectLinkedIn}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  Connect LinkedIn Account
                </button>
                <p className="text-center text-gray-500 text-sm mt-4">
                  You'll be redirected to LinkedIn to authorize access
                </p>
              </div>
            )}

            <div className="flex gap-4 pt-6 mt-auto border-t border-gray-200 dark:border-white/10">
              <button onClick={prevStep} className="px-6 py-3 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 font-medium transition-colors">
                Back
              </button>
              <button
                onClick={nextStep}
                disabled={!linkedinConnected}
                className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all py-3"
              >
                Continue
              </button>
            </div>
          </div>

          {/* Step 3: GitHub Username */}
          <div className={`flex-1 p-10 flex flex-col transition-opacity duration-500 ${step === 3 ? 'opacity-100' : 'hidden opacity-0'}`}>
            <h2 className="text-2xl font-bold mb-2">Set GitHub Username</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">We'll track your public activity to generate posts.</p>

            <div className="flex-1 space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-gray-400 font-mono">github.com/</span>
                <input
                  type="text"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  placeholder="your-username"
                  className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl pl-28 pr-4 py-3 focus:ring-2 focus:ring-green-500 outline-none transition-all font-mono"
                />
              </div>
              <p className="text-sm text-gray-500">
                This is your public GitHub username. We'll use it to fetch your activity for AI-generated posts.
              </p>
            </div>

            <div className="flex gap-4 pt-6 mt-auto border-t border-gray-200 dark:border-white/10">
              <button onClick={prevStep} className="px-6 py-3 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 font-medium transition-colors">
                Back
              </button>
              <button
                onClick={nextStep}
                disabled={!githubUsername.trim()}
                className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all py-3"
              >
                Continue
              </button>
            </div>
          </div>

          {/* Step 4: Complete */}
          <div className={`flex-1 p-10 flex flex-col transition-opacity duration-500 ${step === 4 ? 'opacity-100' : 'hidden opacity-0'}`}>
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
              <div className="w-24 h-24 bg-gradient-to-tr from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-xl">
                <span className="text-4xl">✨</span>
              </div>
              <div>
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
                  You're all set!
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-lg mx-auto leading-relaxed">
                  Your accounts are connected. Click below to start generating posts.
                </p>
              </div>

              <div className="w-full max-w-md space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-500/30">
                  <span className="text-green-600 dark:text-green-400 font-medium">LinkedIn Connected</span>
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/20 rounded-xl border border-gray-200 dark:border-gray-500/30">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">GitHub: {githubUsername}</span>
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6 mt-8 border-t border-gray-200 dark:border-white/10">
              <button onClick={prevStep} className="px-6 py-3 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 font-medium transition-colors">
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all py-3 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Finishing Up...
                  </>
                ) : 'Complete Setup & Go to Dashboard ✨'}
              </button>
            </div>
          </div>

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
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
}
