# Triển khai Gia Phả Họ Ngoại

Mã nguồn chép từ holegiapha. Supabase của họ ngoại: https://gotsditixqmjemsfoyuv.supabase.co

## 1. Cập nhật database (1 lần)
Supabase Dashboard > SQL Editor > dán và chạy file
`docs/migrations/20261030_hongngoai_sync_from_holegiapha.sql`.
Dòng kết quả cuối phải liệt kê đủ 7 hàm (is_admin, is_editor, admin_create_user,
delete_user, get_admin_users, set_user_active_status, set_user_role).

KHÔNG chạy `docs/seed.sql` (xoá sạch dữ liệu) hay `docs/danger/*`.

## 2. Chạy thử trên máy
    npm install
    npm run dev
Mở http://localhost:3000 (file .env.local đã có sẵn cấu hình họ ngoại).

## 3. Đưa lên GitHub
Tạo repo mới (ví dụ `hongngoai`) trên github.com, rồi trong thư mục này:
    git init
    git add .
    git commit -m "Khởi tạo Gia Phả Họ Ngoại"
    git branch -M main
    git remote add origin https://github.com/cuongdongngac/hongngoai.git
    git push -u origin main
(.env.local và supabase.txt đã nằm trong .gitignore, không bị đẩy lên.)

## 4. Deploy Vercel
vercel.com > Add New > Project > chọn repo `hongngoai` > Environment Variables:
- SITE_NAME = Gia Phả Họ Ngoại
- SITE_SHORT_NAME = Họ Ngoại
- NEXT_PUBLIC_SUPABASE_URL = https://gotsditixqmjemsfoyuv.supabase.co
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = (dòng 2 trong supabase.txt)
Nhấn Deploy.

## 5. Cấu hình đăng nhập
Supabase > Authentication > URL Configuration:
- Site URL: https://<ten-du-an>.vercel.app
- Redirect URLs: https://<ten-du-an>.vercel.app/**
