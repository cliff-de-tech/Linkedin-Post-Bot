import { useRouter } from 'next/router';
import Link from 'next/link';
import SEOHead from '@/components/SEOHead';

export default function Privacy() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SEOHead 
        title="Privacy Policy - LinkedIn Post Bot"
        description="Privacy policy for LinkedIn Post Bot. Learn how we handle your data."
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: December 20, 2025</p>

          <div className="prose prose-blue max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                LinkedIn Post Bot ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Information We Collect</h2>
              <div className="space-y-4 text-gray-700">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">API Credentials</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>LinkedIn OAuth tokens (Client ID, Client Secret, Access Tokens)</li>
                    <li>Groq API keys for AI content generation</li>
                    <li>GitHub usernames for activity tracking</li>
                    <li>Unsplash API keys (optional)</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Usage Data</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Generated post content and history</li>
                    <li>Post status (draft, published)</li>
                    <li>Usage statistics and analytics</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Automatically Collected Information</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Browser type and version</li>
                    <li>IP address</li>
                    <li>Device information</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>To provide and maintain our service</li>
                <li>To generate AI-powered LinkedIn posts</li>
                <li>To track your GitHub activity for content ideas</li>
                <li>To publish posts to your LinkedIn profile (with your authorization)</li>
                <li>To improve and optimize our service</li>
                <li>To communicate with you about service updates</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Storage and Security</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  We store your data securely using industry-standard encryption. Your API credentials are stored in encrypted databases and are never shared with third parties.
                </p>
                <p>
                  Your data is stored in SQLite databases on our servers with the following protections:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Encrypted at rest</li>
                  <li>Secure server access controls</li>
                  <li>Regular security audits</li>
                  <li>No sharing with third parties</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Third-Party Services</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We integrate with the following third-party services:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>LinkedIn:</strong> OAuth authentication and post publishing</li>
                <li><strong>Groq:</strong> AI content generation</li>
                <li><strong>GitHub:</strong> Activity tracking (public data only)</li>
                <li><strong>Unsplash:</strong> Image fetching (optional)</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Each service has its own privacy policy governing their use of your data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-4">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Export your data</li>
                <li>Revoke OAuth access at any time</li>
                <li>Opt-out of our service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain your data for as long as your account is active. If you delete your account or revoke access, we will delete your data within 30 days, except where we are required to retain it by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Our service is not intended for users under the age of 18. We do not knowingly collect data from children.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have questions about this Privacy Policy, please contact us through the support channels on our website.
              </p>
            </section>

            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg mt-8">
              <p className="text-sm text-blue-900">
                <strong>Important:</strong> This is a template privacy policy for development purposes. Before launching in production, you should consult with a legal professional to ensure compliance with applicable laws (GDPR, CCPA, etc.).
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
