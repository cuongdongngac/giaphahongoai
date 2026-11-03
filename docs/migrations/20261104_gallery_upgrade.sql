-- =====================================================================
-- HỌ NGOẠI — NÂNG CẤP MODULE THƯ VIỆN ẢNH (theo chuẩn giapha-os)
-- Chạy 1 lần trong Supabase > SQL Editor. Chạy lại nhiều lần không lỗi.
-- Bổ sung: album, gắn người trong ảnh, ảnh nội bộ, lưu đường dẫn file,
--          kích thước ảnh.
-- Quyền: ADMIN + EDITOR (đang hoạt động) được thêm ảnh;
--        sửa/xoá: admin, hoặc chính người đã đăng.
-- =====================================================================

-- ---------- 1. BỔ SUNG CỘT ----------
ALTER TABLE public.gallery_items
  ADD COLUMN IF NOT EXISTS storage_path text,
  ADD COLUMN IF NOT EXISTS width        integer,
  ADD COLUMN IF NOT EXISTS height       integer,
  ADD COLUMN IF NOT EXISTS album        text,
  ADD COLUMN IF NOT EXISTS person_ids   uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_public    boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at   timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS gallery_items_event_date_idx ON public.gallery_items (event_date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS gallery_items_album_idx      ON public.gallery_items (album);
CREATE INDEX IF NOT EXISTS gallery_items_person_ids_idx ON public.gallery_items USING gin (person_ids);

-- Tự cập nhật updated_at (dùng lại hàm chung của hệ thống)
DROP TRIGGER IF EXISTS gallery_items_updated_at ON public.gallery_items;
CREATE TRIGGER gallery_items_updated_at
  BEFORE UPDATE ON public.gallery_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------- 2. HÀM KIỂM QUYỀN ----------
-- SECURITY DEFINER để không bị đệ quy RLS trên bảng profiles.
CREATE OR REPLACE FUNCTION public.is_active_member()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_active);
$$;

CREATE OR REPLACE FUNCTION public.can_edit_gallery()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_active AND role IN ('admin', 'editor')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_gallery_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_active AND role = 'admin'
  );
$$;

-- ---------- 3. RLS CHO BẢNG gallery_items ----------
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

-- Xoá các policy cũ (mọi biến thể tên đã từng dùng)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.gallery_items;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.gallery_items;
DROP POLICY IF EXISTS "Enable update for admin and owner" ON public.gallery_items;
DROP POLICY IF EXISTS "Enable delete for admin and owner" ON public.gallery_items;
DROP POLICY IF EXISTS "Admins can insert gallery" ON public.gallery_items;
DROP POLICY IF EXISTS "Admins can update gallery" ON public.gallery_items;
DROP POLICY IF EXISTS "Admins can delete gallery" ON public.gallery_items;
DROP POLICY IF EXISTS "gallery_select" ON public.gallery_items;
DROP POLICY IF EXISTS "gallery_insert" ON public.gallery_items;
DROP POLICY IF EXISTS "gallery_update" ON public.gallery_items;
DROP POLICY IF EXISTS "gallery_delete" ON public.gallery_items;

-- Ảnh công khai: ai cũng xem. Ảnh nội bộ: chỉ tài khoản đang hoạt động.
CREATE POLICY "gallery_select" ON public.gallery_items
  FOR SELECT USING (is_public OR public.is_active_member());

CREATE POLICY "gallery_insert" ON public.gallery_items
  FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_gallery() AND created_by = auth.uid());

CREATE POLICY "gallery_update" ON public.gallery_items
  FOR UPDATE TO authenticated
  USING (public.is_gallery_admin() OR (created_by = auth.uid() AND public.can_edit_gallery()))
  WITH CHECK (public.is_gallery_admin() OR (created_by = auth.uid() AND public.can_edit_gallery()));

CREATE POLICY "gallery_delete" ON public.gallery_items
  FOR DELETE TO authenticated
  USING (public.is_gallery_admin() OR (created_by = auth.uid() AND public.can_edit_gallery()));

-- ---------- 4. BUCKET 'gallery' (public để hiển thị ảnh bằng URL) ----------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('gallery', 'gallery', true, 10485760,
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ---------- 5. STORAGE POLICIES ----------
-- Xoá policy cũ liên quan tới bucket 'gallery'
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Admin and owner can update" ON storage.objects;
DROP POLICY IF EXISTS "Admin and owner can delete" ON storage.objects;
DROP POLICY IF EXISTS "Gallery public access" ON storage.objects;
DROP POLICY IF EXISTS "Gallery authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Gallery admin and owner update" ON storage.objects;
DROP POLICY IF EXISTS "Gallery admin and owner delete" ON storage.objects;
DROP POLICY IF EXISTS "gallery_storage_read" ON storage.objects;
DROP POLICY IF EXISTS "gallery_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "gallery_storage_update" ON storage.objects;
DROP POLICY IF EXISTS "gallery_storage_delete" ON storage.objects;

CREATE POLICY "gallery_storage_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'gallery');

CREATE POLICY "gallery_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gallery' AND public.can_edit_gallery());

CREATE POLICY "gallery_storage_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'gallery' AND (owner = auth.uid() OR public.is_gallery_admin()));

CREATE POLICY "gallery_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'gallery' AND (owner = auth.uid() OR public.is_gallery_admin()));

-- ---------- 6. KIỂM TRA ----------
-- Kết quả mong đợi: public = true, file_size_limit = 10485760.
SELECT id, public, file_size_limit FROM storage.buckets WHERE id = 'gallery';
