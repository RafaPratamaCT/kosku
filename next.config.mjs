/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer', 'bcryptjs'],
    outputFileTracingIncludes: {
      '/**': [
        './node_modules/.prisma/client/query_compiler_bg.wasm',
        './node_modules/.prisma/client/schema.prisma',
      ],
    },
  },
};

export default nextConfig;