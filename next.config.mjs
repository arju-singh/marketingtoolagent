/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The crawler runs server-side only.
  serverExternalPackages: ["cheerio"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
