import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/components/ThemeProvider'
import ErrorBoundary from '@/components/ErrorBoundary'
import SkipToContent from '@/components/SkipToContent'
import AnimatedBackground from '@/components/ui/AnimatedBackground'

import { ClerkProvider } from '@clerk/nextjs'


export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isOnboarding = router.pathname === '/onboarding';

  // Initialize QueryClient with useState to prevent recreation on re-renders
  // This ensures the cache persists across component updates
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
        refetchOnWindowFocus: false, // Disable auto-refetch on focus for better UX
        retry: 1, // Only retry failed requests once
      },
    },
  }));

  return (
    <ClerkProvider {...pageProps}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ErrorBoundary>
            {/* Global animated background - Interactive particle theme on all pages EXCEPT onboarding */}
            {!isOnboarding && (
              <AnimatedBackground intensity="subtle" variant="interactive" fixed={true} />
            )}
            <SkipToContent />
            <Component {...pageProps} />
            <Toaster />
          </ErrorBoundary>
        </ThemeProvider>
      </QueryClientProvider>
    </ClerkProvider>
  )
}
