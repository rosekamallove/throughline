"use client";

import { PenLine } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

/** Hover-revealed shortcut straight to a video's script editor. Lives inside
 *  clickable cards (a <Link> in the grid, an onClick div on the board), so it
 *  stops propagation and navigates itself instead of triggering the card. The
 *  pointerdown stop keeps the board's drag sensor from claiming the press. */
export function OpenScriptButton({ videoId, className }: { videoId: string; className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="Open script"
      title="Open script"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(`/video/${videoId}/script`);
      }}
      className={cn(
        "absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-[11px] font-medium text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100 hover:bg-black/85 focus-visible:opacity-100 active:scale-95",
        className,
      )}
    >
      <PenLine className="size-3" /> Script
    </button>
  );
}
