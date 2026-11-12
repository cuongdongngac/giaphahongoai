import type { User } from "@supabase/supabase-js";

/**
 * Cửa sổ thời gian (ms) để nhận diện một tài khoản vừa được Supabase
 * tạo ra bởi chính lần đăng nhập Google này.
 *
 * Supabase tự động liên kết (link) tài khoản Google vào auth user đã có
 * khi email trùng khớp, nên tài khoản "có sẵn" luôn có created_at cũ hơn
 * ngưỡng này. Tài khoản hoàn toàn mới sẽ có created_at ≈ thời điểm login.
 */
export const OAUTH_NEW_ACCOUNT_WINDOW_MS = 10 * 60 * 1000;

/** Mã lỗi OAuth trả về trang /login qua query param `?error=...`. */
export const OAUTH_ERROR_CODES = {
  NOT_REGISTERED: "oauth_not_registered",
  FAILED: "oauth_failed",
  CANCELLED: "oauth_cancelled",
  NO_EMAIL: "oauth_no_email",
} as const;

export type OAuthErrorCode =
  (typeof OAUTH_ERROR_CODES)[keyof typeof OAUTH_ERROR_CODES];

/** Thông điệp tiếng Việt hiển thị trên trang đăng nhập cho từng mã lỗi. */
export const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  [OAUTH_ERROR_CODES.NOT_REGISTERED]:
    "Email Google này chưa được đăng ký. Vui lòng liên hệ quản trị viên để tạo tài khoản trước, sau đó đăng nhập lại.",
  [OAUTH_ERROR_CODES.FAILED]:
    "Đăng nhập bằng Google thất bại. Vui lòng thử lại hoặc đăng nhập bằng email và mật khẩu.",
  [OAUTH_ERROR_CODES.CANCELLED]:
    "Bạn đã hủy đăng nhập bằng Google. Vui lòng thử lại nếu muốn tiếp tục.",
  [OAUTH_ERROR_CODES.NO_EMAIL]:
    "Không lấy được email từ tài khoản Google. Vui lòng thử tài khoản khác.",
};

/**
 * Kiểm tra user đã từng đăng ký bằng email/mật khẩu hay chưa
 * (kể cả trường hợp admin tạo hộ qua `admin_create_user`).
 */
export function hasEmailIdentity(user: User): boolean {
  return (user.identities ?? []).some(
    (identity) => identity.provider === "email",
  );
}

/**
 * Nhận diện "đăng ký mới trá hình": auth user vừa được tạo ra bởi chính
 * lần đăng nhập Google này (created_at rất gần hiện tại) và chưa từng có
 * identity email/mật khẩu nào. Những trường hợp này phải bị chặn và
 * đăng xuất ngay để không cho đăng ký qua Google.
 */
export function isNewOAuthSignup(
  user: User,
  now: Date = new Date(),
): boolean {
  const createdAt = new Date(user.created_at).getTime();
  if (Number.isNaN(createdAt)) return false;
  const isJustCreated =
    now.getTime() - createdAt < OAUTH_NEW_ACCOUNT_WINDOW_MS;
  return isJustCreated && !hasEmailIdentity(user);
}
