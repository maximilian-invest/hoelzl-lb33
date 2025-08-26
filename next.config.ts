import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: true,
  images: { unoptimized: true }, // okay, falls du irgendwann <Image> nutzt
};

export default nextConfig;
