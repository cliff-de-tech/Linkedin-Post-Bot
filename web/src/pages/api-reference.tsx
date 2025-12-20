import { useRouter } from 'next/router';
import Link from 'next/link';
import SEOHead from '@/components/SEOHead';

export default function APIReference() {
  const router = useRouter();

  const endpoints = [
    {
      method: 'GET',
      path: '/health',
      description: 'Health check endpoint',
      response: '{"ok": true}',
    },
    {
      method: 'GET',
      path: '/api/github/activity/{username}',
      description: 'Fetch GitHub activity for a user',
      params: ['username: GitHub username'],
      response: '[{"id": "...", "type": "PushEvent", "title": "...", ...}]',
    },
    {
      method: 'GET',
      path: '/api/posts/{user_id}',
      description: 'Get post history for a user',
      params: ['user_id: User identifier', 'status: (optional) Filter by status'],
      response: '[{"id": 1, "content": "...", "status": "published", ...}]',
    },
    {
      method: 'POST',
      path: '/api/posts',
      description: 'Save a new post',
      body: `{
  "user_id": "user_123",
  "post_content": "My LinkedIn post...",
  "post_type": "feature_launch",
  "context": {...},
  "status": "draft"
}`,
      response: '{"success": true, "post_id": 1}',
    },
    {
      method: 'GET',
      path: '/api/stats/{user_id}',
      description: 'Get user statistics',
      params: ['user_id: User identifier'],
      response: '{"total_posts": 42, "published_posts": 30, "posts_this_month": 5, "draft_posts": 12}',
    },
    {
      method: 'GET',
      path: '/api/templates',
      description: 'Get available content templates',
      response: '[{"name": "Feature Launch", "icon": "🚀", "context": {...}}, ...]',
    },
    {
      method: 'POST',
      path: '/api/generate-preview',
      description: 'Generate AI-powered post preview',
      body: `{
  "context": {
    "type": "feature_launch",
    "commits": "5",
    "repo": "my-project",
    "date": "2025-12-20"
  }
}`,
      response: '{"post": "Excited to announce..."}',
    },
    {
      method: 'POST',
      path: '/api/publish',
      description: 'Publish post to LinkedIn',
      body: `{
  "context": {...},
  "test_mode": false
}`,
      response: '{"success": true, "post": "...", "linkedin_id": "..."}',
    },
    {
      method: 'GET',
      path: '/api/settings/{user_id}',
      description: 'Get user settings',
      params: ['user_id: User identifier'],
      response: '{"linkedin_client_id": "...", "groq_api_key": "...", ...}',
    },
    {
      method: 'POST',
      path: '/api/settings',
      description: 'Update user settings',
      body: `{
  "user_id": "user_123",
  "linkedin_client_id": "...",
  "linkedin_client_secret": "...",
  "groq_api_key": "...",
  "github_username": "johndoe",
  "unsplash_access_key": "..."
}`,
      response: '{"success": true}',
    },
    {
      method: 'POST',
      path: '/api/auth/refresh',
      description: 'Refresh LinkedIn access token',
      body: '{"user_id": "user_123"}',
      response: '{"access_token": "...", "expires_in": 3600}',
    },
  ];

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'POST':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'PUT':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'DELETE':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SEOHead 
        title="API Reference - LinkedIn Post Bot"
        description="Complete API documentation for LinkedIn Post Bot. Integrate and automate your LinkedIn content creation."
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
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">API Reference</h1>
          <p className="text-lg text-gray-600 mb-6">
            Complete documentation for integrating with LinkedIn Post Bot API
          </p>
          
          <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg">
            <p className="text-blue-900 font-medium mb-2">Base URL</p>
            <code className="bg-white px-3 py-1 rounded text-blue-600 font-mono">
              http://localhost:8000
            </code>
            <p className="text-sm text-blue-800 mt-2">
              Production: <code className="bg-white px-2 py-0.5 rounded">https://api.linkedin-post-bot.com</code>
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {endpoints.map((endpoint, index) => (
            <div 
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getMethodColor(endpoint.method)}`}>
                    {endpoint.method}
                  </span>
                  <code className="text-gray-900 font-mono text-sm bg-gray-100 px-3 py-1 rounded">
                    {endpoint.path}
                  </code>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{endpoint.description}</p>

              {endpoint.params && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Parameters:</h4>
                  <ul className="space-y-1">
                    {endpoint.params.map((param, idx) => (
                      <li key={idx} className="text-sm text-gray-600 font-mono ml-4">
                        • {param}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {endpoint.body && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Request Body:</h4>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    {endpoint.body}
                  </pre>
                </div>
              )}

              {endpoint.response && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Response:</h4>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                    {endpoint.response}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Authentication */}
        <div className="mt-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Authentication</h2>
          <p className="mb-4">
            Most endpoints require authentication via LinkedIn OAuth 2.0. Include the access token in requests:
          </p>
          <pre className="bg-black/20 p-4 rounded-lg text-sm">
{`Authorization: Bearer YOUR_ACCESS_TOKEN`}
          </pre>
          <p className="text-blue-100 mt-4 text-sm">
            Tokens expire after 60 days. Use the <code className="bg-white/20 px-2 py-0.5 rounded">/api/auth/refresh</code> endpoint to renew.
          </p>
        </div>

        {/* Rate Limits */}
        <div className="mt-8 bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Rate Limits</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">100</div>
              <div className="text-sm text-gray-600">Requests per minute</div>
              <div className="text-xs text-gray-500 mt-1">Free tier</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600 mb-2">1000</div>
              <div className="text-sm text-gray-600">Requests per minute</div>
              <div className="text-xs text-gray-500 mt-1">Pro tier</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">Custom</div>
              <div className="text-sm text-gray-600">Unlimited requests</div>
              <div className="text-xs text-gray-500 mt-1">Enterprise tier</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
