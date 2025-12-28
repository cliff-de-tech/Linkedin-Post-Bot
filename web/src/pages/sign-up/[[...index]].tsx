import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import InteractiveBackground from "@/components/ui/InteractiveBackground";

export default function SignUpPage() {
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
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 relative overflow-hidden">
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
                        Start building your<br />
                        <span className="text-purple-200">developer brand</span>
                    </h1>

                    <p className="text-lg text-purple-100 mb-10 max-w-md">
                        Join thousands of developers who are growing their professional presence on LinkedIn with AI-powered content.
                    </p>

                    {/* What You Get */}
                    <div className="space-y-4">
                        <h3 className="text-sm uppercase tracking-wider text-purple-200 font-medium mb-2">What you get:</h3>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                <span className="text-sm font-bold">10</span>
                            </div>
                            <span className="text-purple-100">Free posts per day</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <span className="text-purple-100">AI-powered content generation</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <span className="text-purple-100">Save hours on content creation</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <span className="text-purple-100">Secure OAuth authentication</span>
                        </div>
                    </div>

                    {/* Social Proof */}
                    <div className="mt-12 pt-8 border-t border-white/20">
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-3">
                                <div className="w-10 h-10 rounded-full bg-blue-400 border-2 border-white flex items-center justify-center text-xs font-bold">JD</div>
                                <div className="w-10 h-10 rounded-full bg-green-400 border-2 border-white flex items-center justify-center text-xs font-bold">AS</div>
                                <div className="w-10 h-10 rounded-full bg-yellow-400 border-2 border-white flex items-center justify-center text-xs font-bold">MK</div>
                                <div className="w-10 h-10 rounded-full bg-pink-400 border-2 border-white flex items-center justify-center text-xs font-bold">RB</div>
                            </div>
                            <div className="text-sm">
                                <div className="font-medium">Join 500+ developers</div>
                                <div className="text-purple-200">already growing with Post Bot</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Sign Up Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 relative">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
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
                            Create your account
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Start generating professional posts for free
                        </p>
                    </div>

                    {/* Clerk Sign Up Component */}
                    <div className="clerk-container">
                        <SignUp
                            path="/sign-up"
                            routing="path"
                            signInUrl="/sign-in"
                            appearance={{
                                elements: {
                                    rootBox: "mx-auto w-full",
                                    card: "shadow-none bg-transparent",
                                    headerTitle: "hidden",
                                    headerSubtitle: "hidden",
                                    socialButtonsBlockButton: "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                                    formButtonPrimary: "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all",
                                    footerActionLink: "text-purple-600 hover:text-purple-700",
                                    formFieldInput: "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 dark:text-white text-gray-900",
                                    formFieldLabel: "text-gray-700 dark:text-gray-300",
                                    identityPreviewEditButton: "text-purple-600",
                                    formResendCodeLink: "text-purple-600",
                                }
                            }}
                        />
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        <p>
                            Already have an account?{' '}
                            <Link href="/sign-in" className="text-purple-600 hover:text-purple-700 font-medium">
                                Sign in
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

                    {/* Terms */}
                    <div className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
                        By signing up, you agree to our{' '}
                        <Link href="/terms" className="underline hover:text-gray-600">Terms of Service</Link>
                        {' '}and{' '}
                        <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
