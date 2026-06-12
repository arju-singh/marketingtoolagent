/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The crawler + firebase-admin run server-side only.
  serverExternalPackages: ["firebase-admin", "cheerio"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
