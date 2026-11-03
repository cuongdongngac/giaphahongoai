import { defineConfig } from "vitepress";

// Trang hướng dẫn Gia Phả Họ Ngoại — build ra trang tĩnh, Next.js phục vụ tại /help (cùng repo, cùng lần deploy).
//   npm run help:dev    -> xem thử khi viết bài (http://localhost:5173/help/)
//   npm run help:build  -> xuất ra public/help (tự chạy trong `npm run build`)
// Thêm bài: tạo file .md trong thư mục tương ứng rồi thêm một dòng vào `sidebar` bên dưới.
export default defineConfig({
  lang: "vi-VN",
  title: "Hướng dẫn Gia Phả Họ Ngoại",
  description: "Hướng dẫn xem và cập nhật gia phả họ Ngoại — viết đơn giản, có ảnh từng bước",
  base: "/help/",
  outDir: "../public/help",
  cleanUrls: false, // Next.js phục vụ file tĩnh nguyên tên (.html)
  srcExclude: ["README.md"],
  lastUpdated: true,
  head: [
    ["link", { rel: "icon", href: "/help/icons/icon-192.png" }],
    ["meta", { name: "theme-color", content: "#b45309" }],
  ],

  themeConfig: {
    siteTitle: "Hướng dẫn Gia Phả",
    logo: "/icons/icon-192.png",

    nav: [
      { text: "Bắt đầu", link: "/bat-dau/gioi-thieu" },
      { text: "Xem gia phả", link: "/xem/trang-chu" },
      { text: "Cập nhật", link: "/cap-nhat/them-nguoi" },
      { text: "Hỏi đáp", link: "/hoi-dap" },
    ],

    sidebar: [
      {
        text: "1. Bắt đầu",
        items: [
          { text: "Trang gia phả dùng để làm gì", link: "/bat-dau/gioi-thieu" },
          { text: "Cài lên điện thoại", link: "/bat-dau/cai-ung-dung" },
          { text: "Thao tác cơ bản, chữ to hơn", link: "/bat-dau/thao-tac-co-ban" },
          { text: "Đăng nhập", link: "/bat-dau/dang-nhap" },
        ],
      },
      {
        text: "2. Xem gia phả",
        items: [
          { text: "Trang chủ", link: "/xem/trang-chu" },
          { text: "Tìm một người trong họ", link: "/xem/danh-sach" },
          { text: "Xem thông tin một người", link: "/xem/xem-mot-nguoi" },
          { text: "Xem sơ đồ cây", link: "/xem/so-do-cay" },
          { text: "Hỏi cách xưng hô", link: "/xem/tra-danh-xung" },
          { text: "Ngày giỗ, sinh nhật", link: "/xem/ngay-gio" },
          { text: "Thư viện ảnh", link: "/xem/thu-vien-anh" },
          { text: "Thống kê dòng họ", link: "/xem/thong-ke" },
        ],
      },
      {
        text: "3. Cập nhật gia phả",
        items: [
          { text: "Thêm một người mới", link: "/cap-nhat/them-nguoi" },
          { text: "Sửa thông tin", link: "/cap-nhat/sua-thong-tin" },
          { text: "Thêm vợ/chồng, con cái", link: "/cap-nhat/them-quan-he" },
          { text: "Thêm sự kiện của họ", link: "/cap-nhat/them-su-kien" },
          { text: "Xoá người nhập nhầm", link: "/cap-nhat/xoa" },
        ],
      },
      {
        text: "4. Dành cho người quản trị",
        collapsed: true,
        items: [
          { text: "Duyệt và cấp quyền tài khoản", link: "/quan-tri/duyet-tai-khoan" },
          { text: "Sao lưu dữ liệu", link: "/quan-tri/sao-luu" },
          { text: "Tự tính đời, thứ tự sinh", link: "/quan-tri/thu-tu-gia-pha" },
        ],
      },
      { text: "Hỏi đáp", link: "/hoi-dap" },
    ],

    search: {
      provider: "local",
      options: {
        translations: {
          button: { buttonText: "Tìm hướng dẫn…", buttonAriaLabel: "Tìm hướng dẫn" },
          modal: {
            noResultsText: "Không tìm thấy kết quả phù hợp",
            resetButtonTitle: "Xóa tìm kiếm",
            footer: { selectText: "chọn", navigateText: "di chuyển", closeText: "đóng" },
          },
        },
      },
    },

    outline: { level: [2, 3], label: "Trong bài này" },
    docFooter: { prev: "Bài trước", next: "Bài tiếp theo" },
    lastUpdated: { text: "Cập nhật lần cuối" },
    darkModeSwitchLabel: "Giao diện",
    sidebarMenuLabel: "Mục lục",
    returnToTopLabel: "Lên đầu trang",
    footer: {
      message: "Gia Phả Họ Ngoại — hướng dẫn sử dụng",
      copyright: "Ảnh minh hoạ dùng dữ liệu mẫu (dòng họ Vạn hư cấu), không phải người thật.",
    },
  },
});
