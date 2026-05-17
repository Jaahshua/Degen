/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // The TS "instantiation excessively deep" error originates inside viem/ox's
    // shipped .ts source files (not our code). skipLibCheck doesn't cover those
    // because they're .ts not .d.ts. We rely on editor + CI typecheck for our
    // own code; this just keeps the build from choking on a third-party type.
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    // Optional peer deps that wagmi connectors pull in but never use in the browser.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
      'pino-pretty': false,
    };
    config.externals = config.externals || [];
    config.externals.push('pino-pretty', 'encoding');
    return config;
  },
};

module.exports = nextConfig;
