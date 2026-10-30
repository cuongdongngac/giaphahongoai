const siteName = process.env.SITE_NAME || "Gia Phả OS";

const config = {
  siteName,
  // Tên ngắn dưới biểu tượng khi cài lên điện thoại (≤ 12 ký tự cho đẹp)
  shortName: process.env.SITE_SHORT_NAME || (siteName.length > 12 ? "Gia phả" : siteName),
  exampleEmail: process.env.EXAMPLE_EMAIL || "",
  examplePassword: process.env.EXAMPLE_PASSWORD || "",
  demoDomain: process.env.DEMO_DOMAIN || "giapha-os.homielab.com",
};

export default config;
