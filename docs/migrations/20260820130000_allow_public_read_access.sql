
-- Cho phép đọc (SELECT) không cần đăng nhập cho các bảng công khai
-- Dữ liệu riêng tư (person_details_private) vẫn được bảo mật

-- Bảng persons
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.persons;
CREATE POLICY "Enable read access for all users" ON public.persons FOR SELECT USING (true);

-- Bảng relationships
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.relationships;
CREATE POLICY "Enable read access for all users" ON public.relationships FOR SELECT USING (true);

-- Bảng custom_events
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.custom_events;
CREATE POLICY "Enable read access for all users" ON public.custom_events FOR SELECT USING (true);
