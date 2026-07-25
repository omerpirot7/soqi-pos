import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
  experimental: {
    // Tree-shake barrel imports so dev compiles touch far fewer modules
    optimizePackageImports: ["lucide-react", "recharts", "date-fns"],
  },
};

export default withNextIntl(nextConfig);
