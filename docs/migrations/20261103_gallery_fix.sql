-- =====================================================================
-- HỌ NGOẠI — SỬA MODULE THƯ VIỆN ẢNH (GALLERY)
-- Chạy 1 lần trong Supabase > SQL Editor. Chạy lại nhiều lần không lỗi.
-- Không xoá dữ liệu. Bảo đảm:
--   • Bảng public.gallery_items tồn tại, ai cũng XEM được.
--   • Bucket 'gallery' tồn tại và ở chế độ PUBLIC (để hiển thị ảnh bằng URL).
--   • Chỉ ADMIN (đang hoạt động) mới được THÊM / SỬA / XOÁ ảnh.
-- =====================================================================

-- ---------- 1. BẢNG ----------
CREATE TABLE IF NOT EXISTS public.gallery_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  event_date date,
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.gallery_items;
CREATE POLICY "Enable read access for all users" ON public.gallery_items
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.gallery_items;
DROP POLICY IF EXISTS "Enable update for admin and owner" ON public.gallery_items;
DROP POLICY IF EXISTS "Enable delete for admin and owner" ON public.gallery_items;
DROP POLICY IF EXISTS "Admins can insert gallery" ON public.gallery_items;
DROP POLICY IF EXISTS "Admins can update gallery" ON public.gallery_items;
DROP POLICY IF EXISTS "Admins can delete gallery" ON public.gallery_items;

CREATE POLICY "Admins can insert gallery" ON public.gallery_items
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update gallery" ON public.gallery_items
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete gallery" ON public.gallery_items
  FOR DELETE TO authenticated USING (public.is_admin());

-- ---------- 2. STORAGE BUCKET ----------
-- DO UPDATE để sửa cả trường hợp bucket đã tồn tại nhưng bị đặt private.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gallery', 'gallery', true, 10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ---------- 3. STORAGE POLICIES ----------
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Gallery public access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Admin and owner can update" ON storage.objects;
DROP POLICY IF EXISTS "Admin and owner can delete" ON storage.objects;
DROP POLICY IF EXISTS "Gallery authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Gallery admin and owner update" ON storage.objects;
DROP POLICY IF EXISTS "Gallery admin and owner delete" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete images" ON storage.objects;

CREATE POLICY "Gallery public access" ON storage.objects
  FOR SELECT USING (bucket_id = 'gallery');

CREATE POLICY "Admins can upload images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('avatars', 'gallery') AND public.is_admin());

CREATE POLICY "Admins can update images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id IN ('avatars', 'gallery') AND public.is_admin());

CREATE POLICY "Admins can delete images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('avatars', 'gallery') AND public.is_admin());

-- ---------- 4. KIỂM TRA ----------
-- Kết quả mong đợi: cột public = true và file_size_limit = 10485760.
SELECT id, public, file_size_limit FROM storage.buckets WHERE id = 'gallery';
