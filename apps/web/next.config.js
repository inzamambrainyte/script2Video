/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow Remotion Player to work
  transpilePackages: ['@remotion/player'],
}

module.exports = nextConfig
