/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static.tryleap.ai',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'app.tryleap.ai',
        port: '',
        pathname: '/**',
      },
    ],
  }
}

module.exports = nextConfig
