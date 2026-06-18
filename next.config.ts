import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Это заставит Vercel пропустить проверку линтера при деплое
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Это пропустит ошибки типов TypeScript при сборке
    ignoreBuildErrors: true,
  },
};

export default nextConfig;