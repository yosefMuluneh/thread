/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  typescript:{
    ignoreBuildErrors: true
  },
    experimental: {
      serverActions: {
        serverActions: true
      },
      serverComponentsExternalPackages: ["mongoose"],
    },
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "img.clerk.com",
        },
        {
          protocol: "https",
          hostname: "images.clerk.dev",
        },
        {
          protocol: "https",
          hostname: "uploadthing.com",
        },
        {
          protocol: "https",
          hostname: "placehold.co",
        },
      ],
    },
  };
  
  
  
export default nextConfig;
