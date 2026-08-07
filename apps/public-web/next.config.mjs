/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: [
    '@carchief/api-client', '@carchief/domain', '@carchief/pwa', '@carchief/theme',
    '@carchief/ui', '@carchief/validation', '@carchief/vehicle-detail', '@carchief/vehicle-search',
  ],
};

export default nextConfig;
