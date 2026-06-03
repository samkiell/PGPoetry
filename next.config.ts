import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mongoose", "@auth/mongodb-adapter"],
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
  async redirects() {
    return [
      // Legacy single-poem URL shape from the v1 site
      { source: "/poem/:slug", destination: "/poems/:slug", permanent: true },
    ];
  },
};

export default nextConfig;

