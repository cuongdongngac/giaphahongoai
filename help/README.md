# Trang hướng dẫn (VitePress)

Viết cho người cao tuổi: câu ngắn, mỗi bước một ý, tên nút **in đậm** đúng như trên màn hình, ảnh có khung đỏ chỉ chỗ bấm. CSS trong `.vitepress/theme/custom.css` để chữ to (19px).

- Viết bài: thêm file `.md` vào `bat-dau/`, `xem/`, `cap-nhat/`, `quan-tri/`, rồi thêm một dòng vào `sidebar` trong `.vitepress/config.mts`.
- Xem thử khi viết: `npm run help:dev` → http://localhost:5173/help/
- Build: `npm run help:build` (xuất ra `public/help`, đã nằm trong `npm run build` nên Vercel tự build).
- Trong ứng dụng: menu tài khoản có mục **Hướng dẫn sử dụng** (`components/HelpLink.tsx`); dùng `<HelpLink slug="xem/ngay-gio" />` để gắn link tới một bài.
- Trang hướng dẫn công khai (không cần đăng nhập): **không** đưa ảnh có tên, ngày sinh người thật trong họ vào đây.

## Ảnh minh hoạ

Ảnh nằm trong `help/public/images/<nhóm>/`, nhóm trùng tên thư mục bài.

Tên ảnh: `<tên-bài>-<số 2 chữ số>-<mô-tả-không-dấu>[-mobile].png`. Có `-mobile` = chụp khung điện thoại (390px, hiển thị tối đa 340px); không có = chụp máy tính (1280px).

Chèn vào bài:

```md
![Mô tả](/images/xem/ngay-gio-01-danh-sach-mobile.png)
<p class="img-caption">Hình 1: Chú thích</p>
```

Hai ảnh điện thoại cạnh nhau: bọc trong `<div class="hai-anh">` (xem `xem/tra-danh-xung.md`).

### Ảnh hiện có

Toàn bộ ảnh (02/11/2026) được Claude chụp tự động từ chính mã nguồn ứng dụng, chạy với **dữ liệu mẫu `docs/seed.sql`** (dòng họ Vạn hư cấu) thay cho Supabase thật, nên không lộ dữ liệu họ Ngoại. Khung đỏ và số tròn đỏ được vẽ thêm lúc chụp.

Khi giao diện thay đổi nhiều, nên chụp lại cùng cách (mock Supabase + Playwright) để ảnh khớp với màn hình mới.
