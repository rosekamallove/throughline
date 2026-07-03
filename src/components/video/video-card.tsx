"use client";

import Link from "next/link";

import { ThumbnailPackaging } from "@/components/video/thumbnail-packaging";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
    return timeAgo(video.createdAt);
  }
  return video.nextAction ? `next: ${video.nextAction}` : timeAgo(video.createdAt);
}

export function VideoCard({
  video,
  viewerMode = false,
  userInitial = "R",
  channelName = "Rose Kamal",
}: {
  video: Video;
  /** Render as a viewer would see it in a feed (packaging preview). */
  viewerMode?: boolean;
  userInitial?: string;
  channelName?: string;
}) {
  const stage = STAGE_META[video.stage];
  const inProduction = video.stage !== "published" && video.stage !== "idea";

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
          <div className="absolute inset-x-0 bottom-0 h-[3px] overflow-hidden rounded-b-thumb bg-black/30">
            <div className={cn("h-full", stage.dot)} style={{ width: `${video.progress}%` }} />
          </div>
        )}
        {(video.stage === "published" || viewerMode) && video.durationSec != null && (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 font-mono text-[11px] font-medium text-white">
            {formatDuration(video.durationSec)}
          </span>
        )}
      </div>

      {viewerMode ? (
        <div className="mt-3 flex gap-3">
          <Avatar className="mt-0.5 size-9">
            <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-sm font-medium leading-5">{video.title}</h3>
            <p className="mt-1 text-[13px] text-muted-foreground">{channelName}</p>
            <p className="text-[13px] text-muted-foreground">
              {video.views != null ? `${formatCompact(video.views)} views · ` : ""}
              {timeAgo(video.publishedAt ?? video.createdAt)}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-3 min-w-0">
          <p className="mono-label flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", stage.dot)} />
            {stage.label}
          </p>
          <h3 className="mt-1 line-clamp-2 text-sm font-medium leading-5 group-hover:underline">
            {video.title}
          </h3>
          <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{metaLine(video)}</p>
        </div>
      )}
    </article>
  );

  if (viewerMode) return card;

  return (
    <Link href={`/video/${video.id}`} className="block">
      {card}
    </Link>
  );
}
