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
import { GripVertical, Plus } from "lucide-react";
import Link from "next/link";

import { StatTile } from "@/components/video/stat-tile";
import { ThumbnailPackaging } from "@/components/video/thumbnail-packaging";
import type { TimedBeat } from "@/components/script/pacing-bar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BEAT_KINDS, BEAT_META, type BeatKind } from "@/lib/beats";
import { formatDuration } from "@/lib/runtime";
import { STAGE_META } from "@/lib/stages";
import { cn } from "@/lib/utils";
import type { VideoDetail } from "@/trpc/types";

function OutlineRow({
  beat,
  active,
  onSelect,
}: {
  beat: TimedBeat;
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
        <span className={cn("size-2 shrink-0 rounded-full", BEAT_META[beat.kind].dot)} />
        <span className="min-w-0 flex-1 truncate">{beat.label}</span>
        <span className="font-mono text-[11px] text-muted-foreground">{formatDuration(beat.sec)}</span>
      </button>
    </li>
  );
}

export function OutlineRail({
  video,
  beats,
  activeId,
  totalWords,
  totalSec,
  onSelect,
  onReorder,
  onAddBeat,
}: {
  video: VideoDetail;
  beats: TimedBeat[];
  activeId: string | null;
  totalWords: number;
  totalSec: number;
  onSelect: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
  onAddBeat: (kind: BeatKind) => void;
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
    <aside className="flex w-[284px] shrink-0 flex-col gap-5 overflow-y-auto border-r border-border p-5">
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

      <div>
        <p className="mono-label mb-2">Script outline</p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={beats.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-0.5">
              {beats.map((b) => (
                <OutlineRow
                  key={b.id}
                  beat={b}
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
            {BEAT_KINDS.map((kind) => (
              <DropdownMenuItem key={kind} onClick={() => onAddBeat(kind)}>
                <span className={cn("size-2 rounded-full", BEAT_META[kind].dot)} />
                {BEAT_META[kind].label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
