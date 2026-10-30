import type { MetadataRoute } from "next";
import config from "./config";

// Web App Manifest: cho phép "cài" ứng dụng lên màn hình chính điện thoại (PWA).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: config.siteName,
    short_name: config.shortName,
    description: "Gia phả dòng họ: sơ đồ phả hệ, thành viên, danh xưng, ngày giỗ.",
    lang: "vi",
    dir: "ltr",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#fafaf9",
    theme_color: "#fafaf9",
    categories: ["lifestyle", "social"],
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Thành viên", url: "/dashboard/members", icons: [{ src: "/android-chrome-192x192.png", sizes: "192x192" }] },
      { name: "Tìm danh xưng", url: "/dashboard/kinship", icons: [{ src: "/android-chrome-192x192.png", sizes: "192x192" }] },
      { name: "Ngày giỗ & sự kiện", url: "/dashboard/events", icons: [{ src: "/android-chrome-192x192.png", sizes: "192x192" }] },
    ],
  };
}
