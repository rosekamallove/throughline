"use client";

import type { Value } from "platejs";
import { useMemo } from "react";

import type { TimedBeat } from "@/components/script/pacing-bar";
import { resolveBeatMeta, type CustomBeatKind } from "@/lib/beats";
import { shotWordOffsets } from "@/lib/plate";
import { formatDuration } from "@/lib/runtime";
import { cn } from "@/lib/utils";

interface ShotTick {
  id: string;
  beatId: string;
  label: string;
  /** seconds from the start of the script */
  at: number;
}

const flashShot = (shotId: string) => {
  const els = Array.from(
    document.querySelectorAll<HTMLElement>(`[data-shot-id="${shotId}"]`),
  );
  els[0]?.scrollIntoView({ behavior: "smooth", block: "center" });
  els.forEach((el) => el.classList.add("shot-mark-hot"));
  setTimeout(() => els.forEach((el) => el.classList.remove("shot-mark-hot")), 1400);
};

/** Horizontal timeline of the script: beats proportional to their spoken
 *  duration, with anchored shots ticked where their words occur. */
export function Timeline({
  beats,
  customKinds,
  activeId,
  totalSec,
  onSelectBeat,
}: {
  beats: TimedBeat[];
  customKinds: CustomBeatKind[];
  activeId: string | null;
  totalSec: number;
  onSelectBeat: (id: string) => void;
}) {
  const total = Math.max(totalSec, 1);

  const shots = useMemo<ShotTick[]>(() => {
    const ticks: ShotTick[] = [];
    let start = 0;
    for (const beat of beats) {
      const offsets = beat.content ? shotWordOffsets(beat.content as Value) : {};
      for (const item of beat.broll) {
        const offset = offsets[item.id];
        if (offset == null) continue;
        ticks.push({
          id: item.id,
          beatId: beat.id,
          label: item.text || item.quote || "Shot",
          at: start + (offset / Math.max(beat.words, 1)) * beat.sec,
        });
      }
      start += beat.sec;
    }
    return ticks;
  }, [beats]);

  const tickStep =
    [15, 30, 60, 120, 300, 600].find((s) => total / s <= 7) ?? 600;
  const rulerTicks: number[] = [];
  for (let t = 0; t <= total - tickStep / 2; t += tickStep) rulerTicks.push(t);

  function jumpBeat(id: string) {
    onSelectBeat(id);
    document
      .querySelector(`[data-beat-id="${id}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (totalSec === 0) {
    return (
      <p className="mt-5 rounded-lg border border-dashed px-3 py-2 text-[12px] text-muted-foreground duration-200 animate-in fade-in">
        The timeline appears once the script has words.
      </p>
    );
  }

  return (
    <div className="mt-5 duration-200 animate-in fade-in slide-in-from-top-1">
      <div className="relative h-4">
        {rulerTicks.map((t) => (
          <span
            key={t}
            className="absolute top-0 -translate-x-px font-mono text-[9px] text-muted-foreground"
            style={{ left: `${(t / total) * 100}%` }}
          >
            {formatDuration(t)}
          </span>
        ))}
      </div>

      <div className="flex h-10 gap-px overflow-hidden rounded-lg">
        {beats.map((beat) => {
          const color = resolveBeatMeta(beat.kind, customKinds).color;
          const active = beat.id === activeId;
          return (
            <button
              key={beat.id}
              title={`${beat.label} · ${formatDuration(beat.sec)}`}
              onClick={() => jumpBeat(beat.id)}
              className={cn(
                "min-w-1.5 overflow-hidden border-t-2 px-1.5 text-left transition-colors",
                !active && "opacity-70 hover:opacity-100",
              )}
              style={{
                width: `${(beat.sec / total) * 100}%`,
                borderColor: color,
                background: `color-mix(in oklab, ${color} ${active ? 26 : 14}%, transparent)`,
              }}
            >
              <span className="block truncate text-[10px] font-medium leading-[1.2] pt-1">
                {beat.label}
              </span>
              <span className="block font-mono text-[9px] text-muted-foreground">
                {formatDuration(beat.sec)}
              </span>
            </button>
          );
        })}
      </div>

      {shots.length > 0 && (
        <div className="relative mt-1.5 h-5">
          <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
          {shots.map((shot) => (
            <button
              key={shot.id}
              title={shot.label}
              aria-label={`Shot: ${shot.label}`}
              onClick={() => flashShot(shot.id)}
              className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] bg-thumb-accent transition-transform hover:scale-125"
              style={{ left: `${(shot.at / total) * 100}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
