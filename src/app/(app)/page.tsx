"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { VideoCard } from "@/components/video/video-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FILTERS, type FilterKey } from "@/lib/stages";
import { useTRPC } from "@/trpc/client";

export default function DashboardPage() {
  const trpc = useTRPC();
  const [filter, setFilter] = useState<FilterKey>("all");
  const { data: videos, isPending } = useQuery(trpc.video.list.queryOptions());

  const counts = Object.fromEntries(
    FILTERS.map((f) => [
      f.key,
      f.key === "all"
        ? (videos?.length ?? 0)
        : (videos?.filter((v) => v.stage === f.key).length ?? 0),
    ]),
  ) as Record<FilterKey, number>;

  const visible = videos?.filter((v) => filter === "all" || v.stage === filter) ?? [];

  return (
    <div className="flex flex-col gap-6 px-6 pb-16 pt-5">
      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterKey)}>
        <TabsList className="h-auto flex-wrap">
          {FILTERS.map((f) => (
            <TabsTrigger key={f.key} value={f.key} className="gap-1.5">
              {f.label}
              <span className="font-mono text-[11px] text-muted-foreground">
                {counts[f.key] ?? 0}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

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
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-24 text-center">
          <p className="text-lg font-medium">Nothing here yet</p>
          <p className="text-sm text-muted-foreground">
            {filter === "all" ? "Create your first video to get started." : "No videos in this stage."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-x-7 gap-y-9">
          {visible.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
