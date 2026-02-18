import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Vercel Blob URLs (e.g. https://xxx.public.blob.vercel-storage.com/...)
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
