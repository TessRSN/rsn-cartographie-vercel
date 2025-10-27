import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["isomorphic-dompurify", "jsdom"],
  eslint: { ignoreDuringBuilds: true },
  assetPrefix: "/rsn/cartographie", // keeps <link>/<script> URLs correct
  env: {
    NEXT_PUBLIC_APP_VERSION: require("./package.json").version,
  },
};

export default nextConfig;
