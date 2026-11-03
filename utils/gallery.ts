export const GALLERY_BUCKET = "gallery";
/** Ảnh gốc tối đa 25MB (sẽ được nén lại trước khi tải lên). */
export const GALLERY_MAX_INPUT_BYTES = 25 * 1024 * 1024;

const MAX_DIMENSION = 2000; // cạnh dài nhất sau khi nén
const JPEG_QUALITY = 0.85;

export interface PreparedImage {
    blob: Blob;
    width: number;
    height: number;
    ext: string;
    contentType: string;
}

/**
 * Thu nhỏ & nén ảnh ngay trên trình duyệt trước khi tải lên.
 * Ảnh điện thoại 5–10MB thường còn ~400–800KB, tải nhanh hơn và tiết kiệm dung lượng Supabase.
 * GIF giữ nguyên (để không mất ảnh động).
 */
export async function prepareImage(file: File): Promise<PreparedImage> {
    if (file.type === "image/gif") {
        const dims = await readDimensions(file).catch(() => ({ width: 0, height: 0 }));
        return { blob: file, ...dims, ext: "gif", contentType: "image/gif" };
    }

    const bitmap = await loadBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Trình duyệt không hỗ trợ xử lý ảnh.");
    // Nền trắng để ảnh PNG trong suốt không bị đen khi chuyển sang JPEG
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap as CanvasImageSource, 0, 0, width, height);
    if ("close" in bitmap && typeof bitmap.close === "function") bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob) throw new Error("Không nén được ảnh.");

    // Nếu ảnh gốc đã nhỏ hơn bản nén (ảnh đã tối ưu sẵn) thì giữ ảnh gốc
    if (scale === 1 && file.size <= blob.size && file.type === "image/jpeg") {
        return { blob: file, width, height, ext: "jpg", contentType: "image/jpeg" };
    }
    return { blob, width, height, ext: "jpg", contentType: "image/jpeg" };
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
    if (typeof createImageBitmap === "function") {
        try {
            // imageOrientation: tôn trọng hướng xoay EXIF của ảnh chụp điện thoại
            return await createImageBitmap(file, { imageOrientation: "from-image" });
        } catch {
            /* rơi xuống cách dự phòng */
        }
    }
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error(`Không đọc được ảnh "${file.name}".`));
        };
        img.src = url;
    });
}

async function readDimensions(file: File) {
    const bmp = await loadBitmap(file);
    const dims = { width: bmp.width, height: bmp.height };
    if ("close" in bmp && typeof bmp.close === "function") bmp.close();
    return dims;
}

/** "2026-03-08" -> "08/03/2026" (không lệch múi giờ) */
export function formatGalleryDate(date: string | null | undefined) {
    if (!date) return "";
    const [y, m, d] = date.slice(0, 10).split("-");
    return d && m && y ? `${d}/${m}/${y}` : date;
}

export function fileNameToTitle(name: string) {
    return name
        .replace(/\.[^.]+$/, "")
        .replace(/[_-]+/g, " ")
        .trim();
}
