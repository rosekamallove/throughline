"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Value } from "platejs";
import { use, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  Clapperboard,
  Film,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";

import { BeatBlock } from "@/components/script/beat-block";
import { CoachPanel } from "@/components/script/coach-panel";
import { ListenControls } from "@/components/script/listen-controls";
import { ManageKindsDialog } from "@/components/script/manage-kinds-dialog";
import { OutlineRail } from "@/components/script/outline-rail";
import type { TimedBeat } from "@/components/script/pacing-bar";
import { Prompter } from "@/components/script/prompter";
import { ResearchRail } from "@/components/script/research-rail";
import { Timeline } from "@/components/script/timeline";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveBeatMeta, type BeatKind } from "@/lib/beats";
import { RAIL_LIMITS, useEditorPrefs } from "@/lib/editor-prefs";
import {
  commentMarkIds,
  hasShotMark,
  shotMarkIds,
  stripCommentMark,
  stripShotMark,
} from "@/lib/plate";
import { countWords, formatDuration, wordsToSeconds } from "@/lib/runtime";
import {
  loadPreferredVoiceURI,
  resolveVoice,
  savePreferredVoiceURI,
  speakBeats,
  stopSpeech,
  useVoices,
} from "@/lib/tts";
import type { BrollItem, CommentItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

const AUTOSAVE_MS = 600;

export default function ScriptEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: videoId } = use(params);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: video } = useQuery(trpc.video.byId.queryOptions({ id: videoId }));
  const { data: beats } = useQuery(trpc.beat.listByVideo.queryOptions({ videoId }));
  const { data: customKinds = [] } = useQuery(trpc.beat.kinds.queryOptions());
  const beatsKey = trpc.beat.listByVideo.queryKey({ videoId });
  const [kindsOpen, setKindsOpen] = useState(false);
  // Bumped when a beat's content is rewritten outside its editor (e.g. a
  // deleted shot's mark is stripped) so the uncontrolled editor remounts.
  const [contentRevs, setContentRevs] = useState<Record<string, number>>({});
  const [focusShotId, setFocusShotId] = useState<string | null>(null);
  const [focusCommentId, setFocusCommentId] = useState<string | null>(null);
  const [rails, setRails] = useEditorPrefs();
  const [prompterOpen, setPrompterOpen] = useState(false);

  // "all", a beat id, or null. speechSynthesis is a global singleton, so one
  // piece of state arbitrates the whole-script and per-beat controls.
  const [playing, setPlaying] = useState<string | null>(null);
  const voices = useVoices();
  const [voiceURI, setVoiceURI] = useState<string | null>(() =>
    typeof window === "undefined" ? null : loadPreferredVoiceURI(),
  );
  useEffect(() => () => stopSpeech(), []);
  const [dragging, setDragging] = useState<"left" | "right" | null>(null);

  function startRailResize(e: React.PointerEvent<HTMLDivElement>, side: "left" | "right") {
    e.preventDefault();
    const startX = e.clientX;
    const startW = side === "left" ? rails.leftWidth : rails.rightWidth;
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    setDragging(side);
    const move = (ev: PointerEvent) => {
      const delta = ev.clientX - startX;
      const raw = side === "left" ? startW + delta : startW - delta;
      const { min, max } = RAIL_LIMITS[side];
      const width = Math.round(Math.min(max, Math.max(min, raw)));
      setRails(side === "left" ? { leftWidth: width } : { rightWidth: width });
    };
    const up = () => {
      setDragging(null);
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", up);
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", up);
  }

  // null falls back to the first beat once data loads.
  const [selectedId, setActiveId] = useState<string | null>(null);
  const activeId = selectedId ?? beats?.[0]?.id ?? null;
  // Local drafts (plain-text mirror) drive stats while typing; the Plate
  // editors own the rich content, the server catches up on a debounce.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const contentDrafts = useRef<Record<string, Value>>({});
  const [pendingSaves, setPendingSaves] = useState(0);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const updateText = useMutation(trpc.beat.updateText.mutationOptions());

  function scheduleContentSave(beatId: string, text: string, content: Value) {
    setDrafts((d) => ({ ...d, [beatId]: text }));
    contentDrafts.current[beatId] = content;
    clearTimeout(timers.current[beatId]);
    timers.current[beatId] = setTimeout(() => {
      delete timers.current[beatId];
      setPendingSaves((n) => n + 1);
      updateText.mutate(
        { id: beatId, text, content },
        {
          onSuccess: () => {
            // Patch the cache silently — never invalidate here, a refetch
            // mid-typing would clobber the caret (plan pitfall #5).
            queryClient.setQueryData(beatsKey, (old) =>
              old?.map((b) => (b.id === beatId ? { ...b, text, content } : b)),
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
    const pendingContent = contentDrafts.current;
    return () => {
      for (const [beatId, timer] of Object.entries(pending)) {
        clearTimeout(timer);
        const text = draftsRef.current[beatId];
        if (text != null) {
          mutateTextRef.current({ id: beatId, text, content: pendingContent[beatId] });
        }
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

  const setComments = useMutation(
    trpc.beat.setComments.mutationOptions({
      onMutate: async ({ id, comments }) => {
        await queryClient.cancelQueries({ queryKey: beatsKey });
        const prev = queryClient.getQueryData(beatsKey);
        queryClient.setQueryData(beatsKey, (old) =>
          old?.map((b) => (b.id === id ? { ...b, comments } : b)),
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

  // Variant swaps replace the beat's text, so any in-flight draft must land
  // first and the local draft must be dropped or it would shadow the swap.
  function flushDraft(beatId: string) {
    const timer = timers.current[beatId];
    if (timer) {
      clearTimeout(timer);
      delete timers.current[beatId];
      const text = drafts[beatId];
      if (text != null) {
        updateText.mutate({ id: beatId, text, content: contentDrafts.current[beatId] });
      }
    }
    setDrafts((d) => {
      const next = { ...d };
      delete next[beatId];
      return next;
    });
    delete contentDrafts.current[beatId];
  }

  const variantOpts = {
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: beatsKey }),
    onError: (e: { message: string }) => toast.error(e.message),
  };
  const addVariant = useMutation(trpc.beat.addVariant.mutationOptions(variantOpts));
  const switchVariant = useMutation(trpc.beat.switchVariant.mutationOptions(variantOpts));
  const deleteVariant = useMutation(trpc.beat.deleteVariant.mutationOptions(variantOpts));

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

  const voice = resolveVoice(voices, voiceURI);

  function stopListening() {
    stopSpeech();
    setPlaying(null);
  }

  function listen(target: "all" | TimedBeat) {
    const queue = target === "all" ? timed : [target];
    const ok = speakBeats(queue, voice, {
      onBeatStart: setActiveId,
      onDone: () => setPlaying(null),
    });
    if (!ok) {
      toast.info("Nothing to read yet");
      return;
    }
    setPlaying(target === "all" ? "all" : target.id);
  }

  // Deleting a shot also strips its mark from the beat's prose. The cache is
  // patched first so the remounted editor reads the stripped content.
  function removeShot(beatId: string, shotId: string) {
    const beat = timed.find((b) => b.id === beatId);
    if (!beat) return;
    setBroll.mutate({ id: beatId, broll: beat.broll.filter((s) => s.id !== shotId) });

    const latest = (contentDrafts.current[beatId] ??
      beats?.find((b) => b.id === beatId)?.content) as Value | null;
    if (!latest || !hasShotMark(latest, shotId)) return;
    clearTimeout(timers.current[beatId]);
    delete timers.current[beatId];
    const stripped = stripShotMark(latest, shotId);
    const text = drafts[beatId] ?? beat.text;
    contentDrafts.current[beatId] = stripped;
    queryClient.setQueryData(beatsKey, (old) =>
      old?.map((b) => (b.id === beatId ? { ...b, text, content: stripped } : b)),
    );
    updateText.mutate(
      { id: beatId, text, content: stripped },
      { onError: (e) => toast.error(e.message) },
    );
    setContentRevs((r) => ({ ...r, [beatId]: (r[beatId] ?? 0) + 1 }));
  }

  // Deleting a comment also strips its highlight from the beat's prose, mirroring
  // removeShot: patch the cache first so the remounted editor drops the mark.
  function removeComment(beatId: string, commentId: string) {
    const beat = timed.find((b) => b.id === beatId);
    if (!beat) return;
    setComments.mutate({
      id: beatId,
      comments: beat.comments.filter((c) => c.id !== commentId),
    });

    const latest = (contentDrafts.current[beatId] ??
      beats?.find((b) => b.id === beatId)?.content) as Value | null;
    if (!latest || !commentMarkIds(latest).includes(commentId)) return;
    clearTimeout(timers.current[beatId]);
    delete timers.current[beatId];
    const stripped = stripCommentMark(latest, commentId);
    const text = drafts[beatId] ?? beat.text;
    contentDrafts.current[beatId] = stripped;
    queryClient.setQueryData(beatsKey, (old) =>
      old?.map((b) => (b.id === beatId ? { ...b, text, content: stripped } : b)),
    );
    updateText.mutate(
      { id: beatId, text, content: stripped },
      { onError: (e) => toast.error(e.message) },
    );
    setContentRevs((r) => ({ ...r, [beatId]: (r[beatId] ?? 0) + 1 }));
  }

  // Self-heal orphaned shot marks: a mark whose shot row is gone (a lost
  // broll write, or a variant snapshot resurrecting deleted shots) would
  // otherwise highlight forever with nothing in the list. Beats with a
  // pending draft are skipped — the draft would be clobbered.
  useEffect(() => {
    if (!beats) return;
    // Deferred so the reconciliation (cache patch + editor remount) happens
    // outside the render-triggering effect body.
    const task = setTimeout(() => {
      for (const beat of beats) {
        if (timers.current[beat.id] || draftsRef.current[beat.id] != null) continue;
        const content = beat.content as Value | null;
        if (!content) continue;
        const knownShots = new Set(beat.broll.map((s) => s.id));
        const knownComments = new Set(beat.comments.map((c) => c.id));
        const shotOrphans = shotMarkIds(content).filter((id) => !knownShots.has(id));
        const commentOrphans = commentMarkIds(content).filter((id) => !knownComments.has(id));
        if (shotOrphans.length === 0 && commentOrphans.length === 0) continue;
        let stripped = shotOrphans.reduce((v, id) => stripShotMark(v, id), content);
        stripped = commentOrphans.reduce((v, id) => stripCommentMark(v, id), stripped);
        queryClient.setQueryData(beatsKey, (old) =>
          old?.map((b) => (b.id === beat.id ? { ...b, content: stripped } : b)),
        );
        mutateTextRef.current(
          { id: beat.id, text: beat.text, content: stripped },
          { onError: (e) => toast.error(`Cleanup failed: ${e.message}`) },
        );
        setContentRevs((r) => ({ ...r, [beat.id]: (r[beat.id] ?? 0) + 1 }));
      }
    }, 0);
    return () => clearTimeout(task);
  }, [beats, beatsKey, queryClient]);

  if (!video || !beats) {
    return (
      <div className="flex h-full">
        <div className="w-[284px] border-r border-border p-5">
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
      {/* Animate the row height (0fr↔1fr) so toggling the timeline slides the
          columns below instead of snapping them. Timeline stays mounted so the
          collapse is smooth in both directions. */}
      <div
        className={cn(
          "grid shrink-0 transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          rails.timeline ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-b px-6 py-3">
            <Timeline
              beats={timed}
              customKinds={customKinds}
              activeId={activeId}
              totalSec={totalSec}
              onSelectBeat={setActiveId}
            />
          </div>
        </div>
      </div>
      <div className={cn("flex min-h-0 flex-1", dragging && "cursor-col-resize select-none")}>
        {rails.leftOpen && (
          <>
            <div className="flex shrink-0" style={{ width: rails.leftWidth }}>
              <OutlineRail
                video={video}
                beats={timed}
                customKinds={customKinds}
                activeId={activeId}
                totalWords={totalWords}
                totalSec={totalSec}
                saving={pendingSaves > 0}
                onSelect={setActiveId}
                onReorder={(orderedIds) => reorder.mutate({ videoId, orderedIds })}
                onAddBeat={(kind: BeatKind) =>
                  createBeat.mutate({
                    videoId,
                    kind,
                    label: resolveBeatMeta(kind, customKinds).label,
                    afterPosition: activeBeat?.position ?? timed.length - 1,
                  })
                }
                onCustomize={() => setKindsOpen(true)}
              />
            </div>
            <RailResizeHandle
              active={dragging === "left"}
              onPointerDown={(e) => startRailResize(e, "left")}
            />
          </>
        )}

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[700px] px-8 pb-24 pt-10">
            <div className="mb-2 flex items-center justify-between">
              <p className="mono-label">Script</p>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={rails.leftOpen ? "Hide outline" : "Show outline"}
                  aria-pressed={!rails.leftOpen}
                  className="active:scale-[0.97]"
                  onClick={() => setRails({ leftOpen: !rails.leftOpen })}
                >
                  {rails.leftOpen ? (
                    <PanelLeftClose className="size-4" />
                  ) : (
                    <PanelLeftOpen className="size-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={rails.rightOpen ? "Hide panel" : "Show panel"}
                  aria-pressed={!rails.rightOpen}
                  className="mr-0.5 active:scale-[0.97]"
                  onClick={() => setRails({ rightOpen: !rails.rightOpen })}
                >
                  {rails.rightOpen ? (
                    <PanelRightClose className="size-4" />
                  ) : (
                    <PanelRightOpen className="size-4" />
                  )}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  aria-pressed={rails.timeline}
                  className={cn(
                    "rounded-full active:scale-[0.97]",
                    rails.timeline && "bg-accent ring-1 ring-ring/30",
                  )}
                  onClick={() => setRails({ timeline: !rails.timeline })}
                >
                  <Film className="size-3.5" /> Timeline
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full active:scale-[0.97]"
                  onClick={() => {
                    if (totalWords === 0) {
                      toast.info("Nothing to read yet");
                      return;
                    }
                    stopListening();
                    setPrompterOpen(true);
                  }}
                >
                  <Clapperboard className="size-3.5" /> Record
                </Button>
                <ListenControls
                  playing={playing === "all"}
                  voices={voices}
                  voiceURI={voiceURI}
                  onVoiceChange={(uri) => {
                    setVoiceURI(uri);
                    savePreferredVoiceURI(uri);
                  }}
                  onListen={() => listen("all")}
                  onStop={stopListening}
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold leading-tight">{video.title}</h1>
            <p className="mt-2 font-mono text-[12px] text-muted-foreground">
              {timed.length} beats · {totalWords} words · {formatDuration(totalSec)}
            </p>

            <div className="mt-8 flex flex-col gap-4">
              {timed.map((beat) => (
                <div key={beat.id} data-beat-id={beat.id} className="scroll-mt-6">
                <BeatBlock
                  key={`${beat.id}:${beat.activeVariantId ?? "base"}:${contentRevs[beat.id] ?? 0}`}
                  beat={beat}
                  customKinds={customKinds}
                  active={beat.id === activeId}
                  onActivate={() => setActiveId(beat.id)}
                  onChangeContent={({ value, text }) =>
                    scheduleContentSave(beat.id, text, value)
                  }
                  onChangeLabel={(label) => updateBeat.mutate({ id: beat.id, label })}
                  onChangeKind={(kind) => updateBeat.mutate({ id: beat.id, kind })}
                  onDelete={() => deleteBeat.mutate({ id: beat.id })}
                  onAddShot={(shotText, shotId) => {
                    setBroll.mutate({
                      id: beat.id,
                      broll: [
                        ...beat.broll,
                        { id: shotId, text: "", quote: shotText.slice(0, 140), done: false },
                      ],
                    });
                    setFocusShotId(shotId);
                  }}
                  onAddComment={(quote, commentId) => {
                    setComments.mutate({
                      id: beat.id,
                      comments: [
                        ...beat.comments,
                        { id: commentId, body: "", quote: quote.slice(0, 140), resolved: false },
                      ],
                    });
                    setFocusCommentId(commentId);
                  }}
                  onAddVariant={() => {
                    flushDraft(beat.id);
                    addVariant.mutate({ id: beat.id });
                  }}
                  onSwitchVariant={(variantId) => {
                    flushDraft(beat.id);
                    switchVariant.mutate({ id: beat.id, variantId });
                  }}
                  onDeleteVariant={(variantId) => {
                    flushDraft(beat.id);
                    deleteVariant.mutate({ id: beat.id, variantId });
                  }}
                  playing={playing === beat.id}
                  onToggleListen={() =>
                    playing === beat.id ? stopListening() : listen(beat)
                  }
                />
                </div>
              ))}
            </div>
          </div>
        </main>

        {rails.rightOpen && (
          <>
            <RailResizeHandle
              active={dragging === "right"}
              onPointerDown={(e) => startRailResize(e, "right")}
            />
            <div className="flex shrink-0" style={{ width: rails.rightWidth }}>
              <CoachPanel
                beats={timed}
                customKinds={customKinds}
                activeBeat={activeBeat}
                onSelectBeat={setActiveId}
                onSetBroll={(beatId: string, broll: BrollItem[]) =>
                  setBroll.mutate({ id: beatId, broll })
                }
                onRemoveShot={removeShot}
                onSetComments={(beatId: string, comments: CommentItem[]) =>
                  setComments.mutate({ id: beatId, comments })
                }
                onRemoveComment={removeComment}
                focusShotId={focusShotId}
                onFocusShotHandled={() => setFocusShotId(null)}
                focusCommentId={focusCommentId}
                onFocusCommentHandled={() => setFocusCommentId(null)}
              >
                <ResearchRail videoId={videoId} />
              </CoachPanel>
            </div>
          </>
        )}
      </div>

      <ManageKindsDialog open={kindsOpen} onOpenChange={setKindsOpen} customKinds={customKinds} />

      {prompterOpen && (
        <Prompter
          title={video.title}
          beats={timed}
          customKinds={customKinds}
          totalSec={totalSec}
          onClose={() => setPrompterOpen(false)}
        />
      )}
    </div>
  );
}

/** Invisible 8px strip straddling a rail border; shows an accent line on
 *  hover/drag. touch-none keeps pointer capture stable while dragging. */
function RailResizeHandle({
  active,
  onPointerDown,
}: {
  active: boolean;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      onPointerDown={onPointerDown}
      className={cn(
        "relative z-10 -mx-1 w-2 shrink-0 cursor-col-resize touch-none",
        "after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] after:-translate-x-1/2 after:rounded-full after:bg-ring after:opacity-0 after:transition-opacity after:duration-150 hover:after:opacity-60",
        active && "after:opacity-100",
      )}
    />
  );
}
