"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight,
  ExternalLink,
  FileText,
  PanelRight,
  Play,
  Plus,
  X,
} from "lucide-react";
import type { Value } from "platejs";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { DocEditor } from "@/components/script/doc-editor";
import { RailSection } from "@/components/script/rail-section";
import { Input } from "@/components/ui/input";
import { useEditorPrefs } from "@/lib/editor-prefs";
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
  const [{ rightWidth }] = useEditorPrefs();
  const researchKey = trpc.research.byVideo.queryKey({ videoId });
  const { data } = useQuery(trpc.research.byVideo.queryOptions({ videoId }));
  const notes = data?.notes ?? [];
  const references = data?.references ?? [];

  const [openId, setOpenId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
        setExpandedId((id) => (id === res.id ? null : id));
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

  const expandedNote = notes.find((n) => n.id === expandedId) ?? null;

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
            expanded={expandedId === note.id}
            initialContent={contentFor(note)}
            onToggle={() => setOpenId((id) => (id === note.id ? null : note.id))}
            onExpand={() => setExpandedId(note.id)}
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

      <ResearchPageSidePanel
        note={expandedNote}
        initialContent={expandedNote ? contentFor(expandedNote) : EMPTY_DOC}
        width={rightWidth}
        onClose={() => setExpandedId(null)}
        onRename={(title) => expandedNote && renameNote(expandedNote.id, title)}
        onChange={(value) => expandedNote && scheduleSave(expandedNote.id, value)}
      />
    </>
  );
}

function NotePage({
  note,
  open,
  expanded,
  initialContent,
  onToggle,
  onExpand,
  onRename,
  onDelete,
  onChange,
}: {
  note: Note;
  open: boolean;
  expanded: boolean;
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
            aria-label={`Open ${note.title} in side panel`}
            onClick={onExpand}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <PanelRight className="size-3.5" />
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
          {expanded ? (
            <p className="py-1 text-[12px] text-muted-foreground">
              Open in the side panel…
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

/** A full-height reference panel docked to the right edge, sized to the
 *  research sidebar. Deliberately non-modal: no backdrop, no focus trap, so
 *  the script stays visible and editable while a note is open beside it. */
function ResearchPageSidePanel({
  note,
  initialContent,
  width,
  onClose,
  onRename,
  onChange,
}: {
  note: Note | null;
  initialContent: Value;
  width: number;
  onClose: () => void;
  onRename: (title: string) => void;
  onChange: (value: Value) => void;
}) {
  const open = note !== null;
  // Retain the last note (and its content) through the slide-out so the panel
  // animates away with content instead of an empty box. Adjusting state during
  // render is React's supported way to remember a previous prop; keyed by id so
  // cache patches while typing (new note object, same id) don't churn.
  const [shown, setShown] = useState(note);
  const [shownContent, setShownContent] = useState(initialContent);
  if (note && note.id !== shown?.id) {
    setShown(note);
    setShownContent(initialContent);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      role="dialog"
      aria-modal={false}
      aria-hidden={!open}
      className={cn(
        "fixed inset-y-0 right-0 z-40 flex flex-col border-l bg-card shadow-2xl",
        "transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
        open ? "translate-x-0" : "pointer-events-none translate-x-full",
      )}
      style={{ width }}
    >
      {shown && (
        <ResearchPanelBody
          key={shown.id}
          note={shown}
          content={shownContent}
          onClose={onClose}
          onRename={onRename}
          onChange={onChange}
        />
      )}
    </div>
  );
}

function ResearchPanelBody({
  note,
  content,
  onClose,
  onRename,
  onChange,
}: {
  note: Note;
  content: Value;
  onClose: () => void;
  onRename: (title: string) => void;
  onChange: (value: Value) => void;
}) {
  const [title, setTitle] = useState<string | null>(null);

  return (
    <>
      <header className="flex h-11 shrink-0 items-center gap-2 border-b pl-3 pr-2">
        <FileText className="size-4 shrink-0 text-muted-foreground" />
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
          className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold outline-none placeholder:text-muted-foreground/50"
        />
        <button
          aria-label="Close panel"
          onClick={onClose}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:scale-95"
        >
          <X className="size-4" />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <DocEditor initialValue={content} placeholder="Start writing…" onChange={onChange} />
      </div>
    </>
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
