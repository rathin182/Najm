import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,

    typescript: {
        ignoreBuildErrors: true,
    },

    experimental: {
        cpus: 1,
    },
};

export default nextConfig;