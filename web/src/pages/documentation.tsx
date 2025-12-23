import { useRouter } from 'next/router';
import Link from 'next/link';
import { useState } from 'react';
import SEOHead from '@/components/SEOHead';
import ThemeToggle from '@/components/ThemeToggle';

export default function Documentation() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: '🚀' },
    { id: 'linkedin-setup', title: 'LinkedIn Setup', icon: '🔗' },
    { id: 'groq-setup', title: 'Groq AI Setup', icon: '🤖' },
    { id: 'github-setup', title: 'GitHub Setup', icon: '🐙' },
    { id: 'unsplash-setup', title: 'Unsplash Setup', icon: '📸' },
    { id: 'using-dashboard', title: 'Using Dashboard', icon: '📊' },
    { id: 'troubleshooting', title: 'Troubleshooting', icon: '🔧' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>
      <SEOHead
        title="Documentation - LinkedIn Post Bot"
        description="Complete guide to setting up and using LinkedIn Post Bot"
      />

      <header className="relative bg-white/5 backdrop-blur-lg border-b border-white/10">
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
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium">← Back</button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <div className="bg-white/10 rounded-2xl p-6 shadow-lg border border-white/10 sticky top-6">
              <h3 className="font-semibold text-white mb-4">Navigation</h3>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-all ${activeSection === section.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10'
                      }`}
                  >
                    <span className="mr-2">{section.icon}</span>{section.title}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          <main className="lg:col-span-3">
            <div className="bg-white/10 rounded-2xl p-8 md:p-12 shadow-lg border border-white/10">

              {activeSection === 'getting-started' && (
                <div className="prose max-w-none">
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">🚀 Getting Started</h1>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 p-6 mb-6">
                    <p className="text-blue-900 dark:text-blue-200 font-medium">Welcome! This guide will help you set up LinkedIn Post Bot in about 10 minutes.</p>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">What You'll Need</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-2">🔗</span>
                        <h3 className="font-semibold text-gray-900 dark:text-white">LinkedIn Developer App</h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Required for posting to LinkedIn</p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Free to create</p>
                    </div>
                    <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-2">🤖</span>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Groq API Key</h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Powers AI post generation</p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Free tier available</p>
                    </div>
                    <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-2">🐙</span>
                        <h3 className="font-semibold text-gray-900 dark:text-white">GitHub Username</h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">To track your coding activity</p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Your existing account</p>
                    </div>
                    <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-2">📸</span>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Unsplash Key (Optional)</h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">For adding images to posts</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">○ Optional</p>
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">Quick Setup Steps</h2>
                  <div className="space-y-4">
                    <div className="flex items-start bg-gray-50 dark:bg-white/5 p-4 rounded-lg">
                      <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 font-bold">1</span>
                      <div>
                        <strong className="text-gray-900 dark:text-white">Create LinkedIn Developer App</strong>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Get Client ID and Secret from LinkedIn</p>
                      </div>
                    </div>
                    <div className="flex items-start bg-gray-50 dark:bg-white/5 p-4 rounded-lg">
                      <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 font-bold">2</span>
                      <div>
                        <strong className="text-gray-900 dark:text-white">Get Groq API Key</strong>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Free account at console.groq.com</p>
                      </div>
                    </div>
                    <div className="flex items-start bg-gray-50 dark:bg-white/5 p-4 rounded-lg">
                      <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 font-bold">3</span>
                      <div>
                        <strong className="text-gray-900 dark:text-white">Connect in Settings</strong>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Enter credentials and connect accounts</p>
                      </div>
                    </div>
                    <div className="flex items-start bg-gray-50 dark:bg-white/5 p-4 rounded-lg">
                      <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 font-bold">4</span>
                      <div>
                        <strong className="text-gray-900 dark:text-white">Start Creating Posts!</strong>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Generate AI posts from your GitHub activity</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'linkedin-setup' && (
                <div className="prose max-w-none">
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">🔗 LinkedIn Developer Setup</h1>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-600 p-6 mb-6">
                    <p className="text-yellow-900 dark:text-yellow-200"><strong>Important:</strong> Follow these steps exactly to avoid OAuth errors.</p>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">Step 1: Create a LinkedIn App</h2>
                  <ol className="space-y-4 text-gray-700 dark:text-gray-300">
                    <li className="flex items-start">
                      <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">1</span>
                      <div>
                        Go to <a href="https://www.linkedin.com/developers/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">LinkedIn Developers</a> and sign in
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">2</span>
                      <div>Click <strong>"Create app"</strong> button</div>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">3</span>
                      <div>
                        Fill in the required fields:
                        <ul className="mt-2 ml-4 text-sm">
                          <li>• <strong>App name:</strong> "LinkedIn Post Bot" (or your choice)</li>
                          <li>• <strong>LinkedIn Page:</strong> Select or create a company page</li>
                          <li>• <strong>Privacy policy URL:</strong> Can use your website or placeholder</li>
                          <li>• <strong>App logo:</strong> Upload any square image</li>
                        </ul>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">4</span>
                      <div>Click <strong>"Create app"</strong></div>
                    </li>
                  </ol>

                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">Step 2: Add Required Products</h2>
                  <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 p-6 mb-4">
                    <p className="text-red-900 dark:text-red-200"><strong>Critical:</strong> You MUST add these products or OAuth will fail!</p>
                  </div>
                  <ol className="space-y-3 text-gray-700 dark:text-gray-300">
                    <li>1. Go to the <strong>"Products"</strong> tab in your app</li>
                    <li>2. Find and request access to:
                      <ul className="mt-2 ml-6 space-y-2">
                        <li className="flex items-center">
                          <span className="text-green-600 mr-2">✓</span>
                          <strong>"Sign In with LinkedIn using OpenID Connect"</strong>
                        </li>
                        <li className="flex items-center">
                          <span className="text-green-600 mr-2">✓</span>
                          <strong>"Share on LinkedIn"</strong>
                        </li>
                      </ul>
                    </li>
                    <li>3. Wait for approval (usually instant for these products)</li>
                  </ol>

                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">Step 3: Configure OAuth Settings</h2>
                  <ol className="space-y-3 text-gray-700 dark:text-gray-300">
                    <li>1. Go to the <strong>"Auth"</strong> tab</li>
                    <li>2. Under <strong>"OAuth 2.0 settings"</strong>, add this redirect URL:
                      <pre className="bg-gray-900 text-green-400 p-3 rounded-lg mt-2 text-sm overflow-x-auto">http://localhost:8000/auth/linkedin/callback</pre>
                    </li>
                    <li>3. Verify your scopes show:
                      <ul className="mt-2 ml-6 space-y-1 text-sm">
                        <li>• <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">openid</code></li>
                        <li>• <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">profile</code></li>
                        <li>• <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">email</code></li>
                        <li>• <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">w_member_social</code></li>
                      </ul>
                    </li>
                  </ol>

                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">Step 4: Get Your Credentials</h2>
                  <ol className="space-y-3 text-gray-700 dark:text-gray-300">
                    <li>1. In the <strong>"Auth"</strong> tab, find <strong>"Application credentials"</strong></li>
                    <li>2. Copy your <strong>Client ID</strong></li>
                    <li>3. Click "Show" and copy your <strong>Client Secret</strong></li>
                    <li>4. Paste both into the Settings page of this app</li>
                  </ol>

                  <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-600 p-6 mt-8">
                    <p className="text-green-900 dark:text-green-200"><strong>Success!</strong> Once connected, LinkedIn credentials are no longer needed - your OAuth token handles everything.</p>
                  </div>
                </div>
              )}

              {activeSection === 'groq-setup' && (
                <div className="prose max-w-none">
                  <h1 className="text-4xl font-bold text-gray-900 mb-6">🤖 Groq AI Setup</h1>

                  <p className="text-lg text-gray-700 mb-6">Groq provides lightning-fast AI inference for generating your LinkedIn posts.</p>

                  <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Get Your Free API Key</h2>
                  <ol className="space-y-4 text-gray-700">
                    <li className="flex items-start">
                      <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">1</span>
                      <div>
                        Visit <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">console.groq.com</a>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">2</span>
                      <div>Sign up for a free account (Google/GitHub login available)</div>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">3</span>
                      <div>Navigate to <strong>"API Keys"</strong> in the left sidebar</div>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">4</span>
                      <div>Click <strong>"Create API Key"</strong></div>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">5</span>
                      <div>
                        Copy the key (starts with <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">gsk_</code>)
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">⚠️ Save it immediately - you can't see it again!</p>
                      </div>
                    </li>
                  </ol>

                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">Free Tier Limits</h2>
                  <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-6">
                    <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                      <li>✓ 14,400 requests per day</li>
                      <li>✓ 30 requests per minute</li>
                      <li>✓ Access to Llama 3.3 70B model</li>
                      <li>✓ No credit card required</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeSection === 'github-setup' && (
                <div className="prose max-w-none">
                  <h1 className="text-4xl font-bold text-gray-900 mb-6">🐙 GitHub Setup</h1>

                  <p className="text-lg text-gray-700 mb-6">We use your GitHub activity to generate relevant, authentic LinkedIn posts.</p>

                  <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Required: Your Username</h2>
                  <p className="text-gray-700 mb-4">Simply enter your GitHub username in Settings. That's it!</p>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <p className="text-sm text-gray-600 mb-2">Your username is the part after github.com/</p>
                    <code className="bg-gray-900 text-green-400 px-4 py-2 rounded block">github.com/<strong>your-username</strong></code>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">What We Track</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-4">
                      <div className="text-2xl mb-2">🚀</div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Push Events</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Your code commits</p>
                    </div>
                    <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-4">
                      <div className="text-2xl mb-2">🔀</div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Pull Requests</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">PRs opened and merged</p>
                    </div>
                    <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-4">
                      <div className="text-2xl mb-2">✨</div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Releases</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">New version releases</p>
                    </div>
                    <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-4">
                      <div className="text-2xl mb-2">📦</div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Repositories</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">New repos created</p>
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Optional: GitHub Token</h2>
                  <p className="text-gray-700 mb-4">Without a token, API is limited to 60 requests/hour. With a token: 5,000/hour.</p>

                  <div className="bg-blue-50 border-l-4 border-blue-600 p-6">
                    <p className="text-blue-900">For most users, the free limit is sufficient. Only add a token if you're hitting rate limits.</p>
                  </div>
                </div>
              )}

              {activeSection === 'unsplash-setup' && (
                <div className="prose max-w-none">
                  <h1 className="text-4xl font-bold text-gray-900 mb-6">📸 Unsplash Setup (Optional)</h1>

                  <p className="text-lg text-gray-700 mb-6">Add relevant images to your posts automatically. This is completely optional.</p>

                  <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Get Your Free Access Key</h2>
                  <ol className="space-y-4 text-gray-700">
                    <li className="flex items-start">
                      <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">1</span>
                      <div>
                        Visit <a href="https://unsplash.com/developers" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">unsplash.com/developers</a>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">2</span>
                      <div>Click <strong>"Register as a developer"</strong></div>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">3</span>
                      <div>Create a new application</div>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-sm font-bold">4</span>
                      <div>Copy your <strong>Access Key</strong></div>
                    </li>
                  </ol>

                  <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-6 mt-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Free Tier</h3>
                    <p className="text-gray-600 dark:text-gray-400">50 requests per hour - more than enough for typical usage!</p>
                  </div>
                </div>
              )}

              {activeSection === 'using-dashboard' && (
                <div className="prose max-w-none">
                  <h1 className="text-4xl font-bold text-gray-900 mb-6">📊 Using the Dashboard</h1>

                  <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Dashboard Features</h2>

                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                      <h3 className="font-semibold text-gray-900 mb-2">📝 Post Editor</h3>
                      <p className="text-gray-700">Enter context about your coding activity and generate AI-powered posts.</p>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">🐙 GitHub Activity Feed</h3>
                      <p className="text-gray-700 dark:text-gray-300">Click on any recent activity to auto-populate the post context.</p>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">👁️ Live Preview</h3>
                      <p className="text-gray-700 dark:text-gray-300">See exactly how your post will look before publishing.</p>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📊 Stats</h3>
                      <p className="text-gray-700 dark:text-gray-300">Track your monthly posts, drafts, and publishing history.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'troubleshooting' && (
                <div className="prose max-w-none">
                  <h1 className="text-4xl font-bold text-gray-900 mb-6">🔧 Troubleshooting</h1>

                  <div className="space-y-6">
                    <div className="bg-red-50 border-l-4 border-red-600 p-6">
                      <h3 className="font-semibold text-red-900 mb-2">401 Unauthorized Error</h3>
                      <p className="text-red-800 mb-3">When connecting LinkedIn:</p>
                      <ul className="space-y-1 text-red-800 text-sm">
                        <li>✓ Regenerate your Client Secret in LinkedIn Developer Portal</li>
                        <li>✓ Make sure you copied the FULL secret</li>
                        <li>✓ Check that "Sign In with LinkedIn" product is added</li>
                      </ul>
                    </div>

                    <div className="bg-red-50 border-l-4 border-red-600 p-6">
                      <h3 className="font-semibold text-red-900 mb-2">unauthorized_scope_error</h3>
                      <p className="text-red-800 mb-3">OAuth scope error:</p>
                      <ul className="space-y-1 text-red-800 text-sm">
                        <li>✓ Add "Sign In with LinkedIn using OpenID Connect" product</li>
                        <li>✓ Add "Share on LinkedIn" product</li>
                        <li>✓ Wait for products to be approved</li>
                      </ul>
                    </div>

                    <div className="bg-red-50 border-l-4 border-red-600 p-6">
                      <h3 className="font-semibold text-red-900 mb-2">403 Forbidden (api.linkedin.com/v2/me)</h3>
                      <p className="text-red-800 mb-3">This is now fixed! The app uses the correct OpenID Connect endpoint.</p>
                    </div>

                    <div className="bg-yellow-50 border-l-4 border-yellow-600 p-6">
                      <h3 className="font-semibold text-yellow-900 mb-2">Groq API Key Error</h3>
                      <p className="text-yellow-800 mb-3">Check:</p>
                      <ul className="space-y-1 text-yellow-800 text-sm">
                        <li>✓ Key starts with "gsk_"</li>
                        <li>✓ No extra spaces before/after</li>
                        <li>✓ Key is not expired</li>
                      </ul>
                    </div>

                    <div className="bg-yellow-50 border-l-4 border-yellow-600 p-6">
                      <h3 className="font-semibold text-yellow-900 mb-2">GitHub Activity Not Loading</h3>
                      <ul className="space-y-1 text-yellow-800 text-sm">
                        <li>✓ Username is correct (case-sensitive)</li>
                        <li>✓ Profile is public</li>
                        <li>✓ You have recent activity</li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
                    <h3 className="font-bold mb-2">Still Need Help?</h3>
                    <p className="mb-4">Contact our support team</p>
                    <Link href="/support" className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-all inline-block">
                      Get Support
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div >
    </div >
  );
}
