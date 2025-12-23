import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ThemeToggle from '@/components/ThemeToggle';

export default function BuildingInPublicGuide() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
            <Head>
                <title>Building in Public: Complete Guide | PostBot</title>
                <meta name="description" content="Learn how to share your developer journey and grow your audience authentically with our complete guide to building in public." />
            </Head>

            {/* Header */}
            <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-white/10 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <button
                        onClick={() => router.back()}
                        className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
                    >
                        ← Back
                    </button>
                    <ThemeToggle />
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-12">
                {/* Hero */}
                <div className="text-center mb-12">
                    <span className="inline-block px-4 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium rounded-full mb-4">
                        📖 Guide
                    </span>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Building in Public: Complete Guide</h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Learn how to share your developer journey and grow your audience authentically.
                    </p>
                </div>

                {/* Content */}
                <article className="prose prose-lg dark:prose-invert max-w-none">
                    <div className="bg-white dark:bg-white/5 rounded-2xl p-8 border border-gray-200 dark:border-white/10 mb-8">
                        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">What is Building in Public?</h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            Building in public is a movement where developers, creators, and entrepreneurs share their journey openly—including the wins, losses, and lessons learned. Instead of hiding your work until it's "perfect," you invite others to follow along as you build.
                        </p>
                        <p className="text-gray-600 dark:text-gray-300">
                            This transparency creates trust, builds community, and often leads to unexpected opportunities like job offers, collaborations, and a loyal following.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-white/5 rounded-2xl p-8 border border-gray-200 dark:border-white/10 mb-8">
                        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Why Build in Public?</h2>
                        <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                            <li className="flex items-start gap-3">
                                <span className="text-green-500 mt-1">✓</span>
                                <span><strong>Accountability:</strong> Sharing your goals publicly keeps you motivated and committed.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-green-500 mt-1">✓</span>
                                <span><strong>Community:</strong> You'll connect with like-minded developers who can help, advise, or collaborate.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-green-500 mt-1">✓</span>
                                <span><strong>Career Growth:</strong> Recruiters and companies actively seek developers who share their work online.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-green-500 mt-1">✓</span>
                                <span><strong>Learning:</strong> Teaching others solidifies your own understanding and reveals blind spots.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-green-500 mt-1">✓</span>
                                <span><strong>Serendipity:</strong> You never know who's watching—opportunities often come from unexpected connections.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-white dark:bg-white/5 rounded-2xl p-8 border border-gray-200 dark:border-white/10 mb-8">
                        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">How to Start Building in Public</h2>

                        <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">1. Choose Your Platform</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            LinkedIn is ideal for professional networking and career growth. Twitter/X is great for the tech community. Choose one to start and expand later.
                        </p>

                        <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">2. Share Regularly</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            Consistency beats perfection. Aim for 3-5 posts per week. Share what you're working on, what you learned, and what challenges you faced.
                        </p>

                        <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">3. Be Authentic</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            Don't just share wins—share struggles too. People connect with authenticity, not perfection.
                        </p>

                        <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">4. Engage With Others</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            Building in public isn't just about broadcasting. Comment on others' posts, answer questions, and be part of the community.
                        </p>
                    </div>

                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
                        <h2 className="text-2xl font-bold mb-4">Ready to Start?</h2>
                        <p className="mb-6 text-blue-100">
                            PostBot automatically turns your GitHub activity into LinkedIn posts. Start building in public today.
                        </p>
                        <Link
                            href="/onboarding"
                            className="inline-block px-8 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-gray-100 transition-all"
                        >
                            Get Started Free →
                        </Link>
                    </div>
                </article>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-200 dark:border-white/10 py-8 mt-16">
                <div className="max-w-4xl mx-auto px-4 text-center text-gray-500 dark:text-gray-400">
                    <p>© 2024 PostBot. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
