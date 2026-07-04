"use client";

import { GitBranch, MoreHorizontal, Trash2 } from "lucide-react";
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
import {
  BEAT_KINDS,
  resolveBeatMeta,
  type BeatKind,
  type CustomBeatKind,
} from "@/lib/beats";
import { textToValue } from "@/lib/plate";
import { formatDuration } from "@/lib/runtime";
import { cn } from "@/lib/utils";

export function BeatBlock({
  beat,
  customKinds,
  active,
  onActivate,
  onChangeContent,
  onChangeLabel,
  onChangeKind,
  onDelete,
  onAddShot,
  onAddVariant,
  onSwitchVariant,
  onDeleteVariant,
}: {
  beat: TimedBeat;
  customKinds: CustomBeatKind[];
  active: boolean;
  onActivate: () => void;
  onChangeContent: (payload: { value: Value; text: string }) => void;
  onChangeLabel: (label: string) => void;
  onChangeKind: (kind: BeatKind) => void;
  onDelete: () => void;
  onAddShot: (text: string) => void;
  onAddVariant: () => void;
  onSwitchVariant: (variantId: string) => void;
  onDeleteVariant: (variantId: string) => void;
}) {
  const meta = resolveBeatMeta(beat.kind, customKinds);
  const [label, setLabel] = useState(beat.label);
  // Initial value only — the Plate editor owns its state after mount. The
  // parent re-keys this block on variant switches to remount with new text.
  const [initialValue] = useState<Value>(
    () => (beat.content as Value | null) ?? textToValue(beat.text),
  );
  const activeVariant = beat.variants.find((v) => v.id === beat.activeVariantId);

  const otherKinds = [
    ...BEAT_KINDS.filter((k) => k !== beat.kind).map((k) => ({
      key: k as BeatKind,
      meta: resolveBeatMeta(k),
    })),
    ...customKinds
      .filter((c) => c.id !== beat.kind)
      .map((c) => ({ key: c.id, meta: resolveBeatMeta(c.id, customKinds) })),
  ];

  return (
    <section
      onFocusCapture={onActivate}
      onClick={onActivate}
      className={cn(
        "group rounded-r-xl border-l-[3px] py-3 pl-5 pr-3 transition-colors",
        active && "bg-muted",
      )}
      style={{ borderLeftColor: active ? meta.color : "transparent" }}
    >
      <div className="mb-1.5 flex items-center gap-2.5">
        <span
          className="rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[1.5px]"
          style={meta.tagStyle}
        >
          {meta.label}
        </span>

        {beat.variants.length > 0 && (
          <span className="flex items-center gap-0.5">
            {beat.variants.map((v) => (
              <button
                key={v.id}
                onClick={() => v.id !== beat.activeVariantId && onSwitchVariant(v.id)}
                className={cn(
                  "rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold",
                  v.id === beat.activeVariantId
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {v.label}
              </button>
            ))}
          </span>
        )}

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
            <DropdownMenuItem onClick={onAddVariant}>
              <GitBranch className="size-4" /> New variant of this beat
            </DropdownMenuItem>
            {activeVariant && beat.variants.length > 1 && (
              <DropdownMenuItem onClick={() => onDeleteVariant(activeVariant.id)}>
                <Trash2 className="size-4" /> Delete variant {activeVariant.label}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {otherKinds.map(({ key, meta: kindMeta }) => (
              <DropdownMenuItem key={key} onClick={() => onChangeKind(key)}>
                <span className="size-2 rounded-full" style={kindMeta.dotStyle} />
                Make {kindMeta.label}
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
        onAddShot={onAddShot}
      />
    </section>
  );
}
