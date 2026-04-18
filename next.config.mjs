/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.metatft.com" },
    ],
  },
};

export default nextConfig;
