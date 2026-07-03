"use client";

import { Bell, Menu, Play, Search } from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "@/components/shell/theme-toggle";
import { CreateVideoDialog } from "@/components/video/create-video-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopBar({
  onSignOut,
  userInitial = "R",
}: {
  onSignOut?: () => void;
  userInitial?: string;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line-soft px-4">
      <Button variant="ghost" size="icon" className="rounded-full text-sub" aria-label="Menu">
        <Menu className="size-5" />
      </Button>

      <Link href="/" className="flex items-center gap-1.5 pl-1">
        <span className="flex size-7 items-center justify-center rounded-lg bg-yt-red">
          <Play className="size-3.5 fill-white text-white" />
        </span>
        <span className="text-lg font-bold tracking-tight">Throughline</span>
      </Link>

      {/* Centered pill search — decorative in v1 */}
      <div className="mx-auto hidden w-full max-w-xl items-center md:flex">
        <div className="flex h-10 flex-1 items-center gap-3 rounded-l-full border border-search-border bg-search-bg px-4">
          <input
            placeholder="Search your videos"
            className="w-full bg-transparent text-sm outline-none placeholder:text-sub2"
          />
        </div>
        <div className="flex h-10 items-center rounded-r-full border border-l-0 border-search-border bg-hover px-5">
          <Search className="size-4 text-sub" />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1 md:ml-0">
        <CreateVideoDialog />
        <Button variant="ghost" size="icon" className="relative rounded-full text-sub" aria-label="Notifications">
          <Bell className="size-5" />
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-yt-red font-mono text-[9px] font-bold text-white">
            3
          </span>
        </Button>
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Account"
              className="ml-1 flex size-8 items-center justify-center rounded-full bg-[linear-gradient(140deg,#FF0000,#F5A623)] text-sm font-bold text-white"
            >
              {userInitial}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onSignOut}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
