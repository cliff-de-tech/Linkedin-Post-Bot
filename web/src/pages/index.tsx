import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import SEOHead from '@/components/SEOHead';

export default function Home() {
  const router = useRouter();
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    // Scroll to top on page load
    window.scrollTo(0, 0);
    
    const onboarded = localStorage.getItem('onboarding_completed');
    setHasOnboarded(!!onboarded);
    
    // Check if user is authenticated
    checkAuth();

    // Check if user has accepted disclaimer
    const hasAccepted = localStorage.getItem('disclaimer_accepted');
    if (!hasAccepted) {
      setShowDisclaimer(true);
    }
  }, []);

  const checkAuth = async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      setIsAuthenticated(false);
      return;
    }

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(!!data.access_token);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      setIsAuthenticated(false);
    }
  };

  const handleAcceptDisclaimer = () => {
    localStorage.setItem('disclaimer_accepted', 'true');
    setShowDisclaimer(false);
  };

  const handleDeclineDisclaimer = () => {
    setShowDisclaimer(false);
    // Optionally redirect to a different page or show a message
  };

  const handleGetStarted = () => {
    if (hasOnboarded) {
      router.push('/settings');
    } else {
      router.push('/onboarding');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SEOHead 
        title="LinkedIn Post Bot - AI-Powered Content Creation for Developers"
        description="Transform your GitHub activity into engaging LinkedIn posts automatically. AI-powered content generation, activity tracking, and automated posting made simple."
        keywords="LinkedIn automation, AI content creation, GitHub activity, social media automation, developer tools, Groq LLM"
      />

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center space-x-3">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h2 className="text-2xl font-bold">Important Disclaimer</h2>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-yellow-900 mb-1">AI-Generated Content</h3>
                    <p className="text-sm text-yellow-800">
                      This service uses artificial intelligence to generate LinkedIn posts. <strong>Always review and edit content before publishing.</strong> AI may produce inaccurate, inappropriate, or misleading information.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">Third-Party Services</h3>
                    <p className="text-sm text-blue-800">
                      This application integrates with LinkedIn, GitHub, Groq AI, and Unsplash APIs. You are responsible for complying with their respective terms of service and rate limits.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded-r-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-purple-900 mb-1">Data & Privacy</h3>
                    <p className="text-sm text-purple-800">
                      Your API credentials are stored securely and encrypted. We never share your data with third parties. You can revoke access at any time. See our <Link href="/privacy" className="underline font-semibold">Privacy Policy</Link>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-red-900 mb-1">No Guarantees</h3>
                    <p className="text-sm text-red-800">
                      This service is provided "as is" without warranties. We do not guarantee post performance, engagement, or results. <strong>You are solely responsible for content published to your LinkedIn profile.</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">By continuing, you acknowledge:</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>You will review all AI-generated content before publishing</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>You accept responsibility for all published content</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>You agree to our <Link href="/terms" className="text-blue-600 hover:underline font-semibold">Terms of Service</Link> and <Link href="/privacy" className="text-blue-600 hover:underline font-semibold">Privacy Policy</Link></span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>You will comply with LinkedIn's and other third-party terms of service</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>You understand this is an experimental service and may have bugs or limitations</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-b-2xl flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={handleDeclineDisclaimer}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
              >
                Decline
              </button>
              <button
                onClick={handleAcceptDisclaimer}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                I Understand & Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                LinkedIn Post Bot
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                Features
              </button>
              <button
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                Demo
              </button>
              <button
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                How It Works
              </button>
              <button
                onClick={() => document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                Testimonials
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-4">
              {isAuthenticated && (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                >
                  Dashboard
                </button>
              )}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-700 hover:text-blue-600 transition-colors p-2"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated && (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                >
                  Dashboard
                </button>
              )}
              <button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu Dropdown */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'max-h-96' : 'max-h-0'
        }`}>
          <div className="px-4 pt-2 pb-4 space-y-2 bg-white border-b border-gray-200">
            <button
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                setIsMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 px-4 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors font-medium"
            >
              Features
            </button>
            <button
              onClick={() => {
                document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
                setIsMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 px-4 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors font-medium"
            >
              Demo
            </button>
            <button
              onClick={() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                setIsMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 px-4 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors font-medium"
            >
              How It Works
            </button>
            <button
              onClick={() => {
                document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' });
                setIsMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 px-4 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors font-medium"
            >
              Testimonials
            </button>
            <button
              onClick={() => {
                handleGetStarted();
                setIsMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 font-medium text-sm mb-6 animate-fade-in-up">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></span>
              AI-Powered Content Creation
            </div>
            
            <h1 className="text-6xl font-extrabold mb-6 animate-fade-in-up animation-delay-100">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Your Personal
              </span>
              <br />
              <span className="text-gray-900">LinkedIn Assistant</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
              Transform your GitHub activity into engaging LinkedIn posts automatically. 
              Let AI craft professional content while you focus on building.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up animation-delay-300">
              <button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Get Started Free →
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  const featuresSection = document.getElementById('features');
                  if (featuresSection) {
                    featuresSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="px-8 py-4 rounded-xl text-lg font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
              >
                Learn More
              </button>
            </div>

            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500 animate-fade-in-up animation-delay-400">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                No credit card required
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Setup in 5 minutes
              </div>
            </div>

            {/* Scroll Down Button */}
            <div className="mt-16 flex justify-center animate-fade-in-up animation-delay-500">
              <button
                onClick={() => {
                  const demoSection = document.getElementById('demo');
                  if (demoSection) {
                    demoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="w-14 h-14 rounded-full border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center animate-bounce hover:animate-none shadow-lg hover:shadow-xl"
                aria-label="Scroll to demo"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Interactive Demo Section */}
      <div id="demo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            See the Magic in Action
          </h2>
          <p className="text-xl text-gray-600">
            Watch how your GitHub activity transforms into professional LinkedIn content
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-fade-in-up">
          <div className="grid lg:grid-cols-2 divide-x divide-gray-200">
            {/* Left Side - GitHub Activity */}
            <div className="p-8 bg-gradient-to-br from-gray-50 to-white">
              <div className="flex items-center gap-3 mb-6 animate-fade-in-up animation-delay-100">
                <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Your GitHub Activity</h3>
                  <p className="text-sm text-gray-500">Raw developer data</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-lg transition-all animate-fade-in-up animation-delay-200 hover-lift cursor-pointer">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🚀</span>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">
                        Pushed 5 commits to ai-chat-app
                      </p>
                      <p className="text-sm text-gray-600">
                        • Added GPT-4 integration<br/>
                        • Implemented streaming responses<br/>
                        • Fixed token limit bug
                      </p>
                      <p className="text-xs text-gray-400 mt-2">2 hours ago</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 opacity-60 animate-fade-in-up animation-delay-300 hover:opacity-100 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🔀</span>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">
                        Merged PR #42 in react-dashboard
                      </p>
                      <p className="text-xs text-gray-400 mt-1">1 day ago</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 opacity-60 animate-fade-in-up animation-delay-400 hover:opacity-100 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✨</span>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">
                        Created new repo: ml-toolkit
                      </p>
                      <p className="text-xs text-gray-400 mt-1">3 days ago</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center animate-fade-in-up animation-delay-500">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Auto-detected from GitHub
                </div>
              </div>
            </div>

            {/* Right Side - LinkedIn Post */}
            <div className="p-8 bg-gradient-to-br from-blue-50 to-white">
              <div className="flex items-center gap-3 mb-6 animate-fade-in-up animation-delay-100">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">AI-Generated Post</h3>
                  <p className="text-sm text-gray-500">Professional LinkedIn content</p>
                </div>
              </div>

              <div className="bg-white border-2 border-blue-400 rounded-xl p-6 shadow-lg animate-fade-in-up animation-delay-200 hover:shadow-2xl hover:border-blue-500 transition-all hover-lift">
                <div className="space-y-4">
                  <p className="text-gray-800 leading-relaxed">
                    🚀 <strong>Exciting progress on my AI chat application!</strong>
                  </p>
                  
                  <p className="text-gray-800 leading-relaxed">
                    Just shipped a major update to my ai-chat-app project with some powerful new features:
                  </p>

                  <p className="text-gray-800 leading-relaxed">
                    ✨ Integrated GPT-4 for more intelligent conversations<br/>
                    ⚡ Implemented real-time streaming responses for better UX<br/>
                    🐛 Squashed a critical token limit bug that was affecting performance
                  </p>

                  <p className="text-gray-800 leading-relaxed">
                    It's amazing how far this project has come! The streaming feature alone has made the user experience feel so much more responsive and natural.
                  </p>

                  <p className="text-gray-800 leading-relaxed">
                    <span className="text-blue-600">#AI #MachineLearning #WebDevelopment #OpenAI #GPT4</span>
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                      </svg>
                      Like
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                      Comment
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                      </svg>
                      Share
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center animate-fade-in-up animation-delay-300">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                  <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generated by AI in 2 seconds
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transformation Arrow - Desktop Only */}
        <div className="hidden lg:flex items-center justify-center -mt-20 mb-12 relative z-10 animate-fade-in-up animation-delay-400">
          <button
            onClick={() => {
              const howItWorksSection = document.getElementById('how-it-works');
              if (howItWorksSection) {
                howItWorksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="bg-white rounded-full p-4 shadow-lg border-4 border-blue-500 hover:border-blue-600 hover:shadow-xl transition-all hover:scale-110 cursor-pointer group"
            aria-label="See how it works"
          >
            <svg className="w-8 h-8 text-blue-600 group-hover:text-blue-700 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Everything you need to succeed on LinkedIn
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="group bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:border-blue-200 hover-lift animate-fade-in-up animation-delay-100">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              AI-Powered Generation
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Advanced AI analyzes your GitHub activity and creates engaging, professional LinkedIn posts that sound like you
            </p>
          </div>

          <div className="group bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:border-purple-200 hover-lift animate-fade-in-up animation-delay-200">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Smart Activity Tracking
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Automatically detects commits, pull requests, new repositories, and project milestones from your GitHub
            </p>
          </div>

          <div className="group bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:border-pink-200 hover-lift animate-fade-in-up animation-delay-300">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              One-Click Publishing
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Preview, customize, and publish directly to LinkedIn with beautiful formatting and optional images
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10x</div>
              <div className="text-blue-100">Faster Content Creation</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-blue-100">Personalized Content</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Automated Updates</div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="bg-gradient-to-br from-gray-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-xl text-gray-600">
              From setup to your first post in under 5 minutes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative animate-fade-in-up animation-delay-100">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 h-full hover-lift">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  1
                </div>
                <div className="mt-4 mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-3">
                  Connect Your Accounts
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  Link your LinkedIn and GitHub accounts. Add your Groq API key for AI generation. Takes 2 minutes.
                </p>
              </div>
            </div>

            <div className="relative animate-fade-in-up animation-delay-200">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 h-full hover-lift">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  2
                </div>
                <div className="mt-4 mb-6">
                  <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-3">
                  Your Activity Syncs
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  We automatically track your GitHub commits, PRs, and releases. No manual updates needed.
                </p>
              </div>
            </div>

            <div className="relative animate-fade-in-up animation-delay-300">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 h-full hover-lift">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-pink-600 to-pink-700 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  3
                </div>
                <div className="mt-4 mb-6">
                  <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center mb-3">
                  Generate & Publish
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  Click any activity, AI generates a professional post, review it, and publish to LinkedIn instantly.
                </p>
              </div>
            </div>
          </div>

          {/* CTA in How It Works */}
          <div className="mt-16 text-center">
            <button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-5 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 inline-flex items-center gap-2"
            >
              Start Creating Content Now
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <p className="text-sm text-gray-500 mt-4">Free to start • No credit card required</p>
          </div>
        </div>
      </div>

      {/* Social Proof Section */}
      <div id="testimonials" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Loved by Developers Worldwide
          </h2>
          <p className="text-xl text-gray-600">
            Join hundreds of developers growing their LinkedIn presence
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover-lift animate-fade-in-up animation-delay-100">
            <div className="flex items-center mb-4">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
            </div>
            <p className="text-gray-700 italic mb-6">
              "This tool has completely transformed my LinkedIn presence. I went from posting once a month to 3x per week. My engagement has skyrocketed!"
            </p>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                SK
              </div>
              <div className="ml-4">
                <p className="font-semibold text-gray-900">Sarah Kim</p>
                <p className="text-sm text-gray-500">Full Stack Developer</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover-lift animate-fade-in-up animation-delay-200">
            <div className="flex items-center mb-4">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
            </div>
            <p className="text-gray-700 italic mb-6">
              "As someone who hates self-promotion, this is perfect. It turns my work into engaging content automatically. Saves me hours every week."
            </p>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                MJ
              </div>
              <div className="ml-4">
                <p className="font-semibold text-gray-900">Marcus Johnson</p>
                <p className="text-sm text-gray-500">ML Engineer</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover-lift animate-fade-in-up animation-delay-300">
            <div className="flex items-center mb-4">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
            </div>
            <p className="text-gray-700 italic mb-6">
              "The AI-generated posts feel authentic and personal. I've gotten multiple job offers from recruiters who found me through my LinkedIn content!"
            </p>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                EP
              </div>
              <div className="ml-4">
                <p className="font-semibold text-gray-900">Emily Patel</p>
                <p className="text-sm text-gray-500">Frontend Developer</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Amplify Your LinkedIn Presence?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Start creating professional, engaging content from your GitHub activity today
          </p>
          <button
            onClick={handleGetStarted}
            className="bg-white text-blue-600 px-10 py-5 rounded-xl text-lg font-bold hover:bg-gray-100 transition-all shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 inline-flex items-center gap-3"
          >
            Get Started for Free
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
          <p className="text-blue-100 mt-6">
            ✓ No credit card required &nbsp;&nbsp;•&nbsp;&nbsp; ✓ Setup in 5 minutes &nbsp;&nbsp;•&nbsp;&nbsp; ✓ Cancel anytime
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-white font-bold">LinkedIn Post Bot</span>
              </div>
              <p className="text-sm">
                AI-powered LinkedIn content creation from your GitHub activity
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button 
                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                    className="hover:text-white transition-colors"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/changelog" className="hover:text-white transition-colors">
                    Changelog
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/documentation" className="hover:text-white transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/api-reference" className="hover:text-white transition-colors">
                    API Reference
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="hover:text-white transition-colors">
                    Support
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="hover:text-white transition-colors">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2025 LinkedIn Post Bot. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
