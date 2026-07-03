"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { FilterChips } from "@/components/video/filter-chips";
import { VideoCard } from "@/components/video/video-card";
import { Skeleton } from "@/components/ui/skeleton";
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
    <div className="flex flex-col gap-5 px-6 pb-12 pt-4">
      <FilterChips value={filter} onChange={setFilter} counts={counts} />

      {isPending ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-x-4 gap-y-7">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i}>
              <Skeleton className="aspect-video rounded-thumb" />
              <div className="mt-3 flex gap-3">
                <Skeleton className="size-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-3 w-2/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-24 text-center">
          <p className="text-lg font-medium">Nothing here yet</p>
          <p className="text-sm text-sub">
            {filter === "all" ? "Create your first video to get started." : "No videos in this stage."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-x-4 gap-y-7">
          {visible.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
