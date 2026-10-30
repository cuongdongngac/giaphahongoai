-- =====================================================================
-- Đồng bộ database HỌ NGOẠI với mã nguồn holegiapha
-- Chạy 1 lần trong Supabase > SQL Editor (chạy lại nhiều lần cũng không lỗi)
-- KHÔNG xoá / thay đổi dữ liệu hiện có (persons, tomb_info... giữ nguyên)
-- =====================================================================

-- 1. Bảng thư viện ảnh
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
CREATE POLICY "Enable insert for authenticated users only" ON public.gallery_items
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Enable update for admin and owner" ON public.gallery_items;
CREATE POLICY "Enable update for admin and owner" ON public.gallery_items
  FOR UPDATE USING (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "Enable delete for admin and owner" ON public.gallery_items;
CREATE POLICY "Enable delete for admin and owner" ON public.gallery_items
  FOR DELETE USING (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- 2. Storage bucket cho ảnh
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Gallery public access" ON storage.objects;
CREATE POLICY "Gallery public access" ON storage.objects
  FOR SELECT USING (bucket_id = 'gallery');

DROP POLICY IF EXISTS "Gallery authenticated upload" ON storage.objects;
CREATE POLICY "Gallery authenticated upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'gallery' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Gallery admin and owner update" ON storage.objects;
CREATE POLICY "Gallery admin and owner update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'gallery' AND (auth.uid() = owner OR EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')));

DROP POLICY IF EXISTS "Gallery admin and owner delete" ON storage.objects;
CREATE POLICY "Gallery admin and owner delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'gallery' AND (auth.uid() = owner OR EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')));

-- 3. Cho phép xem gia phả không cần đăng nhập (giống holegiapha)
--    Thông tin riêng tư (person_details_private) vẫn được bảo mật.
--    Nếu muốn BẮT BUỘC đăng nhập mới xem được, hãy bỏ phần này.
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.persons;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.persons;
CREATE POLICY "Enable read access for all users" ON public.persons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.relationships;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.relationships;
CREATE POLICY "Enable read access for all users" ON public.relationships FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.custom_events;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.custom_events;
CREATE POLICY "Enable read access for all users" ON public.custom_events FOR SELECT USING (true);

-- 4. Kiểm tra các hàm mà code cần (kết quả phải đủ 7 dòng)
SELECT proname FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('is_admin','is_editor','admin_create_user','delete_user',
                  'get_admin_users','set_user_active_status','set_user_role')
ORDER BY proname;
