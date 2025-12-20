import { useRouter } from 'next/router';
import Link from 'next/link';
import SEOHead from '@/components/SEOHead';

export default function Changelog() {
  const router = useRouter();

  const updates = [
    {
      version: '1.2.0',
      date: 'December 20, 2025',
      type: 'feature',
      items: [
        'Added toast notifications for better user feedback',
        'Implemented form validation on Settings page',
        'Added mobile hamburger menu for responsive navigation',
        'SEO improvements with comprehensive meta tags',
        'New custom favicon with brand colors',
        'Created 404 error page with auto-redirect',
        'Added Privacy Policy and Terms of Service pages',
      ]
    },
    {
      version: '1.1.0',
      date: 'December 15, 2025',
      type: 'feature',
      items: [
        'GitHub activity feed integration',
        'Post history tracking with status management',
        'Content templates library with 5 pre-configured templates',
        'Statistics dashboard with monthly analytics',
        'Enhanced UI with animations and hover effects',
        'Smooth scroll navigation on homepage',
      ]
    },
    {
      version: '1.0.0',
      date: 'December 10, 2025',
      type: 'major',
      items: [
        '🎉 Initial launch!',
        'AI-powered content generation using Groq LLM',
        'LinkedIn OAuth authentication',
        'Multi-user support with user settings',
        'Onboarding wizard for new users',
        'Dashboard with post editor and preview',
        'GitHub activity tracking',
      ]
    },
    {
      version: '0.5.0',
      date: 'December 5, 2025',
      type: 'feature',
      items: [
        'Backend API with FastAPI',
        'Service modules architecture',
        'SQLite database integration',
        'Image service with Unsplash',
        'Post scheduling framework',
      ]
    }
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'major':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'feature':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'fix':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SEOHead 
        title="Changelog - LinkedIn Post Bot"
        description="Stay updated with the latest features and improvements to LinkedIn Post Bot"
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
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Changelog</h1>
          <p className="text-lg text-gray-600">
            Track all updates, new features, and improvements
          </p>
        </div>

        <div className="space-y-8">
          {updates.map((update, index) => (
            <div 
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    v{update.version}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getTypeColor(update.type)}`}>
                    {update.type.toUpperCase()}
                  </span>
                </div>
                <time className="text-sm text-gray-500">{update.date}</time>
              </div>

              <ul className="space-y-3">
                {update.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Subscribe to Updates */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">Stay Updated</h3>
          <p className="text-blue-100 mb-6">
            Get notified about new features and updates
          </p>
          <div className="max-w-md mx-auto flex gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all">
              Subscribe
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
