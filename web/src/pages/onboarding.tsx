import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { showToast } from '@/lib/toast';
import SEOHead from '@/components/SEOHead';

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    showToast.success('Setup complete! Redirecting to settings...');
    setTimeout(() => {
      router.push('/settings');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SEOHead 
        title="Get Started - LinkedIn Post Bot"
        description="Set up your LinkedIn Post Bot in just a few minutes"
      />
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            LinkedIn Post Bot Setup
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step >= s 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {s}
                </div>
                {s < 4 && (
                  <div className={`w-16 h-1 mx-2 transition-all ${
                    step > s ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome! 🎉</h2>
                <p className="text-lg text-gray-600">Let's get your LinkedIn Post Bot set up in just a few minutes</p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-100">
                <h3 className="font-semibold text-gray-900 mb-3">What you'll need:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>LinkedIn Developer App (Client ID & Secret)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>Groq API Key (free AI model access)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>GitHub Username (for activity tracking)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>Unsplash API Key (optional - for images)</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                Get Started →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 1: LinkedIn Developer App</h2>
              
              <div className="prose prose-blue max-w-none">
                <p className="text-gray-600">Create a LinkedIn app to enable OAuth authentication:</p>
                
                <div className="bg-gray-50 rounded-lg p-6 space-y-4 border border-gray-200">
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">1. Go to LinkedIn Developers</p>
                    <a 
                      href="https://www.linkedin.com/developers/apps" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 underline break-all"
                    >
                      https://www.linkedin.com/developers/apps
                    </a>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900 mb-2">2. Click "Create App"</p>
                    <p className="text-gray-600 text-sm">Fill in your app details (name, company, logo, etc.)</p>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900 mb-2">3. Go to "Auth" tab</p>
                    <p className="text-gray-600 text-sm mb-2">Add this redirect URL:</p>
                    <code className="block bg-white px-3 py-2 rounded border border-gray-300 text-sm">
                      http://localhost:3000/auth/callback
                    </code>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900 mb-2">4. Copy your credentials</p>
                    <p className="text-gray-600 text-sm">You'll need the Client ID and Client Secret in the next step</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-lg font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                >
                  Next: Groq API →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 2: Groq API Key</h2>
              
              <div className="prose prose-blue max-w-none">
                <p className="text-gray-600">Get your free Groq API key for AI-powered post generation:</p>
                
                <div className="bg-gray-50 rounded-lg p-6 space-y-4 border border-gray-200">
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">1. Go to Groq Console</p>
                    <a 
                      href="https://console.groq.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      https://console.groq.com
                    </a>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900 mb-2">2. Sign up / Login</p>
                    <p className="text-gray-600 text-sm">Use your Google account or email</p>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900 mb-2">3. Create API Key</p>
                    <p className="text-gray-600 text-sm">Go to API Keys section and click "Create API Key"</p>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900 mb-2">4. Copy your key</p>
                    <p className="text-gray-600 text-sm">Save it securely - you'll enter it in the next step</p>
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mt-4">
                  <p className="text-sm text-blue-900">
                    <strong>💡 Tip:</strong> Groq offers free tier with fast inference. Perfect for generating LinkedIn posts!
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-lg font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                >
                  Next: GitHub & Unsplash →
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 3: GitHub & Unsplash (Optional)</h2>
              
              <div className="prose prose-blue max-w-none space-y-6">
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">GitHub Username</h3>
                  <p className="text-gray-600 text-sm mb-2">
                    The bot will track your GitHub activity and generate posts about your commits, PRs, and new repos.
                  </p>
                  <p className="text-gray-600 text-sm">
                    Simply enter your GitHub username (e.g., <code className="bg-white px-2 py-1 rounded">octocat</code>)
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Unsplash API Key (Optional)</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Add relevant images to your posts automatically. If you skip this, posts will be text-only.
                  </p>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-gray-700">To get your key:</p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-600 ml-2">
                      <li>Go to <a href="https://unsplash.com/developers" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">unsplash.com/developers</a></li>
                      <li>Create a new app</li>
                      <li>Copy your "Access Key"</li>
                    </ol>
                  </div>
                </div>

                <div className="bg-green-50 border-l-4 border-green-600 p-4">
                  <p className="text-sm text-green-900">
                    <strong>✅ You're all set!</strong> Click below to enter your credentials.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-3 rounded-lg font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
                >
                  ← Back
                </button>
                <button
                  onClick={handleComplete}
                  className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                >
                  Complete Setup →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Skip Link */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/settings')}
            className="text-gray-500 hover:text-gray-700 text-sm underline"
          >
            Skip tutorial and go to settings
          </button>
        </div>
      </main>
    </div>
  );
}
