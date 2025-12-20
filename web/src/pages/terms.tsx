import { useRouter } from 'next/router';
import Link from 'next/link';
import SEOHead from '@/components/SEOHead';

export default function Terms() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SEOHead 
        title="Terms of Service - LinkedIn Post Bot"
        description="Terms of service for LinkedIn Post Bot. Read our user agreement and guidelines."
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: December 20, 2025</p>

          <div className="prose prose-blue max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Agreement to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using LinkedIn Post Bot ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not use our Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Description of Service</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                LinkedIn Post Bot provides automated content generation and publishing tools for LinkedIn, including:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>AI-powered post generation using Groq LLM</li>
                <li>GitHub activity tracking for content ideas</li>
                <li>LinkedIn post publishing via OAuth</li>
                <li>Post history and analytics</li>
                <li>Content templates and customization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">User Responsibilities</h2>
              <div className="space-y-4 text-gray-700">
                <p>When using our Service, you agree to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your API credentials</li>
                  <li>Comply with LinkedIn's Terms of Service</li>
                  <li>Not use the Service for spam or malicious purposes</li>
                  <li>Not share your account access with others</li>
                  <li>Review and approve all AI-generated content before publishing</li>
                  <li>Take responsibility for all content published through the Service</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">API Credentials and Third-Party Services</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  You are responsible for obtaining and maintaining your own API credentials for:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>LinkedIn Developer App (Client ID and Secret)</li>
                  <li>Groq API Key</li>
                  <li>GitHub Personal Access Token (optional)</li>
                  <li>Unsplash Access Key (optional)</li>
                </ul>
                <p className="mt-4">
                  We are not responsible for service interruptions caused by third-party API changes, rate limits, or outages.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Content Ownership and License</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>Your Content:</strong> You retain all ownership rights to content you create using our Service. By using the Service, you grant us a limited license to process and store your content to provide the Service.
                </p>
                <p>
                  <strong>AI-Generated Content:</strong> Content generated by our AI is provided as-is. You are responsible for reviewing, editing, and approving all AI-generated content before publishing.
                </p>
                <p>
                  <strong>Service Content:</strong> The Service itself, including its code, design, and documentation, is owned by LinkedIn Post Bot and protected by copyright laws.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Prohibited Uses</h2>
              <p className="text-gray-700 leading-relaxed mb-4">You may not use the Service to:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Violate any laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Post spam, malware, or harmful content</li>
                <li>Impersonate others or misrepresent your affiliation</li>
                <li>Attempt to breach or circumvent security measures</li>
                <li>Reverse engineer or copy the Service</li>
                <li>Use the Service for commercial purposes without permission</li>
                <li>Generate and publish content that violates LinkedIn's policies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Disclaimers</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>NO WARRANTIES:</strong> The Service is provided "AS IS" and "AS AVAILABLE" without any warranties of any kind, either express or implied.
                </p>
                <p>
                  <strong>AI ACCURACY:</strong> AI-generated content may contain errors or inaccuracies. Always review content before publishing.
                </p>
                <p>
                  <strong>SERVICE AVAILABILITY:</strong> We do not guarantee that the Service will be uninterrupted, secure, or error-free.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                To the maximum extent permitted by law, LinkedIn Post Bot shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mt-4">
                <li>Your use or inability to use the Service</li>
                <li>Any unauthorized access to or use of our servers</li>
                <li>Any interruption or cessation of the Service</li>
                <li>Any bugs, viruses, or malicious code</li>
                <li>Any errors or omissions in content</li>
                <li>Actions taken by third-party services (LinkedIn, Groq, GitHub, Unsplash)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Termination</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to terminate or suspend your access to the Service at any time, without prior notice or liability, for any reason, including breach of these Terms. You may also terminate your use of the Service at any time by revoking OAuth access and deleting your data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify users of any material changes by updating the "Last updated" date. Continued use of the Service after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have questions about these Terms, please contact us through the support channels on our website.
              </p>
            </section>

            <div className="bg-amber-50 border-l-4 border-amber-600 p-6 rounded-r-lg mt-8">
              <p className="text-sm text-amber-900">
                <strong>Legal Notice:</strong> This is a template Terms of Service for development purposes. Before launching in production, you must consult with a qualified attorney to create legally binding terms that comply with your jurisdiction and business model.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
