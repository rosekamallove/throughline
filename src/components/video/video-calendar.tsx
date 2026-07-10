"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { OpenScriptButton } from "@/components/video/open-script-button";
import { ThumbnailPackaging } from "@/components/video/thumbnail-packaging";
import { STAGE_META } from "@/lib/stages";
import { cn } from "@/lib/utils";
import type { Video } from "@/trpc/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/** Where a video sits on the calendar: published on its actual publish date,
 *  everything else on its proposed release date (null = not on the calendar). */
function eventDate(v: Video): Date | null {
  if (v.stage === "published" && v.publishedAt) return new Date(v.publishedAt);
  if (v.scheduledAt) return new Date(v.scheduledAt);
  return null;
}

export function VideoCalendar({ videos }: { videos: Video[] }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const today = new Date();
  const shown = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = shown.getFullYear();
  const month = shown.getMonth();

  // 6 full weeks starting on the Sunday on/before the 1st — covers any month.
  const gridStart = new Date(year, month, 1 - new Date(year, month, 1).getDay());
  const days = Array.from({ length: 42 }, (_, i) =>
    new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i),
  );

  const byDay = new Map<string, Video[]>();
  for (const v of videos) {
    const d = eventDate(v);
    if (!d) continue;
    const key = dayKey(d);
    const bucket = byDay.get(key);
    if (bucket) bucket.push(v);
    else byDay.set(key, [v]);
  }

  const monthCount = videos.filter((v) => {
    const d = eventDate(v);
    return d && d.getFullYear() === year && d.getMonth() === month;
  }).length;
  const todayKey = dayKey(today);
  const monthLabel = shown.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-lg font-semibold">{monthLabel}</h2>
        <div className="flex items-center gap-1">
          <button
            aria-label="Previous month"
            onClick={() => setMonthOffset((o) => o - 1)}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => setMonthOffset(0)}
            className="rounded-md px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Today
          </button>
          <button
            aria-label="Next month"
            onClick={() => setMonthOffset((o) => o + 1)}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
        <span className="ml-auto font-mono text-[12px] text-muted-foreground">
          {monthCount} this month
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border-l border-t">
        <div className="grid grid-cols-7">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="mono-label sticky top-0 z-10 border-r border-b bg-muted/40 px-2 py-1.5 backdrop-blur"
            >
              {w}
            </div>
          ))}
          {days.map((d) => {
            const key = dayKey(d);
            const inMonth = d.getMonth() === month;
            const items = byDay.get(key) ?? [];
            return (
              <div
                key={key}
                className={cn(
                  "flex min-h-[124px] flex-col gap-1.5 border-r border-b p-1.5",
                  !inMonth && "bg-muted/20",
                )}
              >
                <span
                  className={cn(
                    "text-[12px] font-medium",
                    !inMonth && "text-muted-foreground/60",
                    key === todayKey &&
                      "flex size-5 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground",
                  )}
                >
                  {d.getDate()}
                </span>
                {items.map((v) => (
                  <CalendarEvent key={v.id} video={v} />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CalendarEvent({ video }: { video: Video }) {
  const stage = STAGE_META[video.stage];
  return (
    <Link href={`/video/${video.id}`} className="group block">
      <div className="relative">
        <ThumbnailPackaging
          color={video.packagingColor}
          lines={video.thumbText}
          imageUrl={video.thumbImageUrl}
          alt={video.title}
          className="rounded-md"
        />
        <OpenScriptButton videoId={video.id} className="right-1 top-1 px-1.5 py-0.5 text-[10px]" />
      </div>
      <p className="mt-1 flex items-center gap-1 text-[11px] font-medium leading-snug">
        <span className={cn("size-1.5 shrink-0 rounded-full", stage.dot)} />
        <span className="line-clamp-1 group-hover:underline">{video.title}</span>
      </p>
    </Link>
  );
}
