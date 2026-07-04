"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft, Check, Copy, GripVertical, Plus, Settings2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { StatTile } from "@/components/video/stat-tile";
import { ThumbnailPackaging } from "@/components/video/thumbnail-packaging";
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
import { formatDuration } from "@/lib/runtime";
import { STAGE_META } from "@/lib/stages";
import { cn } from "@/lib/utils";
import type { VideoDetail } from "@/trpc/types";

/** Whole script as markdown: title, then one `## Label` section per beat with
 *  its prose. Handy for pasting into an AI for a review pass. */
function scriptToMarkdown(title: string, beats: TimedBeat[]): string {
  const out = [`# ${title.trim() || "Untitled"}`];
  for (const b of beats) {
    out.push(`## ${b.label}`);
    if (b.text.trim()) out.push(b.text.trim());
  }
  return out.join("\n\n") + "\n";
}

function CopyMarkdownButton({ title, beats }: { title: string; beats: TimedBeat[] }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(scriptToMarkdown(title, beats));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  }

  return (
    <button
      onClick={copy}
      className="flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:scale-[0.99]"
    >
      {copied ? (
        <Check className="size-3.5 text-stage-published" />
      ) : (
        <Copy className="size-3.5" />
      )}
      {copied ? "Copied" : "Copy as Markdown"}
    </button>
  );
}

function OutlineRow({
  beat,
  customKinds,
  active,
  onSelect,
}: {
  beat: TimedBeat;
  customKinds: CustomBeatKind[];
  active: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: beat.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "z-10 opacity-80")}
    >
      <button
        onClick={onSelect}
        className={cn(
          "group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px]",
          active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60",
        )}
      >
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-3.5" />
        </span>
        <span
          className="size-2 shrink-0 rounded-full"
          style={resolveBeatMeta(beat.kind, customKinds).dotStyle}
        />
        <span className="min-w-0 flex-1 truncate">{beat.label}</span>
        <span className="font-mono text-[11px] text-muted-foreground">{formatDuration(beat.sec)}</span>
      </button>
    </li>
  );
}

export function OutlineRail({
  video,
  beats,
  customKinds,
  activeId,
  totalWords,
  totalSec,
  saving,
  onSelect,
  onReorder,
  onAddBeat,
  onCustomize,
}: {
  video: VideoDetail;
  beats: TimedBeat[];
  customKinds: CustomBeatKind[];
  activeId: string | null;
  totalWords: number;
  totalSec: number;
  saving: boolean;
  onSelect: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
  onAddBeat: (kind: BeatKind) => void;
  onCustomize: () => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = beats.findIndex((b) => b.id === active.id);
    const newIndex = beats.findIndex((b) => b.id === over.id);
    onReorder(arrayMove(beats, oldIndex, newIndex).map((b) => b.id));
  }

  const stage = STAGE_META[video.stage];

  return (
    <aside className="flex w-full shrink-0 flex-col gap-5 overflow-y-auto border-r border-border p-5">
      <div className="flex items-center justify-between">
        <Link
          href={`/video/${video.id}`}
          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back
        </Link>
        <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <span
            className={cn(
              "size-2 rounded-full",
              saving ? "animate-pulse bg-stage-editing" : "bg-saved-dot",
            )}
          />
          {saving ? "Saving…" : "Saved"}
        </span>
      </div>

      <Link href={`/video/${video.id}`} className="flex flex-col gap-3">
        <ThumbnailPackaging
          color={video.packagingColor}
          lines={video.thumbText}
          imageUrl={video.thumbImageUrl}
          className="w-full"
        />
        <div>
          <p className="line-clamp-2 text-sm font-medium">{video.title}</p>
          <p className="mt-1 flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <span className={cn("size-2 rounded-full", stage.dot)} />
            {stage.label} · Not scheduled
          </p>
        </div>
      </Link>

      <div className="flex gap-2">
        <StatTile label="Runtime" value={formatDuration(totalSec)} />
        <StatTile label="Words" value={String(totalWords)} />
      </div>

      <CopyMarkdownButton title={video.title} beats={beats} />

      <div>
        <p className="mono-label mb-2">Script outline</p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={beats.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-0.5">
              {beats.map((b) => (
                <OutlineRow
                  key={b.id}
                  beat={b}
                  customKinds={customKinds}
                  active={b.id === activeId}
                  onSelect={() => onSelect(b.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>

        <DropdownMenu>
          <DropdownMenuTrigger className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-[13px] text-muted-foreground hover:bg-accent">
            <Plus className="size-4" /> Add beat
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {BEAT_KINDS.map((kind) => {
              const meta = resolveBeatMeta(kind);
              return (
                <DropdownMenuItem key={kind} onClick={() => onAddBeat(kind)}>
                  <span className="size-2 rounded-full" style={meta.dotStyle} />
                  {meta.label}
                </DropdownMenuItem>
              );
            })}
            {customKinds.map((kind) => (
              <DropdownMenuItem key={kind.id} onClick={() => onAddBeat(kind.id)}>
                <span className="size-2 rounded-full" style={{ backgroundColor: kind.color }} />
                {kind.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onCustomize}>
              <Settings2 className="size-4" /> Customize kinds…
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
