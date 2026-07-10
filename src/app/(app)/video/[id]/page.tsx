"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, LayoutTemplate, PenLine } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import { toast } from "sonner";

import { TemplateGalleryDialog } from "@/components/script/template-gallery";
import { TitleOptions } from "@/components/packaging/title-options";
import { ThumbnailOptions, type NewThumbnail } from "@/components/packaging/thumbnail-options";
import { Checklist } from "@/components/video/checklist";
import { PipelineStepper } from "@/components/video/pipeline-stepper";
import { StatTile } from "@/components/video/stat-tile";
import { ThumbnailPackaging } from "@/components/video/thumbnail-packaging";
import { VideoCardMenu } from "@/components/video/video-card-menu";
import { YouTubeLink } from "@/components/video/youtube-link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompact, timeAgo } from "@/lib/format";
import { countWords, formatDuration, wordsToSeconds } from "@/lib/runtime";
import { STAGE_META, type Stage } from "@/lib/stages";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

export default function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const { data: video, isPending } = useQuery(trpc.video.byId.queryOptions({ id }));

  // Local draft while editing; null derives from the server value.
  const [title, setTitle] = useState<string | null>(null);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: trpc.video.byId.queryKey({ id }) });
    void queryClient.invalidateQueries({ queryKey: trpc.video.list.queryKey() });
  };
  const mutationOpts = {
    onSuccess: invalidate,
    onError: (e: { message: string }) => toast.error(e.message),
  };

  const updateVideo = useMutation(trpc.video.update.mutationOptions(mutationOpts));
  const setStage = useMutation(trpc.video.setStage.mutationOptions(mutationOpts));
  const selectVariant = useMutation(trpc.packaging.select.mutationOptions(mutationOpts));
  const createVariant = useMutation(trpc.packaging.create.mutationOptions(mutationOpts));
  const deleteVariant = useMutation(trpc.packaging.delete.mutationOptions(mutationOpts));
  const addItem = useMutation(trpc.checklist.add.mutationOptions(mutationOpts));
  const renameItem = useMutation(trpc.checklist.rename.mutationOptions(mutationOpts));
  const removeItem = useMutation(trpc.checklist.remove.mutationOptions(mutationOpts));
  const applyTemplate = useMutation(
    trpc.beat.applyTemplate.mutationOptions({
      onSuccess: () => {
        invalidate();
        void queryClient.invalidateQueries({
          queryKey: trpc.beat.listByVideo.queryKey({ videoId: id }),
        });
        toast.success("Template applied");
      },
      onError: (e) => toast.error(e.message),
    }),
  );
  const toggleItem = useMutation(
    trpc.checklist.toggle.mutationOptions({
      onMutate: async (input) => {
        const key = trpc.video.byId.queryKey({ id });
        await queryClient.cancelQueries({ queryKey: key });
        const prev = queryClient.getQueryData(key);
        queryClient.setQueryData(key, (old) =>
          old
            ? {
                ...old,
                checklist: old.checklist.map((c) =>
                  c.id === input.id ? { ...c, done: input.done } : c,
                ),
              }
            : old,
        );
        return { prev };
      },
      onError: (e, _input, ctx) => {
        if (ctx?.prev) queryClient.setQueryData(trpc.video.byId.queryKey({ id }), ctx.prev);
        toast.error(e.message);
      },
      onSettled: invalidate,
    }),
  );

  if (isPending || !video) {
    return (
      <div className="mx-auto max-w-[980px] p-6">
        <Skeleton className="h-8 w-40" />
        <div className="mt-6 grid grid-cols-[400px_1fr] gap-8">
          <Skeleton className="aspect-video rounded-thumb" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-6 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  const stage = STAGE_META[video.stage];
  const thumbnailVariants = video.variants.filter((v) => v.kind === "thumbnail");
  const titleVariants = video.variants.filter((v) => v.kind === "title");
  const totalWords = video.beats.reduce((a, b) => a + countWords(b.text), 0);
  const totalSec = video.beats.reduce((a, b) => a + wordsToSeconds(countWords(b.text)), 0);
  const estCtr = thumbnailVariants.find((v) => v.isSelected)?.estCtr ?? video.ctr ?? null;
  const scriptHasContent = video.beats.some((b) => b.text.trim().length > 0);

  const displayTitle = title ?? video.title;
  const commitTitle = () => {
    if (title !== null && title.trim() && title !== video.title) {
      updateVideo.mutate({ id, title: title.trim() });
    }
    setTitle(null);
  };

  const onCreateThumbnail = (input: NewThumbnail) => {
    createVariant.mutate(
      "imageUrl" in input
        ? { kind: "thumbnail", videoId: id, imageUrl: input.imageUrl }
        : { kind: "thumbnail", videoId: id, color: input.color, thumbText: input.lines },
    );
  };

  return (
    <div className="mx-auto w-full max-w-[980px] px-6 pb-16 pt-4">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to channel
        </Link>
        <VideoCardMenu video={video} />
      </div>

      <div className="grid gap-8 md:grid-cols-[400px_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <div className="relative">
            <ThumbnailPackaging
              color={video.packagingColor}
              lines={video.thumbText}
              imageUrl={video.thumbImageUrl}
              alt={video.title}
            />
            <span
              className={cn(
                "absolute left-3 top-3 rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[1.5px] backdrop-blur",
                stage.badge,
              )}
            >
              {stage.shortLabel}
            </span>
          </div>

          <section>
            <p className="mono-label mb-2">Thumbnails</p>
            <ThumbnailOptions
              variants={thumbnailVariants}
              onSelect={(variantId) => selectVariant.mutate({ variantId })}
              onDelete={(variantId) => deleteVariant.mutate({ id: variantId })}
              onCreate={onCreateThumbnail}
            />
          </section>

          <section>
            <p className="mono-label mb-2">Titles</p>
            <TitleOptions
              variants={titleVariants}
              onSelect={(variantId) => selectVariant.mutate({ variantId })}
              onDelete={(variantId) => deleteVariant.mutate({ id: variantId })}
              onCreate={(t) => createVariant.mutate({ kind: "title", videoId: id, title: t })}
            />
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <input
              value={displayTitle}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              className="-mx-2 w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-2xl font-bold outline-none transition-colors hover:border-border focus:border-ring"
            />
            <p className="mt-1 text-sm text-muted-foreground">
              {video.stage === "published" && video.views != null
                ? `${formatCompact(video.views)} views · ${timeAgo(video.publishedAt ?? video.createdAt)}`
                : `${stage.label}${video.nextAction ? ` · next: ${video.nextAction}` : ""}`}
            </p>
          </div>

          <PipelineStepper
            stage={video.stage}
            onSelect={(s: Stage) => setStage.mutate({ id, stage: s })}
          />

          <div className="flex">
            <Button asChild className="rounded-r-none">
              <Link href={`/video/${id}/script`}>
                <PenLine className="size-4" /> Open script
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label="Script options"
                  className="rounded-l-none border-l border-primary-foreground/20 px-2"
                >
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[230px]">
                <DropdownMenuItem
                  onClick={() => setTemplatesOpen(true)}
                  className="whitespace-nowrap"
                >
                  <LayoutTemplate className="size-4" /> Start from a template…
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div>
            <p className="mono-label mb-2">Checklist</p>
            <Checklist
              items={video.checklist}
              onToggle={(itemId, done) => toggleItem.mutate({ id: itemId, done })}
              onAdd={(label) => addItem.mutate({ videoId: id, label })}
              onRename={(itemId, label) => renameItem.mutate({ id: itemId, label })}
              onRemove={(itemId) => removeItem.mutate({ id: itemId })}
            />
          </div>

          <div className="flex gap-3">
            <StatTile
              label="Runtime"
              value={
                video.durationSec != null
                  ? formatDuration(video.durationSec)
                  : formatDuration(totalSec)
              }
            />
            <StatTile label="Words" value={String(totalWords)} />
            <StatTile label="Est. CTR" value={estCtr != null ? `${estCtr}%` : "—"} />
          </div>

          <div>
            <p className="mono-label mb-2">Proposed release</p>
            <input
              type="date"
              value={video.scheduledAt ? new Date(video.scheduledAt).toISOString().slice(0, 10) : ""}
              onChange={(e) =>
                updateVideo.mutate({
                  id,
                  scheduledAt: e.target.value ? new Date(e.target.value) : null,
                })
              }
              className="w-full rounded-lg border bg-transparent px-3 py-2 text-[13px] outline-none transition-colors hover:border-ring focus:border-ring"
            />
          </div>

          <YouTubeLink videoId={id} youtubeVideoId={video.youtubeVideoId} />
        </div>
      </div>

      <TemplateGalleryDialog
        open={templatesOpen}
        onOpenChange={setTemplatesOpen}
        videoId={id}
        scriptHasContent={scriptHasContent}
        onApply={(templateId) => applyTemplate.mutate({ videoId: id, templateId })}
      />
    </div>
  );
}
