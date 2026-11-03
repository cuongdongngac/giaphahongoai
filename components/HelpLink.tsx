import { CircleHelp } from "lucide-react";

/**
 * Liên kết tới bài hướng dẫn (VitePress, phục vụ tại /help).
 * slug: đường dẫn bài, ví dụ "xem/thu-vien-anh" -> /help/xem/thu-vien-anh.html; bỏ trống -> trang đầu hướng dẫn.
 * Mở tab mới để không mất dữ liệu đang nhập trên màn hình.
 */
export default function HelpLink({
  slug,
  label = "Hướng dẫn",
  className = "",
}: {
  slug?: string;
  label?: string;
  className?: string;
}) {
  const href = slug ? `/help/${slug.replace(/^\/+|\.html$/g, "")}.html` : "/help/";
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className={`inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-900 hover:underline ${className}`}
    >
      <CircleHelp className="w-4 h-4" />
      {label}
    </a>
  );
}
