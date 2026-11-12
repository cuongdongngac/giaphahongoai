-- ========================================================
-- GOOGLE LOGIN: CHẶN ĐĂNG KÝ MỚI QUA OAUTH
-- ========================================================
-- Chức năng "Đăng nhập với Google" chỉ cho phép email ĐÃ CÓ tài khoản.
-- Khi Supabase tạo nhầm auth user mới cho một email lạ, route
-- /auth/callback sẽ gọi hàm dưới đây để xóa tài khoản vừa tạo
-- (kèm profile nhờ ON DELETE CASCADE), rồi đăng xuất và báo lỗi.
--
-- Cách chạy: dán toàn bộ file vào Supabase SQL Editor và bấm RUN.

-- 6. Tự xóa tài khoản của chính mình nếu vừa được tạo (chống đăng ký qua Google)
CREATE OR REPLACE FUNCTION public.delete_own_new_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Chỉ xóa đúng tài khoản đang đăng nhập VÀ được tạo trong 10 phút qua,
    -- nên không thể dùng hàm này để xóa tài khoản người khác hay tài khoản cũ.
    DELETE FROM auth.users
    WHERE id = auth.uid()
      AND created_at > NOW() - INTERVAL '10 minutes';
END;
$$;

REVOKE ALL ON FUNCTION public.delete_own_new_account() FROM public;
GRANT EXECUTE ON FUNCTION public.delete_own_new_account() TO authenticated;
