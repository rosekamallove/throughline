"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, ExternalLink, Play, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { RouterOutputs } from "@/trpc/types";
import { useTRPC } from "@/trpc/client";

type Note = RouterOutputs["research"]["byVideo"]["notes"][number];
type Reference = RouterOutputs["research"]["byVideo"]["references"][number];

export function youtubeIdFromUrl(url: string): string | null {
  const m =
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/.exec(url);
  return m?.[1] ?? null;
}

export function ResearchPanel({ videoId }: { videoId: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data } = useQuery({
    ...trpc.research.byVideo.queryOptions({ videoId }),
    enabled: open,
  });

  const invalidate = () =>
    void queryClient.invalidateQueries({
      queryKey: trpc.research.byVideo.queryKey({ videoId }),
    });
  const opts = { onSuccess: invalidate, onError: (e: { message: string }) => toast.error(e.message) };

  const noteAdd = useMutation(trpc.research.noteAdd.mutationOptions(opts));
  const noteUpdate = useMutation(trpc.research.noteUpdate.mutationOptions(opts));
  const noteDelete = useMutation(trpc.research.noteDelete.mutationOptions(opts));
  const refAdd = useMutation(trpc.research.refAdd.mutationOptions(opts));
  const refDelete = useMutation(trpc.research.refDelete.mutationOptions(opts));

  return (
    <>
      <Button
        variant={open ? "default" : "secondary"}
        size="sm"
        className="fixed bottom-5 right-5 z-40 rounded-full shadow-lg"
        onClick={() => setOpen((o) => !o)}
      >
        <BookOpen className="size-4" /> Research
      </Button>

      {open && (
        <div className="fixed bottom-16 right-5 z-40 flex max-h-[70vh] w-[380px] flex-col rounded-2xl border bg-popover shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-2.5">
            <p className="text-sm font-semibold">Research</p>
            <button
              aria-label="Close research"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          <Tabs defaultValue="notes" className="flex min-h-0 flex-1 flex-col">
            <TabsList className="mx-4 mt-3">
              <TabsTrigger value="notes" className="flex-1">
                Notes {data?.notes.length ? `· ${data.notes.length}` : ""}
              </TabsTrigger>
              <TabsTrigger value="refs" className="flex-1">
                References {data?.references.length ? `· ${data.references.length}` : ""}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notes" className="min-h-0 flex-1">
              <ScrollArea className="h-full max-h-[52vh]">
                <div className="flex flex-col gap-3 p-4">
                  {(data?.notes ?? []).map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onUpdate={(fields) => noteUpdate.mutate({ id: note.id, ...fields })}
                      onDelete={() => noteDelete.mutate({ id: note.id })}
                    />
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => noteAdd.mutate({ videoId })}
                  >
                    <Plus className="size-4" /> New list
                  </Button>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="refs" className="min-h-0 flex-1">
              <ScrollArea className="h-full max-h-[52vh]">
                <div className="flex flex-col gap-3 p-4">
                  <AddReference
                    onAdd={(url, title) => refAdd.mutate({ videoId, url, title })}
                  />
                  {(data?.references ?? []).map((ref) => (
                    <ReferenceCard
                      key={ref.id}
                      reference={ref}
                      onDelete={() => refDelete.mutate({ id: ref.id })}
                    />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </>
  );
}

function NoteCard({
  note,
  onUpdate,
  onDelete,
}: {
  note: Note;
  onUpdate: (fields: { title?: string; items?: string[] }) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  return (
    <div className="group rounded-xl border bg-card p-3">
      <div className="flex items-center gap-2">
        <input
          value={title ?? note.title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            if (title !== null && title.trim() && title !== note.title) {
              onUpdate({ title: title.trim() });
            }
            setTitle(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold outline-none"
        />
        <button
          aria-label="Delete list"
          onClick={onDelete}
          className="opacity-0 transition-opacity group-hover:opacity-100"
        >
          <X className="size-3.5 text-muted-foreground hover:text-foreground" />
        </button>
      </div>
      <ul className="mt-1.5 flex flex-col gap-1">
        {note.items.map((item, i) => (
          <li key={i} className="group/item flex items-start gap-2 text-[13px]">
            <span className="mt-[7px] size-1 shrink-0 rounded-full bg-muted-foreground" />
            <span className="min-w-0 flex-1 leading-snug">{item}</span>
            <button
              aria-label="Remove point"
              onClick={() => onUpdate({ items: note.items.filter((_, j) => j !== i) })}
              className="opacity-0 transition-opacity group-hover/item:opacity-100"
            >
              <X className="size-3 text-muted-foreground hover:text-foreground" />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-1 flex items-center gap-2">
        <Plus className="size-3 text-muted-foreground" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) {
              onUpdate({ items: [...note.items, draft.trim()] });
              setDraft("");
            }
          }}
          placeholder="Add a point…"
          className="w-full bg-transparent py-0.5 text-[13px] outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}

function AddReference({ onAdd }: { onAdd: (url: string, title?: string) => void }) {
  const [url, setUrl] = useState("");

  function submit() {
    const trimmed = url.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed);
    } catch {
      toast.error("That doesn't look like a URL");
      return;
    }
    onAdd(trimmed);
    setUrl("");
  }

  return (
    <Input
      value={url}
      onChange={(e) => setUrl(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && submit()}
      placeholder="Paste a YouTube or article URL…"
      className="h-9"
    />
  );
}

function ReferenceCard({
  reference,
  onDelete,
}: {
  reference: Reference;
  onDelete: () => void;
}) {
  const [playing, setPlaying] = useState(false);
  const ytId = reference.kind === "youtube" ? youtubeIdFromUrl(reference.url) : null;

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card">
      {ytId ? (
        playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1`}
            title={reference.title || "YouTube reference"}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="aspect-video w-full"
          />
        ) : (
          <button onClick={() => setPlaying(true)} className="relative block w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${ytId}/mqdefault.jpg`}
              alt={reference.title || "YouTube reference"}
              className="aspect-video w-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors hover:bg-black/40">
              <span className="flex size-11 items-center justify-center rounded-full bg-black/70">
                <Play className="size-5 fill-white text-white" />
              </span>
            </span>
          </button>
        )
      ) : null}
      <div className={cn("flex items-center gap-2 px-3 py-2", !ytId && "py-2.5")}>
        <a
          href={reference.url}
          target="_blank"
          rel="noreferrer"
          className="min-w-0 flex-1 truncate text-[13px] hover:underline"
        >
          {reference.title || reference.url.replace(/^https?:\/\/(www\.)?/, "")}
        </a>
        <a href={reference.url} target="_blank" rel="noreferrer" aria-label="Open link">
          <ExternalLink className="size-3.5 text-muted-foreground hover:text-foreground" />
        </a>
        <button
          aria-label="Remove reference"
          onClick={onDelete}
          className="opacity-0 transition-opacity group-hover:opacity-100"
        >
          <X className="size-3.5 text-muted-foreground hover:text-foreground" />
        </button>
      </div>
    </div>
  );
}
