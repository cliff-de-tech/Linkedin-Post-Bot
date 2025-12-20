import { useRouter } from 'next/router';
import Link from 'next/link';
import { useState } from 'react';
import SEOHead from '@/components/SEOHead';

export default function Documentation() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: '🚀' },
    { id: 'setup', title: 'Setup Guide', icon: '⚙️' },
    { id: 'authentication', title: 'Authentication', icon: '🔐' },
    { id: 'dashboard', title: 'Using Dashboard', icon: '📊' },
    { id: 'github', title: 'GitHub Integration', icon: '🐙' },
    { id: 'templates', title: 'Content Templates', icon: '📝' },
    { id: 'troubleshooting', title: 'Troubleshooting', icon: '🔧' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SEOHead 
        title="Documentation - LinkedIn Post Bot"
        description="Complete guide to using LinkedIn Post Bot. Learn how to set up, configure, and maximize your LinkedIn content creation."
      />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              LinkedIn Post Bot
            </span>
          </Link>
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Back
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-4">Navigation</h3>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                      activeSection === section.id
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-2">{section.icon}</span>
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg border border-gray-100">
              {activeSection === 'getting-started' && (
                <div className="prose max-w-none">
                  <h1 className="text-4xl font-bold text-gray-900 mb-6">🚀 Getting Started</h1>
                  
                  <p className="text-lg text-gray-700 mb-6">
                    Welcome to LinkedIn Post Bot! This guide will help you get up and running in minutes.
                  </p>

                  <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">What You'll Need</h2>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">✓</span>
                      LinkedIn Developer App (Client ID & Secret)
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">✓</span>
                      Groq API Key (free tier available)
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">✓</span>
                      GitHub Username
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">✓</span>
                      Unsplash API Key (optional, for images)
                    </li>
                  </ul>

                  <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Quick Start</h2>
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <ol className="space-y-4">
                      <li className="flex items-start">
                        <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">1</span>
                        <div>
                          <strong className="text-gray-900">Sign Up:</strong>
                          <p className="text-gray-600">Click "Get Started" and complete the onboarding flow</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">2</span>
                        <div>
                          <strong className="text-gray-900">Connect APIs:</strong>
                          <p className="text-gray-600">Enter your LinkedIn and Groq credentials in Settings</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">3</span>
                        <div>
                          <strong className="text-gray-900">Generate Content:</strong>
                          <p className="text-gray-600">Use your GitHub activity to create engaging LinkedIn posts</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">4</span>
                        <div>
                          <strong className="text-gray-900">Publish:</strong>
                          <p className="text-gray-600">Review and publish your posts to LinkedIn</p>
                        </div>
                      </li>
                    </ol>
                  </div>
                </div>
              )}

              {activeSection === 'setup' && (
                <div className="prose max-w-none">
                  <h1 className="text-4xl font-bold text-gray-900 mb-6">⚙️ Setup Guide</h1>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">LinkedIn Developer App</h2>
                  <p className="text-gray-700 mb-4">Follow these steps to create your LinkedIn app:</p>
                  <ol className="space-y-3 text-gray-700 list-decimal ml-6">
                    <li>Go to <a href="https://www.linkedin.com/developers/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">LinkedIn Developers</a></li>
                    <li>Click "Create app"</li>
                    <li>Fill in app details (name, company, logo)</li>
                    <li>Under "Auth" tab, add redirect URL: <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:8000/callback</code></li>
                    <li>Copy your Client ID and Client Secret</li>
                  </ol>

                  <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Groq API Key</h2>
                  <ol className="space-y-3 text-gray-700 list-decimal ml-6">
                    <li>Visit <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Groq Console</a></li>
                    <li>Sign up for a free account</li>
                    <li>Navigate to API Keys section</li>
                    <li>Generate a new API key</li>
                    <li>Copy and save securely</li>
                  </ol>

                  <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Environment Variables</h2>
                  <p className="text-gray-700 mb-4">For self-hosting, create a <code className="bg-gray-100 px-2 py-1 rounded">.env</code> file:</p>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
GROQ_API_KEY=your_groq_key
GITHUB_TOKEN=your_github_token (optional)
UNSPLASH_ACCESS_KEY=your_unsplash_key (optional)`}
                  </pre>
                </div>
              )}

              {activeSection === 'authentication' && (
                <div className="prose max-w-none">
                  <h1 className="text-4xl font-bold text-gray-900 mb-6">🔐 Authentication</h1>
                  
                  <p className="text-lg text-gray-700 mb-6">
                    LinkedIn Post Bot uses OAuth 2.0 for secure authentication with LinkedIn.
                  </p>

                  <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">How It Works</h2>
                  <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-6">
                    <ol className="space-y-3 text-gray-700">
                      <li><strong>Authorization:</strong> You're redirected to LinkedIn to approve access</li>
                      <li><strong>Token Exchange:</strong> LinkedIn returns an authorization code</li>
                      <li><strong>Access Token:</strong> We exchange the code for an access token</li>
                      <li><strong>Refresh:</strong> Tokens are automatically refreshed when expired</li>
                    </ol>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Token Security</h2>
                  <ul className="space-y-2 text-gray-700">
                    <li>✓ Tokens are encrypted at rest</li>
                    <li>✓ Never exposed in frontend code</li>
                    <li>✓ Automatically refreshed before expiry</li>
                    <li>✓ Revokable from your LinkedIn account</li>
                  </ul>
                </div>
              )}

              {activeSection === 'dashboard' && (
                <div className="prose max-w-none">
                  <h1 className="text-4xl font-bold text-gray-900 mb-6">📊 Using the Dashboard</h1>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Dashboard Features</h2>
                  
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                      <h3 className="font-semibold text-gray-900 mb-2">📝 Post Editor</h3>
                      <p className="text-gray-700">Create and edit your LinkedIn posts with context fields for type, commits, repo, and date.</p>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                      <h3 className="font-semibold text-gray-900 mb-2">👁️ Live Preview</h3>
                      <p className="text-gray-700">See exactly how your post will look on LinkedIn before publishing.</p>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                      <h3 className="font-semibold text-gray-900 mb-2">🐙 GitHub Activity</h3>
                      <p className="text-gray-700">Click on any GitHub activity to auto-populate post context.</p>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                      <h3 className="font-semibold text-gray-900 mb-2">📚 Templates</h3>
                      <p className="text-gray-700">Use pre-configured templates for different post types.</p>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                      <h3 className="font-semibold text-gray-900 mb-2">📊 Analytics</h3>
                      <p className="text-gray-700">Track your monthly post count, published posts, and drafts.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'github' && (
                <div className="prose max-w-none">
                  <h1 className="text-4xl font-bold text-gray-900 mb-6">🐙 GitHub Integration</h1>
                  
                  <p className="text-lg text-gray-700 mb-6">
                    Turn your code commits into engaging LinkedIn content automatically.
                  </p>

                  <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Supported Events</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="text-2xl mb-2">🚀</div>
                      <h3 className="font-semibold text-gray-900">Push Events</h3>
                      <p className="text-sm text-gray-600">Code commits and pushes</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="text-2xl mb-2">🔀</div>
                      <h3 className="font-semibold text-gray-900">Pull Requests</h3>
                      <p className="text-sm text-gray-600">PRs opened, merged, or closed</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="text-2xl mb-2">✨</div>
                      <h3 className="font-semibold text-gray-900">Releases</h3>
                      <p className="text-sm text-gray-600">New version releases</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="text-2xl mb-2">🐛</div>
                      <h3 className="font-semibold text-gray-900">Issues</h3>
                      <p className="text-sm text-gray-600">Issues created or closed</p>
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Rate Limits</h2>
                  <ul className="text-gray-700 space-y-2">
                    <li><strong>Without token:</strong> 60 requests/hour</li>
                    <li><strong>With token:</strong> 5,000 requests/hour</li>
                  </ul>
                </div>
              )}

              {activeSection === 'templates' && (
                <div className="prose max-w-none">
                  <h1 className="text-4xl font-bold text-gray-900 mb-6">📝 Content Templates</h1>
                  
                  <p className="text-lg text-gray-700 mb-6">
                    Pre-configured templates help you create consistent, professional content.
                  </p>

                  <div className="space-y-6">
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="font-semibold text-gray-900 mb-2">🚀 Feature Launch</h3>
                      <p className="text-gray-600 mb-3">Announce new features or product releases</p>
                      <div className="bg-gray-50 p-4 rounded text-sm text-gray-700">
                        Excited to share a new feature! [Feature description with benefits and use cases]
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="font-semibold text-gray-900 mb-2">🐛 Bug Fix</h3>
                      <p className="text-gray-600 mb-3">Share important bug fixes</p>
                      <div className="bg-gray-50 p-4 rounded text-sm text-gray-700">
                        Fixed a critical bug today. [Problem description and solution approach]
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="font-semibold text-gray-900 mb-2">💡 Learning</h3>
                      <p className="text-gray-600 mb-3">Share lessons and insights</p>
                      <div className="bg-gray-50 p-4 rounded text-sm text-gray-700">
                        Today I learned something interesting... [Key takeaway and practical application]
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'troubleshooting' && (
                <div className="prose max-w-none">
                  <h1 className="text-4xl font-bold text-gray-900 mb-6">🔧 Troubleshooting</h1>
                  
                  <div className="space-y-6">
                    <div className="bg-red-50 border-l-4 border-red-600 p-6">
                      <h3 className="font-semibold text-red-900 mb-2">Authentication Failed</h3>
                      <p className="text-red-800 mb-3">If LinkedIn OAuth isn't working:</p>
                      <ul className="space-y-1 text-red-800 text-sm">
                        <li>✓ Check redirect URI matches exactly</li>
                        <li>✓ Verify Client ID and Secret are correct</li>
                        <li>✓ Ensure app has "Sign In with LinkedIn" product enabled</li>
                      </ul>
                    </div>

                    <div className="bg-yellow-50 border-l-4 border-yellow-600 p-6">
                      <h3 className="font-semibold text-yellow-900 mb-2">GitHub Activity Not Loading</h3>
                      <p className="text-yellow-800 mb-3">Check these common issues:</p>
                      <ul className="space-y-1 text-yellow-800 text-sm">
                        <li>✓ Username is correct (case-sensitive)</li>
                        <li>✓ Profile is public</li>
                        <li>✓ Rate limit not exceeded (add GitHub token)</li>
                      </ul>
                    </div>

                    <div className="bg-blue-50 border-l-4 border-blue-600 p-6">
                      <h3 className="font-semibold text-blue-900 mb-2">AI Generation Slow</h3>
                      <p className="text-blue-800 mb-3">Performance tips:</p>
                      <ul className="space-y-1 text-blue-800 text-sm">
                        <li>✓ Groq API has rate limits on free tier</li>
                        <li>✓ Complex prompts take longer</li>
                        <li>✓ Consider upgrading to Pro for faster models</li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
                    <h3 className="font-bold mb-2">Still Need Help?</h3>
                    <p className="mb-4">Contact our support team for assistance</p>
                    <Link href="/support" className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-all inline-block">
                      Get Support
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
