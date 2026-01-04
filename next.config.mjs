/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: `${process.env.SUPABASE_PROJECT_REF}.supabase.co`,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};
export default nextConfig;
