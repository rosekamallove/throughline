"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, ChevronsLeftRight, ChevronsRightLeft, Plus } from "lucide-react";
import { LazyMotion, domAnimation, m } from "motion/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { OpenScriptButton } from "@/components/video/open-script-button";
import { ThumbnailPackaging } from "@/components/video/thumbnail-packaging";
import { VideoCardMenu } from "@/components/video/video-card-menu";
import { formatCompact, formatShortDate, timeAgo } from "@/lib/format";
import { toggleColumnCollapsed, useBoardPrefs } from "@/lib/board-prefs";
import { STAGES, STAGE_META, type Stage } from "@/lib/stages";
import { cn } from "@/lib/utils";
import type { Video } from "@/trpc/types";
import { useTRPC } from "@/trpc/client";

const EASE_OUT_QUART = [0.32, 0.72, 0, 1] as const;

// The drop target should be whatever is under the POINTER — corner-distance
// heuristics get ambiguous at column boundaries and on empty columns.
const boardCollision: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length ? hits : rectIntersection(args);
};

const STAGGER_CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const FADE_UP_ITEM = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_OUT_QUART } },
};

function BoardCard({ video }: { video: Video }) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: video.id, data: { video } });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group touch-none cursor-pointer active:cursor-grabbing",
        isDragging ? "opacity-30" : "opacity-100",
      )}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (!isDragging) router.push(`/video/${video.id}`);
      }}
    >
      <BoardCardBody video={video} />
    </div>
  );
}

function BoardCardBody({ video }: { video: Video }) {
  return (
    <div className="rounded-xl border bg-card p-2.5 shadow-xs transition-shadow hover:shadow-sm">
      <div className="relative">
        <ThumbnailPackaging
          color={video.packagingColor}
          lines={video.thumbText}
          imageUrl={video.thumbImageUrl}
          alt={video.title}
        />
        <OpenScriptButton videoId={video.id} />
      </div>
      <div className="mt-2 flex items-start gap-1">
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[13px] font-medium leading-snug">{video.title}</p>
          <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
            {video.stage === "published" && video.views != null
              ? `${formatCompact(video.views)} views · ${timeAgo(video.publishedAt ?? video.createdAt)}`
              : (video.nextAction ?? timeAgo(video.createdAt))}
          </p>
          {video.scheduledAt && (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              <CalendarClock className="size-3" />
              {formatShortDate(video.scheduledAt)}
            </span>
          )}
        </div>
        <VideoCardMenu
          video={video}
          className="opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
        />
      </div>
    </div>
  );
}

function BoardColumn({
  stage,
  videos,
  collapsed,
  highlight,
}: {
  stage: Stage;
  videos: Video[];
  collapsed: boolean;
  highlight: boolean;
}) {
  const meta = STAGE_META[stage];
  const { setNodeRef } = useDroppable({ id: stage, disabled: collapsed });

  if (collapsed) {
    return (
      <m.button
        variants={FADE_UP_ITEM}
        onClick={() => toggleColumnCollapsed(stage)}
        className="flex h-full w-12 shrink-0 flex-col items-center gap-3 rounded-2xl border bg-muted/40 py-4 transition-[width] duration-300 hover:bg-muted"
        aria-label={`Expand ${meta.label}`}
      >
        <ChevronsLeftRight className="size-4 text-muted-foreground" />
        <span className={cn("size-2 rounded-full", meta.dot)} />
        <span className="mono-label [writing-mode:sideways-rl]">
          {meta.shortLabel} · {videos.length}
        </span>
      </m.button>
    );
  }

  return (
    <m.div
      variants={FADE_UP_ITEM}
      className="flex h-full w-[290px] shrink-0 flex-col rounded-2xl border bg-muted/40 transition-[width] duration-300"
    >
      <div className="flex items-center gap-2 px-3 pb-2 pt-3">
        <span className={cn("size-2 rounded-full", meta.dot)} />
        <span className="text-[13px] font-semibold">{meta.shortLabel}</span>
        <span className="font-mono text-[11px] text-muted-foreground">{videos.length}</span>
        <button
          onClick={() => toggleColumnCollapsed(stage)}
          aria-label={`Collapse ${meta.label}`}
          className="ml-auto rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover/col:opacity-100"
        >
          <ChevronsRightLeft className="size-3.5" />
        </button>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto rounded-b-2xl p-2.5 pt-1 transition-colors duration-150",
          highlight && "bg-accent/60",
        )}
      >
        {/* Input sits at the top because new ideas sort newest-first — so a
            fresh idea lands right below the field the user just typed in. */}
        {stage === "ideation" && <QuickAddCard />}
        <SortableContext items={videos.map((v) => v.id)} strategy={verticalListSortingStrategy}>
          {videos.map((video) => (
            <BoardCard key={video.id} video={video} />
          ))}
        </SortableContext>
        {videos.length === 0 && (
          <p
            className={cn(
              "flex flex-1 items-center justify-center rounded-xl border border-dashed text-[12px] text-muted-foreground transition-colors duration-150",
              highlight && "border-ring text-foreground",
            )}
          >
            Drop here
          </p>
        )}
      </div>
    </m.div>
  );
}

/** Rapid idea capture at the top of the Ideation column. Enter creates and
 *  keeps the input open so several ideas can land in a row. */
function QuickAddCard() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  const create = useMutation(
    trpc.video.create.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: trpc.video.list.queryKey() });
        setTitle("");
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex shrink-0 items-center gap-2 rounded-xl border border-dashed px-3 py-2.5 text-[13px] text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
      >
        <Plus className="size-3.5" /> New video
      </button>
    );
  }

  return (
    <input
      autoFocus
      value={title}
      disabled={create.isPending}
      onChange={(e) => setTitle(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && title.trim() && !create.isPending) {
          create.mutate({ title: title.trim() });
        }
        if (e.key === "Escape") {
          setOpen(false);
          setTitle("");
        }
      }}
      onBlur={() => {
        if (!title.trim()) setOpen(false);
      }}
      placeholder="Video idea, Enter to add…"
      className="shrink-0 rounded-xl border bg-card px-3 py-2.5 text-[13px] shadow-xs outline-none placeholder:text-muted-foreground focus:border-ring"
    />
  );
}

export function VideoBoard({ videos }: { videos: Video[] }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [{ collapsed, sort }, setPrefs] = useBoardPrefs();
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const overStageRef = useRef<Stage | null>(null);
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null);

  const sensors = useSensors(
    // 8px activation distance so plain clicks still open the video.
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: trpc.video.list.queryKey() });
  const reorder = useMutation(
    trpc.video.reorder.mutationOptions({
      onError: (e) => {
        toast.error(e.message);
        invalidate();
      },
      onSettled: invalidate,
    }),
  );
  const setStage = useMutation(
    trpc.video.setStage.mutationOptions({
      onError: (e) => {
        toast.error(e.message);
        invalidate();
      },
      onSettled: invalidate,
    }),
  );

  function resolveOverStage(overId: string | number): Stage | null {
    if (STAGES.includes(overId as Stage)) return overId as Stage;
    const video = videos.find((v) => v.id === overId);
    return video ? video.stage : null;
  }

  // Column order depends on the chosen sort. "custom" = manual drag position;
  // "created"/"published" = by date. Newest createdAt is the shared tiebreaker.
  const orderedByStage = (stage: Stage) => {
    const list = videos.filter((v) => v.stage === stage);
    const byCreated = (a: Video, b: Video) => b.createdAt.getTime() - a.createdAt.getTime();
    if (sort === "created") return list.sort(byCreated);
    if (sort === "published") {
      const dateOf = (v: Video) => v.publishedAt ?? v.scheduledAt;
      return list.sort((a, b) => {
        const da = dateOf(a);
        const db = dateOf(b);
        if (da && db) return db.getTime() - da.getTime(); // most recent / furthest out first
        if (da) return -1; // dated videos before undated
        if (db) return 1;
        return byCreated(a, b);
      });
    }
    return list.sort((a, b) => a.position - b.position || byCreated(a, b));
  };

  function handleDragStart(event: DragStartEvent) {
    const video = videos.find((v) => v.id === event.active.id);
    setActiveVideo(video ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const over = event.over ? resolveOverStage(event.over.id) : null;
    if (overStageRef.current === over) return;
    overStageRef.current = over;
    setDragOverStage(over);
  }

  function handleDragEnd(event: DragEndEvent) {
    const video = activeVideo;
    const toStage = overStageRef.current;
    setActiveVideo(null);
    setDragOverStage(null);
    overStageRef.current = null;
    if (!video || !toStage) return;

    const sameColumn = video.stage === toStage;

    // In a date sort, a cross-column drag just moves stage — the date decides
    // the slot. A within-column drag there means "I want my own order", so it
    // seeds a custom order and flips the sort to custom.
    if (sort !== "custom" && !sameColumn) {
      queryClient.setQueryData(trpc.video.list.queryKey(), (old) =>
        old?.map((v) => (v.id === video.id ? { ...v, stage: toStage } : v)),
      );
      setStage.mutate({ id: video.id, stage: toStage });
      return;
    }

    const current = orderedByStage(toStage).map((v) => v.id);
    const overId = event.over ? String(event.over.id) : null;
    const overIndex = !overId || overId === toStage ? current.length : current.indexOf(overId);

    let orderedIds: string[];
    if (sameColumn) {
      const from = current.indexOf(video.id);
      const to = overIndex === -1 ? current.length - 1 : overIndex;
      if (from === to || from === -1) return;
      orderedIds = arrayMove(current, from, to);
    } else {
      const insertAt = overIndex === -1 ? current.length : overIndex;
      orderedIds = [...current.slice(0, insertAt), video.id, ...current.slice(insertAt)];
    }

    // Optimistic: stamp the target column's stage + positions before the write.
    const posOf = new Map(orderedIds.map((id, i) => [id, i]));
    queryClient.setQueryData(trpc.video.list.queryKey(), (old) =>
      old?.map((v) =>
        posOf.has(v.id) ? { ...v, stage: toStage, position: posOf.get(v.id)! } : v,
      ),
    );
    if (sort !== "custom") setPrefs({ sort: "custom" });
    reorder.mutate({ stage: toStage, orderedIds });
  }

  function handleDragCancel() {
    setActiveVideo(null);
    setDragOverStage(null);
    overStageRef.current = null;
  }

  return (
    <LazyMotion features={domAnimation}>
      <DndContext
        sensors={sensors}
        collisionDetection={boardCollision}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <m.div
          variants={STAGGER_CONTAINER}
          initial="hidden"
          animate="show"
          className="group/col flex h-[calc(100dvh-10.5rem)] min-h-0 gap-3 overflow-x-auto pb-4"
        >
          {STAGES.map((stage) => (
            <BoardColumn
              key={stage}
              stage={stage}
              videos={orderedByStage(stage)}
              collapsed={collapsed[stage] ?? false}
              highlight={
                dragOverStage === stage &&
                activeVideo !== null &&
                activeVideo.stage !== stage
              }
            />
          ))}
        </m.div>

        <DragOverlay
          dropAnimation={{
            duration: 220,
            easing: `cubic-bezier(${EASE_OUT_QUART.join(",")})`,
          }}
        >
          {activeVideo ? (
            <div className="w-[265px] rotate-1 cursor-grabbing rounded-xl shadow-lg">
              <BoardCardBody video={activeVideo} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </LazyMotion>
  );
}
