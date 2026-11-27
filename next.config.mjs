/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep Next.js file tracing scoped to this app when parent folders contain other lockfiles.
  outputFileTracingRoot: process.cwd(),
  serverExternalPackages: ["mongoose"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.clerk.dev" },
      { protocol: "https", hostname: "uploadthing.com" },
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
};

export default nextConfig;
