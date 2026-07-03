"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

import { PacingBar, type TimedBeat } from "@/components/script/pacing-bar";
import { Checkbox } from "@/components/ui/checkbox";
import { BEAT_META } from "@/lib/beats";
import type { BrollItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CoachPanel({
  beats,
  activeBeat,
  onSelectBeat,
  onSetBroll,
}: {
  beats: TimedBeat[];
  activeBeat: TimedBeat | null;
  onSelectBeat: (id: string) => void;
  onSetBroll: (beatId: string, broll: BrollItem[]) => void;
}) {
  const [newShot, setNewShot] = useState("");
  const total = beats.reduce((a, b) => a + b.sec, 0) || 1;
  const meta = activeBeat ? BEAT_META[activeBeat.kind] : null;

  function addShot() {
    if (!activeBeat || !newShot.trim()) return;
    onSetBroll(activeBeat.id, [
      ...activeBeat.broll,
      { id: crypto.randomUUID(), text: newShot.trim(), done: false },
    ]);
    setNewShot("");
  }

  return (
    <aside className="flex w-[318px] shrink-0 flex-col gap-6 overflow-y-auto border-l border-border p-5">
      <section>
        <p className="mono-label mb-3">Pacing</p>
        <PacingBar beats={beats} activeId={activeBeat?.id ?? null} onSelect={onSelectBeat} />
        {activeBeat && (
          <p className="mt-2 text-[13px] text-muted-foreground">
            <span className={cn("font-medium", meta?.text)}>{activeBeat.label}</span>{" "}
            <span className="font-mono">
              · {Math.round((activeBeat.sec / total) * 100)}% of runtime
            </span>
          </p>
        )}
      </section>

      {activeBeat && meta && (
        <section className="rounded-xl border border-border bg-card p-4">
          <p className={cn("mono-label mb-2", meta.text)}>Coach · {meta.label}</p>
          <p className="text-sm font-semibold">
            What a great {meta.label.toLowerCase()} does
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">
            {activeBeat.guide ?? meta.guide}
          </p>
        </section>
      )}

      {activeBeat && (
        <section>
          <p className="mono-label mb-2">B-roll &amp; shots</p>
          <ul className="flex flex-col gap-1">
            {activeBeat.broll.map((shot) => (
              <li key={shot.id} className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-accent">
                <Checkbox
                  checked={shot.done}
                  onCheckedChange={(checked) =>
                    onSetBroll(
                      activeBeat.id,
                      activeBeat.broll.map((s) =>
                        s.id === shot.id ? { ...s, done: checked === true } : s,
                      ),
                    )
                  }
                />
                <span
                  className={cn(
                    "flex-1 text-[13px]",
                    shot.done && "text-muted-foreground line-through",
                  )}
                >
                  {shot.text}
                </span>
                <button
                  aria-label="Remove shot"
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() =>
                    onSetBroll(
                      activeBeat.id,
                      activeBeat.broll.filter((s) => s.id !== shot.id),
                    )
                  }
                >
                  <X className="size-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-center gap-2 px-2">
            <Plus className="size-3.5 text-muted-foreground" />
            <input
              value={newShot}
              onChange={(e) => setNewShot(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addShot()}
              placeholder="Add a shot…"
              className="w-full bg-transparent py-1 text-[13px] outline-none placeholder:text-muted-foreground"
            />
          </div>
        </section>
      )}
    </aside>
  );
}
