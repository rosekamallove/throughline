"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronsLeftRight, ChevronsRightLeft } from "lucide-react";
import { LazyMotion, domAnimation, m } from "motion/react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { ThumbnailPackaging } from "@/components/video/thumbnail-packaging";
import { VideoCardMenu } from "@/components/video/video-card-menu";
import { formatCompact, timeAgo } from "@/lib/format";
import { toggleColumnCollapsed, useBoardPrefs } from "@/lib/board-prefs";
import { STAGES, STAGE_META, type Stage } from "@/lib/stages";
import { cn } from "@/lib/utils";
import type { Video } from "@/trpc/types";
import { useTRPC } from "@/trpc/client";

const EASE_OUT_QUART = [0.32, 0.72, 0, 1] as const;

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
      <ThumbnailPackaging
        color={video.packagingColor}
        lines={video.thumbText}
        imageUrl={video.thumbImageUrl}
        alt={video.title}
      />
      <div className="mt-2 flex items-start gap-1">
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[13px] font-medium leading-snug">{video.title}</p>
          <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
            {video.stage === "published" && video.views != null
              ? `${formatCompact(video.views)} views · ${timeAgo(video.publishedAt ?? video.createdAt)}`
              : (video.nextAction ?? timeAgo(video.createdAt))}
          </p>
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
}: {
  stage: Stage;
  videos: Video[];
  collapsed: boolean;
}) {
  const meta = STAGE_META[stage];
  const { setNodeRef, isOver } = useDroppable({ id: stage, disabled: collapsed });

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
          "flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto rounded-b-2xl p-2.5 pt-1 transition-colors",
          isOver && "bg-accent/50",
        )}
      >
        <SortableContext items={videos.map((v) => v.id)} strategy={verticalListSortingStrategy}>
          {videos.map((video) => (
            <BoardCard key={video.id} video={video} />
          ))}
        </SortableContext>
        {videos.length === 0 && (
          <p className="rounded-xl border border-dashed p-4 text-center text-[12px] text-muted-foreground">
            Drop here
          </p>
        )}
      </div>
    </m.div>
  );
}

export function VideoBoard({ videos }: { videos: Video[] }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [{ collapsed }] = useBoardPrefs();
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const overStageRef = useRef<Stage | null>(null);
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null);

  const sensors = useSensors(
    // 8px activation distance so plain clicks still open the video.
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const setStage = useMutation(
    trpc.video.setStage.mutationOptions({
      onError: (e) => {
        toast.error(e.message);
        void queryClient.invalidateQueries({ queryKey: trpc.video.list.queryKey() });
      },
      onSettled: () =>
        void queryClient.invalidateQueries({ queryKey: trpc.video.list.queryKey() }),
    }),
  );

  function resolveOverStage(overId: string | number): Stage | null {
    if (STAGES.includes(overId as Stage)) return overId as Stage;
    // Hovering the dragged card itself must not change the target column —
    // its display position already reflects the hover, and resolving it via
    // its original stage causes an infinite placement flip-flop.
    if (activeVideo && overId === activeVideo.id) return overStageRef.current;
    const video = videos.find((v) => v.id === overId);
    return video ? video.stage : null;
  }

  // Live placement: while dragging, show the active card in the hovered column
  // so siblings reflow and a real drop slot appears (axis pattern).
  const displayVideos = useMemo(() => {
    if (!activeVideo || !dragOverStage || activeVideo.stage === dragOverStage) return videos;
    return videos.map((v) => (v.id === activeVideo.id ? { ...v, stage: dragOverStage } : v));
  }, [videos, activeVideo, dragOverStage]);

  const byStage = (stage: Stage) => displayVideos.filter((v) => v.stage === stage);

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
    const toStage = event.over ? overStageRef.current : null;
    setActiveVideo(null);
    setDragOverStage(null);
    overStageRef.current = null;
    if (!video || !toStage || video.stage === toStage) return;

    // Optimistic write BEFORE the mutation so the card never flashes back.
    queryClient.setQueryData(trpc.video.list.queryKey(), (old) =>
      old?.map((v) => (v.id === video.id ? { ...v, stage: toStage } : v)),
    );
    setStage.mutate({ id: video.id, stage: toStage });
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
        collisionDetection={closestCorners}
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
              videos={byStage(stage)}
              collapsed={collapsed[stage] ?? false}
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
