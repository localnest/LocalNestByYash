import type { NextConfig } from 'next';

const isStaticExport = process.env.BUILD_TARGET === 'export';

const nextConfig: NextConfig = {
  output: isStaticExport ? 'export' : undefined,
  images: {
    unoptimized: isStaticExport,
  },
};

export default nextConfig;
