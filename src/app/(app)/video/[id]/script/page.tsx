"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Share2 } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { BeatBlock } from "@/components/script/beat-block";
import { CoachPanel } from "@/components/script/coach-panel";
import { OutlineRail } from "@/components/script/outline-rail";
import type { TimedBeat } from "@/components/script/pacing-bar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BEAT_META, type BeatKind } from "@/lib/beats";
import { countWords, formatDuration, wordsToSeconds } from "@/lib/runtime";
import type { BrollItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

const AUTOSAVE_MS = 600;

export default function ScriptEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: videoId } = use(params);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: video } = useQuery(trpc.video.byId.queryOptions({ id: videoId }));
  const { data: beats } = useQuery(trpc.beat.listByVideo.queryOptions({ videoId }));
  const beatsKey = trpc.beat.listByVideo.queryKey({ videoId });

  // null falls back to the first beat once data loads.
  const [selectedId, setActiveId] = useState<string | null>(null);
  const activeId = selectedId ?? beats?.[0]?.id ?? null;
  // Local drafts are the source of truth while typing; the server catches up.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [pendingSaves, setPendingSaves] = useState(0);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const updateText = useMutation(trpc.beat.updateText.mutationOptions());

  function scheduleTextSave(beatId: string, text: string) {
    setDrafts((d) => ({ ...d, [beatId]: text }));
    clearTimeout(timers.current[beatId]);
    timers.current[beatId] = setTimeout(() => {
      delete timers.current[beatId];
      setPendingSaves((n) => n + 1);
      updateText.mutate(
        { id: beatId, text },
        {
          onSuccess: () => {
            // Patch the cache silently — never invalidate here, a refetch
            // mid-typing would clobber the caret (plan pitfall #5).
            queryClient.setQueryData(beatsKey, (old) =>
              old?.map((b) => (b.id === beatId ? { ...b, text } : b)),
            );
          },
          onError: (e) => toast.error(`Autosave failed: ${e.message}`),
          onSettled: () => setPendingSaves((n) => n - 1),
        },
      );
    }, AUTOSAVE_MS);
  }

  // Flush pending debounces if the user navigates away quickly.
  const draftsRef = useRef(drafts);
  useEffect(() => {
    draftsRef.current = drafts;
  }, [drafts]);
  const mutateTextRef = useRef(updateText.mutate);
  useEffect(() => {
    mutateTextRef.current = updateText.mutate;
  }, [updateText.mutate]);
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const [beatId, timer] of Object.entries(pending)) {
        clearTimeout(timer);
        const text = draftsRef.current[beatId];
        if (text != null) mutateTextRef.current({ id: beatId, text });
      }
    };
  }, []);

  const reorder = useMutation(
    trpc.beat.reorder.mutationOptions({
      onMutate: async ({ orderedIds }) => {
        await queryClient.cancelQueries({ queryKey: beatsKey });
        const prev = queryClient.getQueryData(beatsKey);
        queryClient.setQueryData(beatsKey, (old) =>
          old
            ? orderedIds
                .map((id) => old.find((b) => b.id === id))
                .filter((b) => b != null)
                .map((b, i) => ({ ...b, position: i }))
            : old,
        );
        return { prev };
      },
      onError: (e, _input, ctx) => {
        if (ctx?.prev) queryClient.setQueryData(beatsKey, ctx.prev);
        toast.error(e.message);
      },
      onSettled: () => queryClient.invalidateQueries({ queryKey: beatsKey }),
    }),
  );

  const setBroll = useMutation(
    trpc.beat.setBroll.mutationOptions({
      onMutate: async ({ id, broll }) => {
        await queryClient.cancelQueries({ queryKey: beatsKey });
        const prev = queryClient.getQueryData(beatsKey);
        queryClient.setQueryData(beatsKey, (old) =>
          old?.map((b) => (b.id === id ? { ...b, broll } : b)),
        );
        return { prev };
      },
      onError: (e, _input, ctx) => {
        if (ctx?.prev) queryClient.setQueryData(beatsKey, ctx.prev);
        toast.error(e.message);
      },
    }),
  );

  const updateBeat = useMutation(
    trpc.beat.update.mutationOptions({
      onSuccess: (updated) => {
        queryClient.setQueryData(beatsKey, (old) =>
          old?.map((b) => (b.id === updated.id ? { ...b, ...updated } : b)),
        );
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const createBeat = useMutation(
    trpc.beat.create.mutationOptions({
      onSuccess: (created) => {
        void queryClient.invalidateQueries({ queryKey: beatsKey }).then(() => {
          setActiveId(created.id);
        });
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const deleteBeat = useMutation(
    trpc.beat.delete.mutationOptions({
      onSuccess: (res) => {
        if (activeId === res.id) setActiveId(null);
        void queryClient.invalidateQueries({ queryKey: beatsKey });
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const timed: TimedBeat[] = useMemo(
    () =>
      (beats ?? []).map((b) => {
        const text = drafts[b.id] ?? b.text;
        const words = countWords(text);
        return { ...b, text, words, sec: wordsToSeconds(words) };
      }),
    [beats, drafts],
  );

  const totalWords = timed.reduce((a, b) => a + b.words, 0);
  const totalSec = timed.reduce((a, b) => a + b.sec, 0);
  const activeBeat = timed.find((b) => b.id === activeId) ?? null;

  if (!video || !beats) {
    return (
      <div className="flex h-full">
        <div className="w-[284px] border-r border-line-soft p-5">
          <Skeleton className="aspect-video rounded-thumb" />
          <Skeleton className="mt-4 h-4 w-3/4" />
        </div>
        <div className="mx-auto w-full max-w-[700px] space-y-4 p-10">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-12 shrink-0 items-center gap-4 border-b border-line-soft px-5">
        <Link
          href={`/video/${videoId}`}
          className="flex items-center gap-2 text-sm text-sub hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back
        </Link>
        <span className="text-sm font-medium">Script</span>
        <span className="flex items-center gap-1.5 text-[12px] text-sub">
          <span
            className={cn(
              "size-2 rounded-full",
              pendingSaves > 0 ? "animate-pulse bg-stage-editing" : "bg-saved-dot",
            )}
          />
          {pendingSaves > 0 ? "Saving…" : "Saved"}
        </span>
        <Button variant="secondary" size="sm" className="ml-auto rounded-full">
          <Share2 className="size-3.5" /> Share
        </Button>
      </header>

      <div className="flex min-h-0 flex-1">
        <OutlineRail
          video={video}
          beats={timed}
          activeId={activeId}
          totalWords={totalWords}
          totalSec={totalSec}
          onSelect={setActiveId}
          onReorder={(orderedIds) => reorder.mutate({ videoId, orderedIds })}
          onAddBeat={(kind: BeatKind) =>
            createBeat.mutate({
              videoId,
              kind,
              label: BEAT_META[kind].label,
              afterPosition: activeBeat?.position ?? timed.length - 1,
            })
          }
        />

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[700px] px-8 pb-24 pt-10">
            <p className="mono-label mb-2">Script</p>
            <h1 className="text-3xl font-bold leading-tight">{video.title}</h1>
            <p className="mt-2 font-mono text-[12px] text-sub">
              {timed.length} beats · {totalWords} words · {formatDuration(totalSec)}
            </p>

            <div className="mt-8 flex flex-col gap-4">
              {timed.map((beat) => (
                <BeatBlock
                  key={beat.id}
                  beat={beat}
                  active={beat.id === activeId}
                  onActivate={() => setActiveId(beat.id)}
                  onChangeText={(text) => scheduleTextSave(beat.id, text)}
                  onChangeLabel={(label) => updateBeat.mutate({ id: beat.id, label })}
                  onChangeKind={(kind) => updateBeat.mutate({ id: beat.id, kind })}
                  onDelete={() => deleteBeat.mutate({ id: beat.id })}
                />
              ))}
            </div>
          </div>
        </main>

        <CoachPanel
          beats={timed}
          activeBeat={activeBeat}
          onSelectBeat={setActiveId}
          onSetBroll={(beatId: string, broll: BrollItem[]) =>
            setBroll.mutate({ id: beatId, broll })
          }
        />
      </div>
    </div>
  );
}
