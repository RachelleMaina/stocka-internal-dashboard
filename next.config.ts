/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",                   // What the browser calls
        destination: "http://192.168.213.16:3001/api/v1/:path*", // Your real backend
      },
    ];
  },
};

export default nextConfig;
