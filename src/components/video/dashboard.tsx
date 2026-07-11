"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  CalendarDays,
  Check,
  Clock,
  EyeOff,
  Image as ImageIcon,
  Kanban,
  LayoutGrid,
  Lightbulb,
  PenLine,
  Video as VideoIcon,
} from "lucide-react";
import { useState } from "react";

import { VideoBoard } from "@/components/video/video-board";
import { VideoCalendar } from "@/components/video/video-calendar";
import { VideoCard } from "@/components/video/video-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBoardPrefs, type BoardSort } from "@/lib/board-prefs";
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
  unlisted: EyeOff,
  all: LayoutGrid,
};

export function Dashboard() {
  const trpc = useTRPC();
  const [filter, setFilter] = useState<FilterKey>("recent");
  const [prefs, setPrefs] = useBoardPrefs();
  const { data: videos, isPending } = useQuery(trpc.video.list.queryOptions());

  // Non-public YouTube imports live only under the Unlisted chip.
  const listed = (videos ?? []).filter((v) => v.privacy === "public");

  const visible = (() => {
    if (!videos) return [];
    if (filter === "unlisted") return videos.filter((v) => v.privacy !== "public");
    if (filter === "recent") {
      // Published videos rank by publish date; drafts by last edit — sync
      // runs touch updatedAt on every import, so it can't be the key.
      return [...listed].sort(
        (a, b) =>
          (b.publishedAt ?? b.updatedAt).getTime() -
          (a.publishedAt ?? a.updatedAt).getTime(),
      );
    }
    if (filter === "all") return listed;
    return listed.filter((v) => v.stage === filter);
  })();

  const view = prefs.view;

  return (
    <div className="flex h-full flex-col gap-5 px-6 pb-4 pt-5">
      <div className="flex flex-wrap items-center gap-3">
        {view === "grid" && (
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

        {view === "board" && (
          <Select
            value={prefs.sort}
            onValueChange={(v) => setPrefs({ sort: v as BoardSort })}
          >
            <SelectTrigger size="sm" className="gap-1.5">
              <span className="text-muted-foreground">Sort</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">Custom order</SelectItem>
              <SelectItem value="created">Creation date</SelectItem>
              <SelectItem value="published">Publish date</SelectItem>
            </SelectContent>
          </Select>
        )}

        <div className="ml-auto flex items-center rounded-lg border p-0.5">
          {(
            [
              { key: "grid", label: "Grid view", Icon: LayoutGrid },
              { key: "board", label: "Board view", Icon: Kanban },
              { key: "calendar", label: "Calendar view", Icon: CalendarDays },
            ] as const
          ).map(({ key, label, Icon }) => (
            <button
              key={key}
              aria-label={label}
              onClick={() => setPrefs({ view: key })}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                view === key
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
            </button>
          ))}
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
      ) : view === "board" ? (
        <VideoBoard videos={listed} />
      ) : view === "calendar" ? (
        <VideoCalendar videos={listed} />
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
