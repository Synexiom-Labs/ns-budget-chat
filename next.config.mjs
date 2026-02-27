/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclude ingest scripts from the Next.js build
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
  },
}

export default nextConfig;
