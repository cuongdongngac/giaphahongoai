"use client";

import { useMemberListView } from "@/context/MemberListContext";
import { Download, X } from "lucide-react";
import { useEffect } from "react";

export default function AvatarPreviewModal() {
  const { avatarPreview, setAvatarPreview } = useMemberListView();

  useEffect(() => {
    if (!avatarPreview) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAvatarPreview(null);
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [avatarPreview, setAvatarPreview]);

  if (!avatarPreview) return null;

  return (
    <div
      className="fixed inset-0 z-[120] bg-stone-950/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Ảnh đại diện của ${avatarPreview.alt}`}
      onClick={(event) => {
        if (event.target === event.currentTarget) setAvatarPreview(null);
      }}
    >
      <button
        type="button"
        onClick={() => setAvatarPreview(null)}
        className="absolute top-4 right-4 inline-flex items-center justify-center rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
        aria-label="Đóng"
      >
        <X className="size-5" />
      </button>

      <a
        href={avatarPreview.src}
        target="_blank"
        rel="noopener"
        download
        className="absolute top-4 right-20 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-3 text-sm font-medium text-white hover:bg-white/20"
      >
        <Download className="size-4" />
        Tải ảnh
      </a>

      <div className="max-w-5xl max-h-full flex flex-col items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarPreview.src}
          alt={avatarPreview.alt}
          className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl"
        />
        <p className="text-sm sm:text-base font-medium text-white/90 text-center">
          {avatarPreview.alt}
        </p>
      </div>
    </div>
  );
}
