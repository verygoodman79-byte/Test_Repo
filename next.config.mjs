/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdf-parse', 'mammoth'],
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'mammoth'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('pdf-parse', 'mammoth');
    }
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      canvas: false,
    };
    return config;
  },
  // Allow external hosts (CodeSandbox, Replit, etc.)
  allowedDevOrigins: ['*'],
};

export default nextConfig;
