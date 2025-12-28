import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import InteractiveBackground from "@/components/ui/InteractiveBackground";

export default function SignInPage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <div className="min-h-screen flex">
            {/* Animated Background */}
            <InteractiveBackground />
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            {/* Lightning bolt - Post Bot logo */}
                            <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
                                <path d="M18 4l-8 12h6l-2 12 10-14h-6l4-10z" fill="white" stroke="white" strokeWidth="0.5" />
                            </svg>
                        </div>
                        <span className="text-2xl font-bold">Post Bot</span>
                    </div>

                    {/* Main Heading */}
                    <h1 className="text-4xl xl:text-5xl font-bold mb-6 leading-tight">
                        Turn your code into<br />
                        <span className="text-blue-200">professional content</span>
                    </h1>

                    <p className="text-lg text-blue-100 mb-10 max-w-md">
                        Transform your GitHub activity into engaging LinkedIn posts with AI-powered content generation.
                    </p>

                    {/* Features */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-blue-100">Scan GitHub commits, PRs, and pushes</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-blue-100">AI generates professional posts</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-blue-100">One-click publish to LinkedIn</span>
                        </div>
                    </div>

                    {/* Testimonial/Stats */}
                    <div className="mt-12 pt-8 border-t border-white/20">
                        <div className="flex items-center gap-8">
                            <div>
                                <div className="text-3xl font-bold">10K+</div>
                                <div className="text-sm text-blue-200">Posts Generated</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold">500+</div>
                                <div className="text-sm text-blue-200">Active Users</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold">4.9★</div>
                                <div className="text-sm text-blue-200">User Rating</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Sign In Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 relative">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                            {/* Lightning bolt - Post Bot logo */}
                            <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
                                <path d="M18 4l-8 12h6l-2 12 10-14h-6l4-10z" fill="white" stroke="white" strokeWidth="0.5" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">Post Bot</span>
                    </div>

                    {/* Theme Toggle */}
                    <div className="absolute top-4 right-4">
                        <ThemeToggle />
                    </div>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Welcome back
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Sign in to continue to your dashboard
                        </p>
                    </div>

                    {/* Clerk Sign In Component */}
                    <div className="clerk-container">
                        <SignIn
                            path="/sign-in"
                            routing="path"
                            signUpUrl="/sign-up"
                            appearance={{
                                elements: {
                                    rootBox: "mx-auto w-full",
                                    card: "shadow-none bg-transparent",
                                    headerTitle: "hidden",
                                    headerSubtitle: "hidden",
                                    socialButtonsBlockButton: "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                                    formButtonPrimary: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all",
                                    footerActionLink: "text-blue-600 hover:text-blue-700",
                                    formFieldInput: "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 dark:text-white text-gray-900",
                                    formFieldLabel: "text-gray-700 dark:text-gray-300",
                                    identityPreviewEditButton: "text-blue-600",
                                    formResendCodeLink: "text-blue-600",
                                }
                            }}
                        />
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        <p>
                            Don&apos;t have an account?{' '}
                            <Link href="/sign-up" className="text-blue-600 hover:text-blue-700 font-medium">
                                Sign up for free
                            </Link>
                        </p>
                    </div>

                    {/* Back to Home */}
                    <div className="mt-6 text-center">
                        <Link
                            href="/"
                            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
