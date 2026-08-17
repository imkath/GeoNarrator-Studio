/** @type {import('next').NextConfig} */
const nextConfig = {
  // The app has no server: every page runs in the browser and talks straight
  // to Mapbox. A static export is what Cloudflare Pages serves best.
  output: 'export',
  images: { unoptimized: true },
  transpilePackages: ['react-map-gl', 'mapbox-gl'],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};

export default nextConfig;
