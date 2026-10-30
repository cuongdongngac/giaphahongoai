-- =====================================================================
-- HỌ NGOẠI: Ai cũng XEM được, chỉ ADMIN được THÊM / SỬA / XOÁ
-- Chạy SAU file 20261030_hongngoai_sync_from_holegiapha.sql
-- Không xoá dữ liệu. Chạy lại nhiều lần không lỗi.
-- =====================================================================

-- ---------- PERSONS ----------
DROP POLICY IF EXISTS "Admins and Editors can insert persons" ON public.persons;
DROP POLICY IF EXISTS "Admins and Editors can update persons" ON public.persons;
DROP POLICY IF EXISTS "Admins and Editors can delete persons" ON public.persons;
DROP POLICY IF EXISTS "Admins can insert persons" ON public.persons;
DROP POLICY IF EXISTS "Admins can update persons" ON public.persons;
DROP POLICY IF EXISTS "Admins can delete persons" ON public.persons;
DROP POLICY IF EXISTS "Admins can manage persons" ON public.persons;
CREATE POLICY "Admins can insert persons" ON public.persons FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update persons" ON public.persons FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete persons" ON public.persons FOR DELETE TO authenticated USING (public.is_admin());

-- ---------- RELATIONSHIPS ----------
DROP POLICY IF EXISTS "Admins and Editors can insert relationships" ON public.relationships;
DROP POLICY IF EXISTS "Admins and Editors can update relationships" ON public.relationships;
DROP POLICY IF EXISTS "Admins and Editors can delete relationships" ON public.relationships;
DROP POLICY IF EXISTS "Admins can insert relationships" ON public.relationships;
DROP POLICY IF EXISTS "Admins can update relationships" ON public.relationships;
DROP POLICY IF EXISTS "Admins can delete relationships" ON public.relationships;
DROP POLICY IF EXISTS "Admins can manage relationships" ON public.relationships;
CREATE POLICY "Admins can insert relationships" ON public.relationships FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update relationships" ON public.relationships FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete relationships" ON public.relationships FOR DELETE TO authenticated USING (public.is_admin());

-- ---------- CUSTOM_EVENTS ----------
DROP POLICY IF EXISTS "Authenticated users can insert custom events" ON public.custom_events;
DROP POLICY IF EXISTS "Users can update own custom events" ON public.custom_events;
DROP POLICY IF EXISTS "Users can delete own custom events" ON public.custom_events;
DROP POLICY IF EXISTS "Admins can insert custom events" ON public.custom_events;
DROP POLICY IF EXISTS "Admins can update custom events" ON public.custom_events;
DROP POLICY IF EXISTS "Admins can delete custom events" ON public.custom_events;
CREATE POLICY "Admins can insert custom events" ON public.custom_events FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update custom events" ON public.custom_events FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete custom events" ON public.custom_events FOR DELETE TO authenticated USING (public.is_admin());

-- ---------- GALLERY_ITEMS ----------
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.gallery_items;
DROP POLICY IF EXISTS "Enable update for admin and owner" ON public.gallery_items;
DROP POLICY IF EXISTS "Enable delete for admin and owner" ON public.gallery_items;
DROP POLICY IF EXISTS "Admins can insert gallery" ON public.gallery_items;
DROP POLICY IF EXISTS "Admins can update gallery" ON public.gallery_items;
DROP POLICY IF EXISTS "Admins can delete gallery" ON public.gallery_items;
CREATE POLICY "Admins can insert gallery" ON public.gallery_items FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update gallery" ON public.gallery_items FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete gallery" ON public.gallery_items FOR DELETE TO authenticated USING (public.is_admin());

-- ---------- STORAGE: avatars + gallery (xem công khai, chỉ admin tải lên/sửa/xoá) ----------
DROP POLICY IF EXISTS "Users can upload avatars." ON storage.objects;
DROP POLICY IF EXISTS "Users can update avatars." ON storage.objects;
DROP POLICY IF EXISTS "Users can delete avatars." ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Admin and owner can update" ON storage.objects;
DROP POLICY IF EXISTS "Admin and owner can delete" ON storage.objects;
DROP POLICY IF EXISTS "Gallery authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Gallery admin and owner update" ON storage.objects;
DROP POLICY IF EXISTS "Gallery admin and owner delete" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete images" ON storage.objects;
CREATE POLICY "Admins can upload images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('avatars','gallery') AND public.is_admin());
CREATE POLICY "Admins can update images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('avatars','gallery') AND public.is_admin());
CREATE POLICY "Admins can delete images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('avatars','gallery') AND public.is_admin());

-- ---------- KIỂM TRA ----------
-- Mọi dòng có cmd = INSERT/UPDATE/DELETE/ALL phải chứa is_admin() và KHÔNG có is_editor / created_by
SELECT schemaname, tablename, policyname, cmd,
       coalesce(qual, '') || ' | ' || coalesce(with_check, '') AS dieu_kien
FROM pg_policies
WHERE (schemaname = 'public' AND tablename IN
        ('persons','relationships','custom_events','gallery_items','person_details_private','profiles'))
   OR (schemaname = 'storage' AND tablename = 'objects')
ORDER BY schemaname, tablename, cmd;
