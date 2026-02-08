/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse-new', 'mammoth'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('pdf-parse-new', 'mammoth');
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
  // Allow external hosts (CodeSandbox, Replit, Vercel preview, etc.)
  allowedDevOrigins: [
    '*.csb.app',
    '*.codesandbox.io',
    '*.repl.co',
    '*.replit.dev',
    'localhost',
  ],
};

export default nextConfig;
