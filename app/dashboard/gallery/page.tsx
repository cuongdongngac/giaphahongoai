import MemberDetailModal from "@/components/modal/MemberDetailModal";
import GalleryClient from "@/components/gallery/GalleryClient";
import { MemberListProvider } from "@/context/MemberListContext";
import { GalleryPersonRef } from "@/types";
import { getProfile, getSupabase, getUser } from "@/utils/supabase/queries";

export const metadata = {
  title: "Phòng trưng bày | Gia Phả OS",
  description: "Lưu giữ và chia sẻ hình ảnh, kỷ niệm dòng họ",
};

export default async function GalleryPage() {
  const supabase = await getSupabase();
  const [user, profile] = await Promise.all([getUser(), getProfile()]);

  const { data: items } = await supabase
    .from("gallery_items")
    .select("*")
    .order("event_date", { ascending: false, nullsFirst: false });

  // Gắn tên những người xuất hiện trong ảnh (dùng cho lightbox + tìm kiếm)
  const personIds = Array.from(
    new Set((items ?? []).flatMap((i) => i.person_ids ?? [])),
  );
  let persons: GalleryPersonRef[] = [];
  if (personIds.length > 0) {
    const { data } = await supabase
      .from("persons")
      .select("id, full_name")
      .in("id", personIds);
    persons = (data ?? []) as GalleryPersonRef[];
  }

  const isAdmin = profile?.role === "admin";
  const canUpload = isAdmin || profile?.role === "editor";

  return (
    <main className="flex-1 flex flex-col p-4 sm:p-8 max-w-7xl mx-auto w-full">
      <MemberListProvider>
        <GalleryClient
          initialItems={items || []}
          persons={persons}
          currentUserId={user?.id ?? null}
          isAdmin={isAdmin}
          canUpload={canUpload}
          isLoggedIn={!!user}
        />
        <MemberDetailModal />
      </MemberListProvider>
    </main>
  );
}
