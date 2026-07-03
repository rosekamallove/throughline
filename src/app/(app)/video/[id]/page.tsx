"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MoreVertical, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Checklist } from "@/components/video/checklist";
import { PipelineStepper } from "@/components/video/pipeline-stepper";
import { StatTile } from "@/components/video/stat-tile";
import { ThumbnailPackaging } from "@/components/video/thumbnail-packaging";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompact, timeAgo } from "@/lib/format";
import { countWords, formatDuration, wordsToSeconds } from "@/lib/runtime";
import { STAGE_META, type Stage } from "@/lib/stages";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

const VARIANT_TAGS = ["A", "B", "C", "D", "E"];

export default function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { data: video, isPending } = useQuery(trpc.video.byId.queryOptions({ id }));

  // Local draft while editing; null derives from the server value.
  const [title, setTitle] = useState<string | null>(null);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: trpc.video.byId.queryKey({ id }) });
    void queryClient.invalidateQueries({ queryKey: trpc.video.list.queryKey() });
  };

  const updateVideo = useMutation(
    trpc.video.update.mutationOptions({
      onSuccess: invalidate,
      onError: (e) => toast.error(e.message),
    }),
  );
  const setStage = useMutation(
    trpc.video.setStage.mutationOptions({
      onSuccess: invalidate,
      onError: (e) => toast.error(e.message),
    }),
  );
  const deleteVideo = useMutation(
    trpc.video.delete.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: trpc.video.list.queryKey() });
        toast.success("Video deleted");
        router.push("/");
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
      <div className="mx-auto max-w-[940px] p-6">
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
  const totalWords = video.beats.reduce((a, b) => a + countWords(b.text), 0);
  const totalSec = video.beats.reduce((a, b) => a + wordsToSeconds(countWords(b.text)), 0);
  const estCtr =
    thumbnailVariants.find((v) => v.isSelected)?.estCtr ?? video.ctr ?? null;

  const displayTitle = title ?? video.title;

  const commitTitle = () => {
    if (title !== null && title.trim() && title !== video.title) {
      updateVideo.mutate({ id, title: title.trim() });
    }
    setTitle(null);
  };

  return (
    <div className="mx-auto w-full max-w-[940px] px-6 pb-16 pt-4">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to channel
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Video options"
            className="rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="size-4" /> Delete video
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this video?</AlertDialogTitle>
              <AlertDialogDescription>
                The script, packaging options, and checklist go with it. This can’t be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteVideo.mutate({ id })}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid gap-8 md:grid-cols-[400px_minmax(0,1fr)]">
        {/* Left: hero + variants */}
        <div className="flex flex-col gap-5">
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
              {stage.label}
            </span>
          </div>

          {thumbnailVariants.length > 0 && (
            <div>
              <p className="mono-label mb-2">Thumbnail variants</p>
              <div className="grid grid-cols-3 gap-3">
                {thumbnailVariants.map((v, i) => (
                  <div key={v.id} className="flex flex-col gap-1.5">
                    <ThumbnailPackaging
                      color={v.color}
                      lines={v.thumbText}
                      imageUrl={v.imageUrl}
                      className={cn(
                        v.isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                      )}
                    />
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {VARIANT_TAGS[i]}
                      {v.estCtr != null && ` · ${v.estCtr}% CTR`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: title, stepper, actions, checklist, stats */}
        <div className="flex flex-col gap-6">
          <div>
            <input
              value={displayTitle}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 -mx-2 text-2xl font-bold outline-none transition-colors hover:border-border focus:border-ring"
            />
            <p className="mt-1 px-0 text-sm text-muted-foreground">
              {video.stage === "published" && video.views != null
                ? `${formatCompact(video.views)} views · ${timeAgo(video.publishedAt ?? video.createdAt)}`
                : `${stage.label}${video.nextAction ? ` · next: ${video.nextAction}` : ""}`}
            </p>
          </div>

          <PipelineStepper
            stage={video.stage}
            onSelect={(s: Stage) => setStage.mutate({ id, stage: s })}
          />

          <div className="flex gap-3">
            <Button asChild>
              <Link href={`/video/${id}/script`}>Open script</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/video/${id}/packaging`}>Edit packaging</Link>
            </Button>
          </div>

          <div>
            <p className="mono-label mb-2">Checklist</p>
            <Checklist
              items={video.checklist}
              onToggle={(itemId, done) => toggleItem.mutate({ id: itemId, done })}
            />
          </div>

          <div className="flex gap-3">
            <StatTile
              label="Runtime"
              value={video.durationSec != null ? formatDuration(video.durationSec) : formatDuration(totalSec)}
            />
            <StatTile label="Words" value={String(totalWords)} />
            <StatTile label="Est. CTR" value={estCtr != null ? `${estCtr}%` : "—"} />
          </div>
        </div>
      </div>
    </div>
  );
}
