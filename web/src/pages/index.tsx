import { useRef, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import SEOHead from '@/components/SEOHead';
import ThemeToggle from '@/components/ThemeToggle';


export default function Home() {
  const router = useRouter();
  const { isSignedIn } = useUser();

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary transition-colors duration-300 overflow-x-hidden selection:bg-purple-500/30">
      <SEOHead
        title="LinkedIn Post Bot - Turn Commits into Authority"
        description="The AI agent that writes engaging LinkedIn posts from your GitHub activity. 10x faster."
      />

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-black/50 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
              PostBot
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-300">
            <a href="#features" className="hover:text-blue-600 dark:hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-blue-600 dark:hover:text-white transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-blue-600 dark:hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-blue-600 dark:hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />

            <SignedOut>
              <button
                onClick={() => router.push('/sign-in')}
                className="text-sm font-bold text-gray-700 dark:text-gray-200 hover:text-blue-600 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => router.push('/sign-up')}
                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-all hover:scale-105"
              >
                Get Started For Free
              </button>
            </SignedOut>

            <SignedIn>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all font-mono"
              >
                Dashboard &rarr;
              </button>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-16 px-6">
        {/* HERO SECTION */}
        <div className="max-w-7xl mx-auto text-center relative">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-500/30 text-blue-600 dark:text-blue-300 text-sm font-medium mb-8 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            New: GitHub Actions Integration
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 animate-fade-in-up animation-delay-100">
            <span className="block text-gray-900 dark:text-white">Turn GitHub Activity</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
              Into LinkedIn Authority
            </span>
          </h1>

          {/* Subhead */}
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up animation-delay-200">
            The AI agent that automatically writes engaging LinkedIn posts from your commits, PRs, and releases.
            <span className="block text-gray-900 dark:text-white font-semibold mt-2">Build your personal brand 10x faster.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 animate-fade-in-up animation-delay-300">
            <button
              onClick={() => router.push(isSignedIn ? '/dashboard' : '/sign-up')}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-blue-500/25 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
            >
              start generating for free
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <a
              href="https://github.com/cliff-de-tech/Linkedin-Post-Bot"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-lg hover:bg-gray-50 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              View on GitHub
            </a>
          </div>

          {/* Trust Signals */}
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400 mb-16 animate-fade-in-up animation-delay-400">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>No credit card required</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 16h-2v-6h2v6zm-1-6.891c-.607 0-1.1-.496-1.1-1.109 0-.612.492-1.109 1.1-1.109s1.1.497 1.1 1.109c0 .613-.492 1.109-1.1 1.109zm8 6.891h-1.998v-2.861c0-1.881-2.002-1.722-2.002 0v2.861h-2v-6h2v1.093c.872-1.616 4-1.736 4 1.548v3.359z" />
              </svg>
              <span>LinkedIn Safe</span>
            </div>
            <div className="flex items-center gap-2">
              <span>⭐ 4.9/5 from Developers</span>
            </div>
          </div>

          {/* 3D Dashboard Mockup */}
          <div className="relative mx-auto max-w-5xl animate-float-slow">
            <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-transparent z-10 bottom-0 h-40"></div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden transform perspective-1000 rotate-x-6 transition-transform duration-700 hover:rotate-x-0">
              {/* Mockup Header */}
              <div className="bg-gray-800 px-4 py-3 flex items-center gap-2 border-b border-gray-700">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex-1 text-center">
                  <div className="bg-gray-900 rounded-md px-3 py-1 text-xs text-gray-400 inline-block font-mono w-64">
                    postbot.app/dashboard
                  </div>
                </div>
              </div>

              {/* Mockup Content */}
              <div className="grid grid-cols-12 h-[500px] bg-gray-900 text-left">
                {/* Sidebar */}
                <div className="col-span-2 border-r border-gray-800 p-4 space-y-4 hidden sm:block">
                  <div className="h-4 w-20 bg-gray-800 rounded"></div>
                  <div className="space-y-2 pt-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-8 w-full bg-gray-800/50 rounded flex items-center px-2">
                        <div className="w-4 h-4 bg-gray-700 rounded mr-2"></div>
                        <div className="h-2 w-16 bg-gray-700 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Main Content */}
                <div className="col-span-12 sm:col-span-10 p-6 sm:p-8">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <div className="h-6 w-48 bg-gray-800 rounded mb-2"></div>
                      <div className="h-3 w-64 bg-gray-800/50 rounded"></div>
                    </div>
                    <div className="h-10 w-32 bg-blue-600 rounded"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {/* Generated Post Card */}
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gray-700"></div>
                        <div>
                          <div className="h-3 w-24 bg-gray-700 rounded mb-1"></div>
                          <div className="h-2 w-16 bg-gray-700/50 rounded"></div>
                        </div>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="h-2 w-full bg-gray-700/50 rounded"></div>
                        <div className="h-2 w-full bg-gray-700/50 rounded"></div>
                        <div className="h-2 w-3/4 bg-gray-700/50 rounded"></div>
                      </div>
                      <div className="h-48 w-full bg-gray-700/30 rounded border border-dashed border-gray-700 flex items-center justify-center text-gray-600 text-sm">
                        AI Generated Image
                      </div>
                    </div>

                    {/* GitHub Activity Card */}
                    <div className="bg-gray-800/30 border border-gray-800 rounded-xl p-6">
                      <div className="h-4 w-32 bg-gray-700 rounded mb-4"></div>
                      <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                            <div className="w-8 h-8 rounded bg-gray-700 flex-shrink-0"></div>
                            <div className="flex-1">
                              <div className="h-2 w-full bg-gray-700 rounded mb-1"></div>
                              <div className="h-2 w-24 bg-gray-700/50 rounded"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LOGO STRIP */}
        <div className="mt-20 border-t border-b border-gray-200 dark:border-white/5 py-10 bg-gray-50/50 dark:bg-white/5 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-8">Trusted by developers from</p>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              {/* Replaced with text/svg placeholders for logos to avoid external image deps */}
              <div className="flex items-center gap-2 font-bold text-xl font-sans"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg> GitHub</div>
              <div className="flex items-center gap-2 font-bold text-xl font-sans"><svg className="w-6 h-6" viewBox="0 0 76 65" fill="currentColor"><path d="M37.5274 0L75.0548 65H0L37.5274 0Z" /></svg> Vercel</div>
              <div className="flex items-center gap-2 font-bold text-xl font-sans">Groq Cloud</div>
              <div className="flex items-center gap-2 font-bold text-xl font-sans text-[#0A66C2]">LinkedIn</div>
            </div>
          </div>
        </div>

        {/* FEATURES GRID */}
        <div id="features" className="max-w-7xl mx-auto py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything you need to grow</h2>
            <p className="text-xl text-gray-500 dark:text-gray-400">Automate your personal brand while you code.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Code to Content', desc: 'Automatically turn your Git commits and PRs into engaging stories.', icon: '🤖' },
              { title: 'Brand Consistency', desc: 'Maintain a consistent posting schedule without breaking your flow.', icon: '📅' },
              { title: 'Developer Focused', desc: 'Understands tech stack, languages, and open source culture.', icon: '⚡' }
            ].map((feature, i) => (
              <div key={i} className="group p-8 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10">
                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* BEFORE/AFTER TRANSFORMATION SECTION */}

        <div className="max-w-7xl mx-auto py-24 border-t border-gray-200 dark:border-white/10">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 rounded-full bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-300 text-sm font-medium mb-4">
              See The Magic
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">From Commit to Content</h2>
            <p className="text-xl text-gray-500 dark:text-gray-400">
              Watch your code activity transform into engaging LinkedIn posts.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Before: GitHub Commit */}
            <div className="relative">
              <div className="absolute -top-3 left-4 px-3 py-1 bg-gray-800 text-white text-xs font-bold rounded-full z-10">
                BEFORE
              </div>
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 shadow-2xl">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">✓</div>
                  <div>
                    <div className="text-green-400 font-mono text-sm">feat: Add user authentication</div>
                    <div className="text-gray-500 text-xs">cliff-de-tech/my-saas-app</div>
                  </div>
                </div>
                <div className="font-mono text-sm">
                  <div className="text-gray-400 mb-2">{"// 3 files changed, 247 insertions"}</div>
                  <div className="text-green-400">{"+ import { ClerkProvider } from '@clerk/nextjs';"}</div>
                  <div className="text-green-400">{"+ export const authMiddleware = ..."}</div>
                  <div className="text-red-400">{"- // TODO: Add authentication"}</div>
                  <div className="text-gray-600 mt-2">...</div>
                </div>

              </div>
            </div>

            {/* Arrow */}
            <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 z-20">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>

            {/* After: LinkedIn Post */}
            <div className="relative">
              <div className="absolute -top-3 left-4 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full z-10">
                AFTER
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">CD</div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white">Cliff De-Tech</div>
                    <div className="text-gray-500 text-sm">Full Stack Developer • 2h</div>
                  </div>
                </div>
                <p className="text-gray-800 dark:text-gray-200 mb-4 leading-relaxed">
                  🔐 Just shipped user authentication for my SaaS project!
                  <br /><br />
                  Using Clerk for a seamless auth experience. The developer experience is incredible - had it running in under an hour.
                  <br /><br />
                  Key features:<br />
                  ✅ OAuth providers (Google, GitHub)<br />
                  ✅ Magic link sign-in<br />
                  ✅ Protected routes middleware
                  <br /><br />
                  Building in public is the best accountability. What auth solution do you use?
                  <br /><br />
                  #BuildInPublic #WebDev #SaaS #Authentication
                </p>
                <div className="flex items-center gap-6 text-gray-500 text-sm pt-4 border-t border-gray-200 dark:border-gray-700">
                  <span>👍 127</span>
                  <span>💬 23 comments</span>
                  <span>🔄 8 reposts</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VIDEO DEMO SECTION */}
        <div className="max-w-5xl mx-auto py-24 border-t border-gray-200 dark:border-white/10">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm font-medium mb-4">
              Watch It In Action
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">See PostBot Work Its Magic</h2>
            <p className="text-xl text-gray-500 dark:text-gray-400">
              A 2-minute walkthrough of the complete workflow.
            </p>
          </div>

          {/* Video Placeholder */}
          <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-gray-700 group cursor-pointer hover:border-blue-500/50 transition-all">
            {/* Fake video thumbnail */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Play button */}
              <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-blue-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            {/* Video timeline decoration */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">CD</div>
                <div className="flex-1">
                  <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-blue-500 rounded-full"></div>
                  </div>
                </div>
                <span className="text-white/70 text-sm font-mono">0:45 / 2:12</span>
              </div>
            </div>
            {/* Coming soon overlay */}
            <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 backdrop-blur text-white text-xs font-medium rounded-full">
              Demo Coming Soon
            </div>
          </div>
        </div>

        {/* HOW IT WORKS SECTION */}

        <div id="how-it-works" className="max-w-7xl mx-auto py-24 border-t border-gray-200 dark:border-white/10">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 text-sm font-medium mb-4">
              Simple 3-Step Process
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              From code to content in minutes, not hours.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line (desktop only) */}
            <div className="hidden md:block absolute top-16 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

            {[
              {
                step: '01',
                title: 'Connect Your GitHub',
                desc: 'Link your GitHub account and we\'ll automatically scan your recent commits, PRs, and repository updates.',
                icon: '🔗'
              },
              {
                step: '02',
                title: 'AI Generates Posts',
                desc: 'Our AI analyzes your activity and crafts engaging LinkedIn posts that showcase your work professionally.',
                icon: '✨'
              },
              {
                step: '03',
                title: 'Review & Publish',
                desc: 'Edit if needed, add images, and publish directly to LinkedIn with one click. Build your brand effortlessly.',
                icon: '🚀'
              }
            ].map((item, i) => (
              <div key={i} className="relative text-center group">
                {/* Step number circle */}
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform z-10 relative">
                  {item.step}
                </div>
                {/* Icon */}
                <div className="text-4xl mb-4">{item.icon}</div>
                {/* Content */}
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* TESTIMONIALS SECTION */}
        <div id="testimonials" className="max-w-7xl mx-auto py-24 border-t border-gray-200 dark:border-white/10">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 text-sm font-medium mb-4">
              Loved by Developers
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">What Developers Say</h2>
            <p className="text-xl text-gray-500 dark:text-gray-400">
              Join hundreds of developers building their personal brand.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "PostBot saved me hours every week. My LinkedIn engagement has tripled since I started using it to share my GitHub activity.",
                author: "Sarah Chen",
                role: "Senior Software Engineer",
                company: "Stripe",
                avatar: "👩‍💻"
              },
              {
                quote: "As a maintainer of multiple open source projects, I never had time to post about my work. Now it's automated and I get way more visibility.",
                author: "Marcus Johnson",
                role: "Open Source Maintainer",
                company: "React Native Community",
                avatar: "👨‍💻"
              },
              {
                quote: "I landed my dream job partly because recruiters found my LinkedIn posts about my coding projects. PostBot made that happen.",
                author: "Priya Sharma",
                role: "Full Stack Developer",
                company: "Vercel",
                avatar: "👩‍🔬"
              }
            ].map((testimonial, i) => (
              <div key={i} className="p-8 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:border-blue-500/30 transition-all duration-300 hover:shadow-xl">
                {/* Stars */}
                <div className="flex gap-1 mb-4 text-yellow-400">
                  {[1, 2, 3, 4, 5].map(star => (
                    <svg key={star} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                {/* Quote */}
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed italic">
                  "{testimonial.quote}"
                </p>
                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 flex items-center justify-center text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{testimonial.author}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role} @ {testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* STATS/SOCIAL PROOF SECTION */}
        <div className="max-w-7xl mx-auto py-20 border-t border-gray-200 dark:border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '2,500+', label: 'Developers', icon: '👨‍💻' },
              { value: '50,000+', label: 'Posts Generated', icon: '📝' },
              { value: '3x', label: 'Avg Engagement Boost', icon: '📈' },
              { value: '4.9/5', label: 'User Rating', icon: '⭐' }
            ].map((stat, i) => (
              <div key={i} className="group">
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-2 group-hover:scale-110 transition-transform">
                  {stat.value}
                </div>
                <div className="text-gray-500 dark:text-gray-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* INTEGRATIONS SECTION */}
        <div id="integrations" className="max-w-7xl mx-auto py-24 border-t border-gray-200 dark:border-white/10">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 text-sm font-medium mb-4">
              Seamless Connections
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Integrations</h2>
            <p className="text-xl text-gray-500 dark:text-gray-400">
              Connect with your favorite tools and platforms.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'GitHub', icon: '🐙', status: 'active', desc: 'Scan commits, PRs, releases' },
              { name: 'LinkedIn', icon: '💼', status: 'active', desc: 'Direct publishing via OAuth' },
              { name: 'Groq AI', icon: '⚡', status: 'active', desc: 'Lightning-fast AI generation' },
              { name: 'Unsplash', icon: '📸', status: 'active', desc: 'Beautiful stock images' },
              { name: 'GitLab', icon: '🦊', status: 'coming', desc: 'Coming Q1 2026' },
              { name: 'Bitbucket', icon: '🪣', status: 'coming', desc: 'Coming Q1 2026' },
              { name: 'Twitter/X', icon: '🐦', status: 'coming', desc: 'Coming Q2 2026' },
              { name: 'Threads', icon: '🧵', status: 'coming', desc: 'Coming Q2 2026' }
            ].map((integration, i) => (
              <div
                key={i}
                className={`p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg ${integration.status === 'active'
                  ? 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-blue-500/50'
                  : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/5 opacity-60'
                  }`}
              >
                <div className="text-3xl mb-3">{integration.icon}</div>
                <div className="font-bold mb-1 flex items-center gap-2">
                  {integration.name}
                  {integration.status === 'active' && (
                    <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">Active</span>
                  )}
                  {integration.status === 'coming' && (
                    <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full">Soon</span>
                  )}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{integration.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* PRICING SECTION */}
        <div id="pricing" className="max-w-7xl mx-auto py-24 border-t border-gray-200 dark:border-white/10">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 text-sm font-medium mb-4">
              Simple Pricing
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Start Free, Scale When Ready</h2>
            <p className="text-xl text-gray-500 dark:text-gray-400">
              No hidden fees. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div className="p-8 rounded-2xl bg-white dark:bg-white/5 border-2 border-green-500 dark:border-green-500/50 hover:shadow-xl transition-all relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                AVAILABLE NOW
              </div>
              <div className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">Free</div>
              <div className="text-4xl font-bold mb-1">$0</div>
              <div className="text-gray-500 mb-6">Forever free</div>
              <ul className="space-y-3 mb-8">
                {[
                  '10 posts per month',
                  '⚡ Groq AI content generation',
                  'Bot scans last 24 hours only',
                  'All activities (no filtering)',
                  'Standard template only',
                  'Manual publishing',
                  'Community support'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => router.push('/sign-up')}
                className="w-full py-3 px-6 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 transition-all"
              >
                Get Started Free
              </button>
            </div>

            {/* Pro Tier - Coming Soon */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-600/80 to-purple-700/80 text-white relative overflow-hidden transition-all shadow-xl opacity-90">
              <div className="absolute top-4 right-4 px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">
                COMING SOON
              </div>
              <div className="text-lg font-semibold text-blue-100 mb-2">Pro</div>
              <div className="text-4xl font-bold mb-1">$10</div>
              <div className="text-blue-200 mb-6">/month</div>
              <ul className="space-y-3 mb-8 opacity-80">
                {[
                  'Unlimited posts',
                  '🧠 3 AI models (GPT-4, Claude, Gemini-3-flash)',
                  '📅 Custom time range (1-30 days)',
                  '🔍 Filter by activity type',
                  '📝 Commit message reading',
                  'All post templates',
                  'Priority support'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <svg className="w-5 h-5 text-blue-200 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                disabled
                className="w-full py-3 px-6 rounded-xl bg-white/30 text-white font-bold cursor-not-allowed"
              >
                Coming Soon
              </button>
            </div>

            {/* Team Tier - Coming Soon */}
            <div className="p-8 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 transition-all relative opacity-90">
              <div className="absolute top-4 right-4 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-bold">
                COMING SOON
              </div>
              <div className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">Team</div>
              <div className="text-4xl font-bold mb-1">$30</div>
              <div className="text-gray-500 mb-6">/month</div>
              <ul className="space-y-3 mb-8 opacity-70">
                {[
                  'Everything in Pro',
                  'Up to 5 team members',
                  'Shared content library',
                  'Team analytics',
                  'SSO & Admin controls',
                  'Dedicated support'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                disabled
                className="w-full py-3 px-6 rounded-xl border-2 border-gray-300 dark:border-white/20 font-semibold text-gray-400 cursor-not-allowed"
              >
                Coming Soon
              </button>
            </div>
          </div>
        </div>


        {/* FAQ SECTION */}
        <div id="faq" className="max-w-4xl mx-auto py-24 border-t border-gray-200 dark:border-white/10">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-300 text-sm font-medium mb-4">
              Got Questions?
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-500 dark:text-gray-400">
              Everything you need to know about PostBot.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Is PostBot really free?',
                a: 'Yes! Our Free tier gives you 10 posts per day and 10 scheduled posts. No credit card required. Pro and Team tiers with unlimited posts are coming soon!'
              },

              {
                q: 'What AI model powers PostBot?',
                a: 'We use Groq Cloud with the Llama 3 70B model for lightning-fast, high-quality content generation. You can also bring your own Groq API key.'
              },
              {
                q: 'Is my data secure?',
                a: 'Absolutely. We use OAuth 2.0 for LinkedIn (no passwords stored), encrypt all API keys, and never store your GitHub code. We\'re fully GDPR compliant.'
              },
              {
                q: 'Does this violate LinkedIn\'s Terms of Service?',
                a: 'No. PostBot uses LinkedIn\'s official OAuth and Share APIs. All posts are user-initiated (not automated bots). We follow all LinkedIn compliance guidelines.'
              },
              {
                q: 'Can I edit the AI-generated posts?',
                a: 'Yes! Every post can be fully edited before publishing. Add your personal touch, adjust tone, include hashtags - you have complete control.'
              },
              {
                q: 'What happens to my scheduled posts if I downgrade?',
                a: 'Any already-scheduled posts will still be published. You just won\'t be able to schedule new ones until you upgrade again.'
              }
            ].map((faq, i) => (
              <details key={i} className="group p-6 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-blue-500/30 transition-all cursor-pointer">
                <summary className="flex items-center justify-between font-semibold text-lg list-none">
                  {faq.q}
                  <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* CTA SECTION */}

        <div className="max-w-5xl mx-auto mt-12 mb-20 p-12 rounded-3xl bg-gradient-to-br from-blue-600 to-purple-700 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-10"></div>
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to amplify your career?</h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Join thousands of developers turning their code into opportunities.
            </p>
            <button
              onClick={() => router.push(isSignedIn ? '/dashboard' : '/sign-up')}
              className="px-10 py-5 bg-white text-blue-600 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all hover:scale-105 shadow-xl"
            >
              Get Started for Free
            </button>
            <p className="mt-6 text-sm text-blue-200 opacity-80">No credit card required • Open Source • Secure</p>
          </div>
        </div>

        {/* RESOURCES SECTION */}
        <div className="max-w-7xl mx-auto py-24 border-t border-gray-200 dark:border-white/10">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 text-sm font-medium mb-4">
              Learn More
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Resources & Guides</h2>
            <p className="text-xl text-gray-500 dark:text-gray-400">
              Level up your LinkedIn game with our free resources.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Building in Public: Complete Guide',
                desc: 'Learn how to share your developer journey and grow your audience authentically.',
                icon: '📖',
                tag: 'Guide',
                tagClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                href: '/guides/building-in-public'
              },
              {
                title: 'LinkedIn Algorithm Secrets',
                desc: 'What makes posts go viral? We analyzed 10,000 dev posts to find out.',
                icon: '🔬',
                tag: 'Research',
                tagClass: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
                href: '/guides/linkedin-algorithm'
              },
              {
                title: 'API Documentation',
                desc: 'Integrate PostBot into your workflow with our comprehensive API docs.',
                icon: '⚙️',
                tag: 'Docs',
                tagClass: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
                href: '/documentation'
              }
            ].map((resource, i) => (
              <Link key={i} href={resource.href} className="group p-6 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-blue-500/30 transition-all hover:shadow-xl cursor-pointer block">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">{resource.icon}</span>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${resource.tagClass}`}>
                    {resource.tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-2 group-hover:text-blue-600 transition-colors">{resource.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{resource.desc}</p>
                <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Read more
                  <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* OPEN SOURCE BANNER */}
        <div className="max-w-5xl mx-auto mb-20 p-8 md:p-12 rounded-3xl bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span className="text-white font-bold text-xl">100% Open Source</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Built by developers, for developers
              </h3>
              <p className="text-gray-400 max-w-lg">
                PostBot is MIT licensed and open source. Star us on GitHub, contribute features, or fork it for your own use.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="https://github.com/cliff-de-tech/Linkedin-Post-Bot"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-100 transition-all hover:scale-105"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Star on GitHub
              </a>
              <a
                href="https://github.com/cliff-de-tech/Linkedin-Post-Bot/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 border-2 border-white/20 text-white rounded-xl font-bold hover:bg-white/10 transition-all"
              >
                Contribute
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>

      </main>


      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20">
        <div className="max-w-7xl mx-auto px-6 py-16">
          {/* Main Footer Content */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Product */}
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Product</h3>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/dashboard" className="hover:text-blue-500 transition-colors">Dashboard</Link></li>
                <li><Link href="/pricing" className="hover:text-blue-500 transition-colors">Pricing</Link></li>
                <li><Link href="/changelog" className="hover:text-blue-500 transition-colors">Changelog</Link></li>
                <li><Link href="/documentation" className="hover:text-blue-500 transition-colors">API Docs</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Resources</h3>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/guides/building-in-public" className="hover:text-blue-500 transition-colors">Building in Public Guide</Link></li>
                <li><Link href="/guides/linkedin-algorithm" className="hover:text-blue-500 transition-colors">LinkedIn Algorithm</Link></li>
                <li><Link href="/support" className="hover:text-blue-500 transition-colors">Help Center</Link></li>
                <li><Link href="/security" className="hover:text-blue-500 transition-colors">Security</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Company</h3>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/privacy" className="hover:text-blue-500 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-blue-500 transition-colors">Terms of Service</Link></li>
                <li><a href="mailto:support@postbot.dev" className="hover:text-blue-500 transition-colors">Contact Us</a></li>
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Connect</h3>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <a href="https://github.com/cliff-de-tech" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                    GitHub
                  </a>
                </li>
                <li>
                  <a href="https://twitter.com/cliffdetech" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                    Twitter / X
                  </a>
                </li>
                <li>
                  <a href="https://www.linkedin.com/in/clifford-opoku-sarkodie/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                    LinkedIn
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-gray-200 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">PostBot</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © 2025 PostBot. Open Source under MIT License. Made with ❤️ by <a href="https://github.com/cliff-de-tech" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Cliff De-Tech</a>
            </p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .rotate-x-6 {
          transform: rotateX(6deg);
        }
        .rotate-x-0 {
          transform: rotateX(0deg);
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
        }
        .animation-delay-100 { animation-delay: 0.1s; }
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-300 { animation-delay: 0.3s; }
        .animation-delay-400 { animation-delay: 0.4s; }
      `}</style>
    </div>
  );
}
