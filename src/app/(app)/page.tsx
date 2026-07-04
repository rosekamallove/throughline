"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Check,
  Clock,
  Image as ImageIcon,
  Kanban,
  LayoutGrid,
  Lightbulb,
  PenLine,
  Video as VideoIcon,
} from "lucide-react";
import { useState } from "react";

import { VideoBoard } from "@/components/video/video-board";
import { VideoCard } from "@/components/video/video-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBoardPrefs } from "@/lib/board-prefs";
import { FILTERS, type FilterKey } from "@/lib/stages";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

const FILTER_ICONS: Record<FilterKey, React.ComponentType<{ className?: string }>> = {
  recent: Clock,
  ideation: Lightbulb,
  packaging: ImageIcon,
  scripting: PenLine,
  production: VideoIcon,
  scheduled: Calendar,
  published: Check,
  all: LayoutGrid,
};

export default function DashboardPage() {
  const trpc = useTRPC();
  const [filter, setFilter] = useState<FilterKey>("recent");
  const [prefs, setPrefs] = useBoardPrefs();
  const { data: videos, isPending } = useQuery(trpc.video.list.queryOptions());

  const visible = (() => {
    if (!videos) return [];
    if (filter === "recent") {
      return [...videos].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }
    if (filter === "all") return videos;
    return videos.filter((v) => v.stage === filter);
  })();

  const isBoard = prefs.view === "board";

  return (
    <div className="flex h-full flex-col gap-5 px-6 pb-4 pt-5">
      <div className="flex flex-wrap items-center gap-3">
        {!isBoard && (
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterKey)}>
            <TabsList className="h-auto flex-wrap">
              {FILTERS.map((f) => {
                const Icon = FILTER_ICONS[f.key];
                return (
                  <TabsTrigger key={f.key} value={f.key} className="gap-1.5">
                    <Icon className="size-3.5" />
                    {f.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        )}

        <div className="ml-auto flex items-center rounded-lg border p-0.5">
          <button
            aria-label="Grid view"
            onClick={() => setPrefs({ view: "grid" })}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              !isBoard ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            aria-label="Board view"
            onClick={() => setPrefs({ view: "board" })}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              isBoard ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Kanban className="size-4" />
          </button>
        </div>
      </div>

      {isPending ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-x-7 gap-y-9">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i}>
              <Skeleton className="aspect-video rounded-thumb" />
              <Skeleton className="mt-3 h-3 w-1/4" />
              <Skeleton className="mt-2 h-4 w-4/5" />
            </div>
          ))}
        </div>
      ) : isBoard ? (
        <VideoBoard videos={videos ?? []} />
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-24 text-center">
          <p className="text-lg font-medium">Nothing here yet</p>
          <p className="text-sm text-muted-foreground">
            {filter === "recent" || filter === "all"
              ? "Create your first video to get started."
              : "No videos in this stage."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-x-7 gap-y-9 pb-12">
          {visible.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
