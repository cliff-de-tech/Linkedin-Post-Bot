/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Enable gzip compression
  compress: true,

  // Optimize images
  images: {
    domains: ['images.unsplash.com', 'media.licdn.com'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24, // 24 hours
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // Power bundle analyzer in production
  productionBrowserSourceMaps: false,

  // Enable SWC minification (faster than Terser)
  swcMinify: true,

  // Remove console.log in production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Security and performance headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
    ]
  },

  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL + '/:path*',
      },
    ]
  },
}

module.exports = nextConfig
