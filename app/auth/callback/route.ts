import { OAUTH_ERROR_CODES, isNewOAuthSignup } from "@/utils/supabase/oauth";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Callback sau khi đăng nhập bằng Google (Supabase OAuth).
 *
 * Chỉ cho phép những email ĐÃ CÓ tài khoản từ trước:
 * - Nếu Supabase vừa tạo auth user mới cho lần login này → coi là đăng ký
 *   mới → xóa tài khoản vừa tạo (nếu DB đã chạy migration), đăng xuất và
 *   đưa về /login kèm thông báo.
 * - Nếu là tài khoản có sẵn (Supabase tự link Google identity vào user cũ)
 *   → cho vào dashboard.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  const forwardedHost = request.headers.get("x-forwarded-host");
  const origin = forwardedHost
    ? `${request.headers.get("x-forwarded-proto") ?? "https"}://${forwardedHost}`
    : new URL(request.url).origin;

  const loginWithError = (errorCode: string) =>
    NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorCode)}`,
    );

  // Người dùng bấm hủy trên màn hình chọn tài khoản Google.
  if (searchParams.get("error")) {
    return loginWithError(OAUTH_ERROR_CODES.CANCELLED);
  }

  if (!code) {
    return loginWithError(OAUTH_ERROR_CODES.FAILED);
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  ) {
    return NextResponse.redirect(`${origin}/missing-db-config`);
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    console.error("OAuth code exchange failed:", exchangeError.message);
    return loginWithError(OAUTH_ERROR_CODES.FAILED);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return loginWithError(OAUTH_ERROR_CODES.FAILED);
  }

  if (!user.email) {
    await supabase.auth.signOut();
    return loginWithError(OAUTH_ERROR_CODES.NO_EMAIL);
  }

  // Chặn đăng ký mới qua Google: chỉ email đã có tài khoản mới được vào.
  if (isNewOAuthSignup(user)) {
    // Dọn tài khoản vừa bị tạo nhầm để không rác danh sách quản trị.
    // Hàm này có sau khi chạy migration; DB cũ chưa có thì bỏ qua lỗi.
    const { error: cleanupError } = await supabase.rpc(
      "delete_own_new_account",
    );
    if (cleanupError) {
      console.warn(
        "delete_own_new_account RPC unavailable:",
        cleanupError.message,
      );
    }
    await supabase.auth.signOut();
    return loginWithError(OAUTH_ERROR_CODES.NOT_REGISTERED);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
