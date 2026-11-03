import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.BUILD_STANDALONE === "1" ? "standalone" : undefined,
  // Trang hướng dẫn (VitePress build ra public/help): /help -> trang đầu hướng dẫn.
  async rewrites() {
    return [{ source: "/help", destination: "/help/index.html" }];
  },
  experimental: {
    // Cho phép tải ảnh qua Server Action (mặc định giới hạn 1MB là quá nhỏ).
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    // Cho phép hiển thị ảnh lưu trên Supabase Storage.
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
    ],
  },
  async headers() {
    return [
      {
        // Service worker luôn lấy bản mới nhất để cập nhật ứng dụng ngay khi deploy.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
