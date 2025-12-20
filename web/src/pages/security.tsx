import { useRouter } from 'next/router';
import Link from 'next/link';
import SEOHead from '@/components/SEOHead';

export default function Security() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SEOHead 
        title="Security - LinkedIn Post Bot"
        description="Learn about our security practices and how we protect your data"
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Security & Compliance</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your data security is our top priority. Learn about our security measures and best practices.
          </p>
        </div>

        {/* Security Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Encryption at Rest</h3>
            <p className="text-gray-700">
              All sensitive data including API credentials and tokens are encrypted using industry-standard AES-256 encryption before being stored in our databases.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">OAuth 2.0</h3>
            <p className="text-gray-700">
              We use LinkedIn's OAuth 2.0 protocol for authentication. Your LinkedIn password is never stored or transmitted through our systems.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">HTTPS Only</h3>
            <p className="text-gray-700">
              All data transmission between your browser and our servers is encrypted using TLS 1.3, ensuring your data cannot be intercepted.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Access Controls</h3>
            <p className="text-gray-700">
              Strict role-based access controls ensure only authorized personnel can access infrastructure and sensitive data.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Regular Audits</h3>
            <p className="text-gray-700">
              We conduct regular security audits and penetration testing to identify and fix vulnerabilities before they can be exploited.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Data Isolation</h3>
            <p className="text-gray-700">
              Each user's data is isolated and segmented, preventing unauthorized access to other users' information.
            </p>
          </div>
        </div>

        {/* Compliance */}
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg border border-gray-100 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Compliance & Standards</h2>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-3">🔒</div>
              <h3 className="font-semibold text-gray-900 mb-2">GDPR Ready</h3>
              <p className="text-sm text-gray-600">
                Compliant with EU data protection regulations
              </p>
            </div>

            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-3">🛡️</div>
              <h3 className="font-semibold text-gray-900 mb-2">SOC 2</h3>
              <p className="text-sm text-gray-600">
                Type II certification in progress
              </p>
            </div>

            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="font-semibold text-gray-900 mb-2">CCPA</h3>
              <p className="text-sm text-gray-600">
                California Consumer Privacy Act compliant
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg">
            <p className="text-blue-900">
              <strong>Enterprise Customers:</strong> We can provide custom security documentation, BAAs, DPAs, and participate in vendor security assessments. <Link href="/support" className="underline font-semibold">Contact sales</Link> for more information.
            </p>
          </div>
        </div>

        {/* Best Practices */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-white mb-12">
          <h2 className="text-3xl font-bold mb-6">Security Best Practices</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <svg className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold mb-1">Use Strong API Keys</p>
                <p className="text-blue-100 text-sm">Keep your LinkedIn and Groq API keys secure and rotate them regularly</p>
              </div>
            </div>

            <div className="flex items-start">
              <svg className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold mb-1">Review Generated Content</p>
                <p className="text-blue-100 text-sm">Always review AI-generated posts before publishing to ensure accuracy</p>
              </div>
            </div>

            <div className="flex items-start">
              <svg className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold mb-1">Revoke Access When Not in Use</p>
                <p className="text-blue-100 text-sm">You can revoke LinkedIn access from your LinkedIn settings at any time</p>
              </div>
            </div>

            <div className="flex items-start">
              <svg className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold mb-1">Monitor Your Activity</p>
                <p className="text-blue-100 text-sm">Check your post history regularly for any unexpected activity</p>
              </div>
            </div>
          </div>
        </div>

        {/* Report Vulnerability */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Report a Security Issue</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            If you discover a security vulnerability, please report it responsibly. We appreciate your help in keeping our users safe.
          </p>
          <Link
            href="/support"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            Report Vulnerability
          </Link>
          <p className="text-sm text-gray-500 mt-4">
            Or email us directly at: <a href="mailto:security@linkedin-post-bot.com" className="text-blue-600 hover:underline">security@linkedin-post-bot.com</a>
          </p>
        </div>
      </main>
    </div>
  );
}
