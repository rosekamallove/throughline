"use client";

import { BEAT_META } from "@/lib/beats";
import type { Beat } from "@/trpc/types";

export interface TimedBeat extends Beat {
  words: number;
  sec: number;
}

export function PacingBar({
  beats,
  activeId,
  onSelect,
}: {
  beats: TimedBeat[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const total = beats.reduce((a, b) => a + b.sec, 0) || 1;

  return (
    <div className="flex h-2.5 w-full gap-px overflow-hidden rounded-full">
      {beats.map((b) => (
        <button
          key={b.id}
          title={b.label}
          onClick={() => onSelect(b.id)}
          className={`${BEAT_META[b.kind].dot} min-w-1 transition-opacity`}
          style={{
            width: `${(b.sec / total) * 100}%`,
            opacity: b.id === activeId ? 1 : 0.38,
          }}
        />
      ))}
    </div>
  );
}
