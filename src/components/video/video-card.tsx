"use client";

import { MoreVertical } from "lucide-react";
import Link from "next/link";

import { ThumbnailPackaging } from "@/components/video/thumbnail-packaging";
import { formatCompact, timeAgo } from "@/lib/format";
import { formatDuration } from "@/lib/runtime";
import { STAGE_META } from "@/lib/stages";
import { cn } from "@/lib/utils";
import type { Video } from "@/trpc/types";

function metaLine(video: Video): string {
  if (video.stage === "published" && video.views != null) {
    return `${formatCompact(video.views)} views · ${timeAgo(video.publishedAt ?? video.createdAt)}`;
  }
  if (video.stage === "idea") {
    return `Idea · ${timeAgo(video.createdAt)}`;
  }
  const next = video.nextAction ? ` · next: ${video.nextAction}` : "";
  return `${STAGE_META[video.stage].label}${next}`;
}

export function VideoCard({
  video,
  viewerMode = false,
  userInitial = "R",
  channelName = "Rose Kamal",
}: {
  video: Video;
  /** Render exactly as a viewer would see it in-feed (FeedPreview). */
  viewerMode?: boolean;
  userInitial?: string;
  channelName?: string;
}) {
  const stage = STAGE_META[video.stage];
  const inProduction = !viewerMode && video.stage !== "published" && video.stage !== "idea";
  const published = video.stage === "published";

  const card = (
    <article className="group">
      <div className="relative">
        <ThumbnailPackaging
          color={video.packagingColor}
          lines={video.thumbText}
          imageUrl={video.thumbImageUrl}
          alt={video.title}
        />
        {!viewerMode && inProduction && (
          <>
            <span
              className={cn(
                "absolute left-2 top-2 rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[1.5px] backdrop-blur",
                stage.badge,
              )}
            >
              {stage.label}
            </span>
            <div className="absolute inset-x-0 bottom-0 h-[3px] overflow-hidden rounded-b-thumb bg-black/40">
              <div
                className={cn("h-full", stage.dot)}
                style={{ width: `${video.progress}%` }}
              />
            </div>
          </>
        )}
        {(published || viewerMode) && video.durationSec != null && (
          <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 font-mono text-[11px] font-medium text-white">
            {formatDuration(video.durationSec)}
          </span>
        )}
      </div>

      <div className="mt-3 flex gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(140deg,#FF0000,#F5A623)] text-sm font-bold text-white">
          {userInitial}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-medium leading-5">{video.title}</h3>
          <p className="mt-1 text-[13px] leading-tight text-sub">{channelName}</p>
          <p className="text-[13px] leading-tight text-sub">
            {viewerMode
              ? `${video.views != null ? `${formatCompact(video.views)} views · ` : ""}${timeAgo(video.publishedAt ?? video.createdAt)}`
              : metaLine(video)}
          </p>
        </div>
        {!viewerMode && (
          <MoreVertical className="mt-1 size-4 shrink-0 text-sub opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </div>
    </article>
  );

  if (viewerMode) return card;

  return (
    <Link href={`/video/${video.id}`} className="block">
      {card}
    </Link>
  );
}
