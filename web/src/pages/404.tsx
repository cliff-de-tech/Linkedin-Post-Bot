import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import SEOHead from '@/components/SEOHead';

export default function Custom404() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <SEOHead 
        title="404 - Page Not Found | LinkedIn Post Bot"
        description="The page you're looking for doesn't exist"
      />
      
      <div className="max-w-2xl w-full text-center">
        {/* Animated 404 Icon */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          </div>
          <div className="relative">
            <h1 className="text-9xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              404
            </h1>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 mb-12">
          <h2 className="text-3xl font-bold text-gray-900">
            Oops! Page Not Found
          </h2>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            The page you're looking for seems to have wandered off. Don't worry, we'll help you get back on track!
          </p>
        </div>

        {/* Auto-redirect info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 inline-block">
          <p className="text-sm text-blue-700">
            Redirecting to homepage in <span className="font-bold text-blue-900">{countdown}</span> seconds...
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/"
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            Go to Homepage
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto bg-white text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all border-2 border-gray-200"
          >
            Go to Dashboard
          </Link>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Or try one of these pages:</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/onboarding" className="text-blue-600 hover:text-blue-700 hover:underline">
              Get Started
            </Link>
            <span className="text-gray-300">•</span>
            <Link href="/settings" className="text-blue-600 hover:text-blue-700 hover:underline">
              Settings
            </Link>
            <span className="text-gray-300">•</span>
            <a href="/#features" className="text-blue-600 hover:text-blue-700 hover:underline">
              Features
            </a>
            <span className="text-gray-300">•</span>
            <a href="/#demo" className="text-blue-600 hover:text-blue-700 hover:underline">
              Demo
            </a>
          </div>
        </div>

        {/* Fun illustration */}
        <div className="mt-12 opacity-50">
          <svg className="w-48 h-48 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
