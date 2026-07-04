"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight,
  ExternalLink,
  FileText,
  Maximize2,
  Play,
  Plus,
  X,
} from "lucide-react";
import type { Value } from "platejs";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { DocEditor } from "@/components/script/doc-editor";
import { RailSection } from "@/components/script/rail-section";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import type { RouterOutputs } from "@/trpc/types";

type Note = RouterOutputs["research"]["byVideo"]["notes"][number];
type Reference = RouterOutputs["research"]["byVideo"]["references"][number];

const AUTOSAVE_MS = 600;
const EMPTY_DOC: Value = [{ type: "p", children: [{ text: "" }] }];

export function youtubeIdFromUrl(url: string): string | null {
  const m =
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/.exec(url);
  return m?.[1] ?? null;
}

export function ResearchRail({ videoId }: { videoId: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const researchKey = trpc.research.byVideo.queryKey({ videoId });
  const { data } = useQuery(trpc.research.byVideo.queryOptions({ videoId }));
  const notes = data?.notes ?? [];
  const references = data?.references ?? [];

  const [openId, setOpenId] = useState<string | null>(null);
  const [modalId, setModalId] = useState<string | null>(null);

  // The query cache is the draft store: every keystroke patches the cached
  // note immediately (so remounts — expand/collapse, modal handoff — always
  // see the latest text) and only the server call is debounced. Nothing here
  // invalidates on save; a refetch mid-typing would clobber the caret.
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const noteUpdate = useMutation(trpc.research.noteUpdate.mutationOptions());

  const patchNote = (id: string, fields: Partial<Note>) => {
    queryClient.setQueryData(researchKey, (old) =>
      old
        ? { ...old, notes: old.notes.map((n) => (n.id === id ? { ...n, ...fields } : n)) }
        : old,
    );
  };

  function scheduleSave(noteId: string, content: Value) {
    patchNote(noteId, { content });
    clearTimeout(timers.current[noteId]);
    timers.current[noteId] = setTimeout(() => {
      delete timers.current[noteId];
      noteUpdate.mutate(
        { id: noteId, content },
        { onError: (e) => toast.error(`Autosave failed: ${e.message}`) },
      );
    }, AUTOSAVE_MS);
  }

  const mutateNoteRef = useRef(noteUpdate.mutate);
  useEffect(() => {
    mutateNoteRef.current = noteUpdate.mutate;
  }, [noteUpdate.mutate]);
  useEffect(() => {
    const pending = timers.current;
    return () => {
      const cached = queryClient.getQueryData(researchKey);
      for (const [noteId, timer] of Object.entries(pending)) {
        clearTimeout(timer);
        const content = cached?.notes.find((n) => n.id === noteId)?.content as
          | Value
          | undefined;
        if (content) mutateNoteRef.current({ id: noteId, content });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- flush once on unmount
  }, []);

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: researchKey });
  const mutationOpts = {
    onError: (e: { message: string }) => toast.error(e.message),
  };

  const noteAdd = useMutation(
    trpc.research.noteAdd.mutationOptions({
      ...mutationOpts,
      onSuccess: (created) => {
        queryClient.setQueryData(researchKey, (old) =>
          old ? { ...old, notes: [...old.notes, created] } : old,
        );
        setOpenId(created.id);
      },
    }),
  );
  const noteDelete = useMutation(
    trpc.research.noteDelete.mutationOptions({
      ...mutationOpts,
      onSuccess: (res) => {
        clearTimeout(timers.current[res.id]);
        delete timers.current[res.id];
        setOpenId((id) => (id === res.id ? null : id));
        setModalId((id) => (id === res.id ? null : id));
        invalidate();
      },
    }),
  );
  const refAdd = useMutation(
    trpc.research.refAdd.mutationOptions({ ...mutationOpts, onSuccess: invalidate }),
  );
  const refDelete = useMutation(
    trpc.research.refDelete.mutationOptions({ ...mutationOpts, onSuccess: invalidate }),
  );

  function renameNote(id: string, title: string) {
    patchNote(id, { title });
    noteUpdate.mutate({ id, title }, mutationOpts);
  }

  const contentFor = (note: Note): Value =>
    (note.content as Value | null) ?? EMPTY_DOC;

  const modalNote = notes.find((n) => n.id === modalId) ?? null;

  return (
    <>
      <RailSection
        title="Research"
        count={notes.length}
        onAdd={() => noteAdd.mutate({ videoId })}
        addLabel="New research page"
      >
        {notes.length === 0 && (
          <button
            onClick={() => noteAdd.mutate({ videoId })}
            className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
          >
            <Plus className="size-3.5" /> New page
          </button>
        )}
        {notes.map((note) => (
          <NotePage
            key={note.id}
            note={note}
            open={openId === note.id}
            inModal={modalId === note.id}
            initialContent={contentFor(note)}
            onToggle={() => setOpenId((id) => (id === note.id ? null : note.id))}
            onExpand={() => setModalId(note.id)}
            onRename={(title) => renameNote(note.id, title)}
            onDelete={() => noteDelete.mutate({ id: note.id })}
            onChange={(value) => scheduleSave(note.id, value)}
          />
        ))}
      </RailSection>

      <RailSection title="References" count={references.length}>
        <AddReference onAdd={(url) => refAdd.mutate({ videoId, url })} />
        {references.map((ref) => (
          <ReferenceCard
            key={ref.id}
            reference={ref}
            onDelete={() => refDelete.mutate({ id: ref.id })}
          />
        ))}
      </RailSection>

      <ResearchPageModal
        note={modalNote}
        initialContent={modalNote ? contentFor(modalNote) : EMPTY_DOC}
        onClose={() => setModalId(null)}
        onRename={(title) => modalNote && renameNote(modalNote.id, title)}
        onChange={(value) => modalNote && scheduleSave(modalNote.id, value)}
      />
    </>
  );
}

function NotePage({
  note,
  open,
  inModal,
  initialContent,
  onToggle,
  onExpand,
  onRename,
  onDelete,
  onChange,
}: {
  note: Note;
  open: boolean;
  inModal: boolean;
  initialContent: Value;
  onToggle: () => void;
  onExpand: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
  onChange: (value: Value) => void;
}) {
  const [title, setTitle] = useState<string | null>(null);

  return (
    <div className={cn("rounded-lg transition-colors", open && "border bg-card")}>
      <div
        className={cn(
          "group flex h-8 items-center gap-1.5 rounded-lg pl-1.5 pr-1",
          !open && "hover:bg-accent",
        )}
      >
        <button
          onClick={onToggle}
          aria-expanded={open}
          className={cn("flex min-w-0 items-center gap-1.5 py-1 text-left", !open && "flex-1")}
        >
          <ChevronRight
            className={cn(
              "size-3 shrink-0 text-muted-foreground transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
              open && "rotate-90",
            )}
          />
          <FileText className="size-3.5 shrink-0 text-muted-foreground" />
          {!open && <span className="truncate text-[13px]">{note.title}</span>}
        </button>
        {open && (
          <input
            aria-label="Page title"
            value={title ?? note.title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              if (title !== null && title.trim() && title !== note.title) {
                onRename(title.trim());
              }
              setTitle(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            className="min-w-0 flex-1 bg-transparent text-[13px] font-medium outline-none"
          />
        )}
        <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <button
            aria-label={`Expand ${note.title}`}
            onClick={onExpand}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Maximize2 className="size-3" />
          </button>
          <button
            aria-label={`Delete ${note.title}`}
            onClick={onDelete}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
      {open && (
        <div className="max-h-[300px] overflow-y-auto border-t px-3 py-2.5 duration-200 animate-in fade-in slide-in-from-top-1">
          {inModal ? (
            <p className="py-1 text-[12px] text-muted-foreground">
              Editing in the expanded view…
            </p>
          ) : (
            <DocEditor
              compact
              initialValue={initialContent}
              placeholder="Jot research here…"
              onChange={onChange}
            />
          )}
        </div>
      )}
    </div>
  );
}

function ResearchPageModal({
  note,
  initialContent,
  onClose,
  onRename,
  onChange,
}: {
  note: Note | null;
  initialContent: Value;
  onClose: () => void;
  onRename: (title: string) => void;
  onChange: (value: Value) => void;
}) {
  const [title, setTitle] = useState<string | null>(null);

  return (
    <Dialog open={note !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="flex h-[85svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {note && (
          <div key={note.id} className="min-h-0 flex-1 overflow-y-auto">
            <DialogHeader className="sr-only">
              <DialogTitle>{note.title}</DialogTitle>
              <DialogDescription>Research page</DialogDescription>
            </DialogHeader>
            <div className="px-10 pb-16 pt-8">
              <input
                aria-label="Page title"
                value={title ?? note.title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  if (title !== null && title.trim() && title !== note.title) {
                    onRename(title.trim());
                  }
                  setTitle(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                placeholder="Untitled"
                className="w-full bg-transparent text-3xl font-bold leading-tight outline-none placeholder:text-muted-foreground/50"
              />
              <div className="mt-3">
                <DocEditor
                  initialValue={initialContent}
                  placeholder="Start writing…"
                  onChange={onChange}
                />
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AddReference({ onAdd }: { onAdd: (url: string) => void }) {
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
      className="h-8 text-[13px]"
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
              <span className="flex size-10 items-center justify-center rounded-full bg-black/70">
                <Play className="size-4 fill-white text-white" />
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
