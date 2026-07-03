"use client";

import { MoreHorizontal, Trash2 } from "lucide-react";
import type { Value } from "platejs";
import { useState } from "react";

import { BeatEditor } from "@/components/script/beat-editor";
import type { TimedBeat } from "@/components/script/pacing-bar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BEAT_KINDS, BEAT_META } from "@/lib/beats";
import type { BeatKind } from "@/lib/beats";
import { textToValue } from "@/lib/plate";
import { formatDuration } from "@/lib/runtime";
import { cn } from "@/lib/utils";

export function BeatBlock({
  beat,
  active,
  onActivate,
  onChangeContent,
  onChangeLabel,
  onChangeKind,
  onDelete,
}: {
  beat: TimedBeat;
  active: boolean;
  onActivate: () => void;
  onChangeContent: (payload: { value: Value; text: string }) => void;
  onChangeLabel: (label: string) => void;
  onChangeKind: (kind: BeatKind) => void;
  onDelete: () => void;
}) {
  const meta = BEAT_META[beat.kind];
  const [label, setLabel] = useState(beat.label);
  // Initial value only — the Plate editor owns its state after mount.
  const [initialValue] = useState<Value>(
    () => (beat.content as Value | null) ?? textToValue(beat.text),
  );

  return (
    <section
      onFocusCapture={onActivate}
      onClick={onActivate}
      className={cn(
        "group rounded-r-xl border-l-[3px] py-3 pl-5 pr-3 transition-colors",
        active ? cn("bg-muted", meta.bar) : "border-transparent",
      )}
    >
      <div className="mb-1.5 flex items-center gap-2.5">
        <span
          className={cn(
            "rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[1.5px]",
            meta.tag,
          )}
        >
          {meta.label}
        </span>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() => {
            if (label.trim() && label !== beat.label) onChangeLabel(label.trim());
            else setLabel(beat.label);
          }}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-muted-foreground outline-none focus:text-foreground"
        />
        <span className="whitespace-nowrap font-mono text-[11px] text-muted-foreground">
          {beat.words}w · {formatDuration(beat.sec)}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Beat options"
            className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100 data-[state=open]:opacity-100"
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {BEAT_KINDS.filter((k) => k !== beat.kind).map((kind) => (
              <DropdownMenuItem key={kind} onClick={() => onChangeKind(kind)}>
                <span className={cn("size-2 rounded-full", BEAT_META[kind].dot)} />
                Make {BEAT_META[kind].label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 className="size-4" /> Delete beat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <BeatEditor
        initialValue={initialValue}
        placeholder="Write this beat…"
        onChange={onChangeContent}
      />
    </section>
  );
}
