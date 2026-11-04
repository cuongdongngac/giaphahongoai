"use client";

import { motion } from "framer-motion";
import { Circle, Images, List, ListTree, Network } from "lucide-react";
import { useMemberListView } from "@/context/MemberListContext";
import Link from "next/link";

export type ViewMode = "list" | "tree" | "mindmap" | "bubble";

export default function ViewToggle() {
  const { view: currentView, setView } = useMemberListView();

  const tabs = [
    {
      id: "list",
      label: "Danh sách",
      icon: <List className="size-6 sm:size-4" />,
    },
    {
      id: "tree",
      label: "Sơ đồ cây",
      icon: <Network className="size-6 sm:size-4" />,
    },
    {
      id: "mindmap",
      label: "Mindmap",
      icon: <ListTree className="size-6 sm:size-4" />,
    },
    {
      id: "bubble",
      label: "Bong bóng",
      icon: <Circle className="size-6 sm:size-4" />,
    },
  ] as const;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 mt-4 mb-2 relative z-10 px-4">
      <div className="flex bg-stone-200/50 p-1.5 rounded-full shadow-inner w-fit border border-stone-200/60 backdrop-blur-sm">
        {tabs.map((tab) => {
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setView(tab.id as ViewMode)}
              className={`relative px-4 sm:px-6 py-1.5 sm:py-2.5 text-sm font-semibold rounded-full transition-colors duration-300 ease-in-out z-10 flex items-center gap-2 ${
                isActive
                  ? "text-stone-900"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white rounded-full shadow-sm border border-stone-200/60 z-[-1]"
                  transition={{ type: "spring", stiffness: 450, damping: 30 }}
                />
              )}
              <span
                className={`transition-colors duration-300 ${isActive ? "text-amber-700" : "text-stone-400"}`}
              >
                {tab.icon}
              </span>
              <span className="hidden sm:block tracking-wide">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <Link
        href="/dashboard/gallery"
        className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-amber-50 px-4 sm:px-5 py-2.5 text-sm font-semibold text-amber-800 shadow-sm transition-colors hover:bg-amber-100 hover:text-amber-900"
      >
        <Images className="size-5 sm:size-4" />
        <span className="tracking-wide">Thư viện ảnh</span>
      </Link>
    </div>
  );
}
