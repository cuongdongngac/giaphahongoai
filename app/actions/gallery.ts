"use server";

import { getProfile, getSupabase } from "@/utils/supabase/queries";
import { GALLERY_BUCKET } from "@/utils/gallery";
import { revalidatePath } from "next/cache";

const MAX_BYTES = 25 * 1024 * 1024; // 25MB, khớp file_size_limit của bucket
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const EXT_BY_TYPE: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
};

export type GalleryActionResult =
    | { ok: true; id?: string }
    | { ok: false; error: string };

/** Admin hoặc editor (đang hoạt động) mới được ghi vào thư viện ảnh. */
async function requireGalleryEditor(): Promise<{ ok: true } | { ok: false; error: string }> {
    const profile = await getProfile();
    if (!profile) {
        return { ok: false, error: "Bạn cần đăng nhập để thực hiện thao tác này." };
    }
    if (profile.role !== "admin" && profile.role !== "editor") {
        return { ok: false, error: "Chỉ quản trị viên hoặc biên tập viên mới được thêm, sửa hoặc xoá hình ảnh." };
    }
    return { ok: true };
}

/** Lấy đường dẫn file trong bucket 'gallery' từ URL công khai. */
function storagePathFromUrl(url: string): string | null {
    const marker = `/storage/v1/object/public/${GALLERY_BUCKET}/`;
    const index = url.indexOf(marker);
    return index >= 0 ? decodeURIComponent(url.slice(index + marker.length)) : null;
}

function parsePersonIds(raw: FormDataEntryValue | null): string[] {
    if (typeof raw !== "string" || !raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
    } catch {
        return [];
    }
}

function parseOptionalInt(raw: FormDataEntryValue | null): number | null {
    if (typeof raw !== "string" || !raw.trim()) return null;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
}

/** Thêm mới hoặc cập nhật một ảnh trong thư viện. */
export async function saveGalleryItemAction(formData: FormData): Promise<GalleryActionResult> {
    const guard = await requireGalleryEditor();
    if (!guard.ok) return guard;

    const id = (formData.get("id") as string) || null;
    const title = ((formData.get("title") as string) || "").trim();
    const description = ((formData.get("description") as string) || "").trim() || null;
    const album = ((formData.get("album") as string) || "").trim() || null;
    const eventDate = (formData.get("event_date") as string) || null;
    const personIds = parsePersonIds(formData.get("person_ids"));
    const isPublic = formData.get("is_public") !== "false";
    const width = parseOptionalInt(formData.get("width"));
    const height = parseOptionalInt(formData.get("height"));
    const file = formData.get("file") as File | null;

    if (!title) return { ok: false, error: "Vui lòng nhập tiêu đề." };
    if (!id && (!file || file.size === 0)) return { ok: false, error: "Vui lòng chọn ảnh." };

    const supabase = await getSupabase();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Bạn cần đăng nhập để thực hiện thao tác này." };

    // Bản ghi hiện có (khi sửa) — dùng để kiểm quyền và xoá ảnh cũ.
    let existing: { created_by: string | null; image_url: string; storage_path: string | null } | null = null;
    if (id) {
        const { data } = await supabase
            .from("gallery_items")
            .select("created_by, image_url, storage_path")
            .eq("id", id)
            .single();
        existing = data;

        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        const isAdmin = profile?.role === "admin";
        if (existing && !isAdmin && existing.created_by !== user.id) {
            return { ok: false, error: "Bạn chỉ có thể sửa ảnh do chính mình đăng." };
        }
    }

    let uploadedPath: string | null = null;
    let imageUrl: string | null = null;

    if (file && file.size > 0) {
        if (!ALLOWED_TYPES.includes(file.type)) {
            return { ok: false, error: "Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF." };
        }
        if (file.size > MAX_BYTES) {
            return { ok: false, error: "Ảnh vượt quá 25MB. Vui lòng chọn ảnh nhỏ hơn." };
        }

        const ext = EXT_BY_TYPE[file.type] ?? "jpg";
        const now = new Date();
        const folder = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
        uploadedPath = `${folder}/${crypto.randomUUID()}.${ext}`;

        const bytes = await file.arrayBuffer();
        const { error: uploadError } = await supabase.storage.from(GALLERY_BUCKET).upload(uploadedPath, bytes, {
            contentType: file.type,
            cacheControl: "31536000",
            upsert: false,
        });
        if (uploadError) {
            return { ok: false, error: `Không tải được ảnh lên Supabase: ${uploadError.message}` };
        }
        imageUrl = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(uploadedPath).data.publicUrl;
    }

    const common = {
        title,
        description,
        album,
        event_date: eventDate,
        person_ids: personIds,
        is_public: isPublic,
    };

    if (id) {
        const patch: Record<string, unknown> = { ...common };
        if (imageUrl && uploadedPath) {
            patch.image_url = imageUrl;
            patch.storage_path = uploadedPath;
            if (width != null) patch.width = width;
            if (height != null) patch.height = height;
        }

        const { error } = await supabase.from("gallery_items").update(patch).eq("id", id);
        if (error) {
            if (uploadedPath) await supabase.storage.from(GALLERY_BUCKET).remove([uploadedPath]);
            return { ok: false, error: `Không lưu được thông tin ảnh: ${error.message}` };
        }

        // Xoá ảnh cũ nếu vừa thay ảnh mới.
        if (uploadedPath) {
            const oldPath = existing?.storage_path ?? (existing?.image_url ? storagePathFromUrl(existing.image_url) : null);
            if (oldPath && oldPath !== uploadedPath) {
                await supabase.storage.from(GALLERY_BUCKET).remove([oldPath]);
            }
        }
    } else {
        const { error } = await supabase.from("gallery_items").insert({
            ...common,
            image_url: imageUrl,
            storage_path: uploadedPath,
            width,
            height,
            created_by: user.id,
        });
        if (error) {
            if (uploadedPath) await supabase.storage.from(GALLERY_BUCKET).remove([uploadedPath]);
            return { ok: false, error: `Không lưu được thông tin ảnh: ${error.message}` };
        }
    }

    revalidatePath("/dashboard/gallery");
    return { ok: true };
}

/** Xoá một ảnh khỏi thư viện (và xoá file trong Storage). */
export async function deleteGalleryItemAction(id: string): Promise<GalleryActionResult> {
    const guard = await requireGalleryEditor();
    if (!guard.ok) return guard;

    const supabase = await getSupabase();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Bạn cần đăng nhập để thực hiện thao tác này." };

    const { data: existing } = await supabase
        .from("gallery_items")
        .select("created_by, image_url, storage_path")
        .eq("id", id)
        .single();

    if (!existing) return { ok: false, error: "Không tìm thấy ảnh cần xoá. Có thể ảnh đã bị xoá trước đó." };

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    const isAdmin = profile?.role === "admin";
    if (!isAdmin && existing.created_by !== user.id) {
        return { ok: false, error: "Bạn chỉ có thể xoá ảnh do chính mình đăng." };
    }

    // .select() trả về các dòng đã xoá. Nếu bị RLS chặn, Supabase KHÔNG báo lỗi mà trả về rỗng,
    // nên phải kiểm tra để tránh trường hợp "xoá thành công" nhưng thực tế không xoá được gì.
    const { data: deleted, error } = await supabase.from("gallery_items").delete().eq("id", id).select("id");
    if (error) return { ok: false, error: `Không xoá được ảnh: ${error.message}` };
    if (!deleted || deleted.length === 0) {
        return { ok: false, error: "Không xoá được ảnh do phân quyền trên Supabase (RLS)." };
    }

    const path = existing.storage_path ?? (existing.image_url ? storagePathFromUrl(existing.image_url) : null);
    if (path) await supabase.storage.from(GALLERY_BUCKET).remove([path]);

    revalidatePath("/dashboard/gallery");
    return { ok: true };
}
