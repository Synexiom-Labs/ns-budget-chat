/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclude ingest scripts from the Next.js build
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
  },

  // Security headers applied to all routes
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Legacy XSS filter (belt-and-suspenders)
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Limit referrer info sent to third parties
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Disable unnecessary browser features
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // HSTS — Vercel enforces HTTPS; this tells browsers to remember it
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ]
  },
}

export default nextConfig
