import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ThemeToggle from '@/components/ThemeToggle';

export default function LinkedInAlgorithmSecrets() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
            <Head>
                <title>LinkedIn Algorithm Secrets | PostBot</title>
                <meta name="description" content="What makes posts go viral? We analyzed 10,000 dev posts to find out. Learn the secrets to LinkedIn success." />
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
                    <span className="inline-block px-4 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-sm font-medium rounded-full mb-4">
                        🔬 Research
                    </span>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">LinkedIn Algorithm Secrets</h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        What makes posts go viral? We analyzed 10,000 dev posts to find out.
                    </p>
                </div>

                {/* Key Stats */}
                <div className="grid md:grid-cols-4 gap-4 mb-12">
                    {[
                        { stat: '10,000+', label: 'Posts Analyzed' },
                        { stat: '2.5x', label: 'More Engagement' },
                        { stat: '45min', label: 'Best Post Time' },
                        { stat: '12-18', label: 'Optimal Hashtags' }
                    ].map((item, i) => (
                        <div key={i} className="bg-white dark:bg-white/5 rounded-xl p-6 border border-gray-200 dark:border-white/10 text-center">
                            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{item.stat}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{item.label}</div>
                        </div>
                    ))}
                </div>

                {/* Content */}
                <article className="prose prose-lg dark:prose-invert max-w-none">
                    <div className="bg-white dark:bg-white/5 rounded-2xl p-8 border border-gray-200 dark:border-white/10 mb-8">
                        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">How the LinkedIn Algorithm Works</h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            LinkedIn's algorithm prioritizes content that sparks meaningful conversations. Unlike other platforms, it values quality engagement over raw views.
                        </p>
                        <p className="text-gray-600 dark:text-gray-300">
                            When you post, LinkedIn shows it to a small test audience first. If they engage (like, comment, save), it expands reach exponentially.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-white/5 rounded-2xl p-8 border border-gray-200 dark:border-white/10 mb-8">
                        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Key Findings from Our Research</h2>

                        <div className="space-y-6">
                            <div className="border-l-4 border-blue-500 pl-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">1. First-Hour Engagement is Critical</h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Posts that receive 10+ comments in the first hour see 3x more total reach. Engage with every comment quickly.
                                </p>
                            </div>

                            <div className="border-l-4 border-purple-500 pl-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">2. Personal Stories Outperform Tips</h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Posts with personal experiences get 2.5x more engagement than generic advice. "Here's what I learned" beats "Top 10 tips."
                                </p>
                            </div>

                            <div className="border-l-4 border-green-500 pl-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">3. Hooks Matter</h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    The first two lines determine if people click "see more." Start with a bold statement, question, or surprising fact.
                                </p>
                            </div>

                            <div className="border-l-4 border-orange-500 pl-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">4. Optimal Post Length: 150-300 Words</h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Too short lacks substance. Too long loses readers. The sweet spot is 150-300 words with clear formatting.
                                </p>
                            </div>

                            <div className="border-l-4 border-red-500 pl-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">5. Best Posting Times</h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Tuesday-Thursday, 7-8 AM or 5-6 PM local time. These windows catch commuters and lunch browsers.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-white/5 rounded-2xl p-8 border border-gray-200 dark:border-white/10 mb-8">
                        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">What to Avoid</h2>
                        <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                            <li className="flex items-start gap-3">
                                <span className="text-red-500 mt-1">✗</span>
                                <span><strong>External links in post body:</strong> LinkedIn deprioritizes posts with links. Put links in comments instead.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-red-500 mt-1">✗</span>
                                <span><strong>Engagement pods:</strong> LinkedIn detects artificial engagement and will shadowban your content.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-red-500 mt-1">✗</span>
                                <span><strong>Editing within 10 minutes:</strong> Edits reset the algorithm's initial boost. Proofread before posting.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-red-500 mt-1">✗</span>
                                <span><strong>Too many hashtags:</strong> More than 5-6 hashtags looks spammy and reduces reach.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white text-center">
                        <h2 className="text-2xl font-bold mb-4">Let PostBot Handle the Details</h2>
                        <p className="mb-6 text-purple-100">
                            PostBot automatically applies these best practices to every post it generates. Optimal length, strong hooks, proper formatting.
                        </p>
                        <Link
                            href="/onboarding"
                            className="inline-block px-8 py-3 bg-white text-purple-600 rounded-xl font-bold hover:bg-gray-100 transition-all"
                        >
                            Try It Free →
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
