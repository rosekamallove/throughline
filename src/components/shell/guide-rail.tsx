"use client";

import { BarChart3, Clapperboard, Home, PlaySquare, SquarePlay } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const itemClass =
  "flex h-10 items-center gap-5 rounded-lg px-3 text-sm hover:bg-hover";

export function GuideRail() {
  const pathname = usePathname();

  return (
    <nav className="hidden w-[220px] shrink-0 flex-col gap-0.5 overflow-y-auto p-3 lg:flex">
      <Link href="/" className={cn(itemClass, pathname === "/" && "bg-hover font-medium")}>
        <Home className="size-5" /> Home
      </Link>
      <Link href="/" className={cn(itemClass, "text-sub")}>
        <Clapperboard className="size-5" /> Your videos
      </Link>
      <div className={cn(itemClass, "cursor-default text-sub2")}>
        <BarChart3 className="size-5" /> Analytics
      </div>

      <div className="my-3 border-t border-line-soft" />

      <Link
        href="/connect"
        className={cn(itemClass, pathname === "/connect" && "bg-hover font-medium")}
      >
        <span className="relative">
          <SquarePlay className="size-5" />
          <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-saved-dot" />
        </span>
        Connect YouTube
      </Link>

      <div className="mt-auto px-3 pb-2 pt-6">
        <p className="mono-label flex items-center gap-2">
          <PlaySquare className="size-3.5" /> Throughline
        </p>
      </div>
    </nav>
  );
}
