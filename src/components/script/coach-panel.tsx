"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

import { PacingBar, type TimedBeat } from "@/components/script/pacing-bar";
import { RailSection } from "@/components/script/rail-section";
import { Checkbox } from "@/components/ui/checkbox";
import { resolveBeatMeta, type CustomBeatKind } from "@/lib/beats";
import type { BrollItem, CommentItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const shotMarkEls = (shotId: string) =>
  Array.from(document.querySelectorAll<HTMLElement>(`[data-shot-id="${shotId}"]`));

const commentMarkEls = (commentId: string) =>
  Array.from(document.querySelectorAll<HTMLElement>(`[data-comment-id="${commentId}"]`));

export function CoachPanel({
  beats,
  customKinds,
  activeBeat,
  onSelectBeat,
  onSetBroll,
  onRemoveShot,
  onSetComments,
  onRemoveComment,
  focusShotId,
  onFocusShotHandled,
  focusCommentId,
  onFocusCommentHandled,
  children,
}: {
  beats: TimedBeat[];
  customKinds: CustomBeatKind[];
  activeBeat: TimedBeat | null;
  onSelectBeat: (id: string) => void;
  onSetBroll: (beatId: string, broll: BrollItem[]) => void;
  onRemoveShot: (beatId: string, shotId: string) => void;
  onSetComments: (beatId: string, comments: CommentItem[]) => void;
  onRemoveComment: (beatId: string, commentId: string) => void;
  focusShotId?: string | null;
  onFocusShotHandled?: () => void;
  focusCommentId?: string | null;
  onFocusCommentHandled?: () => void;
  children?: React.ReactNode;
}) {
  const [newShot, setNewShot] = useState("");
  const total = beats.reduce((a, b) => a + b.sec, 0) || 1;
  const meta = activeBeat ? resolveBeatMeta(activeBeat.kind, customKinds) : null;

  function addShot() {
    if (!activeBeat || !newShot.trim()) return;
    onSetBroll(activeBeat.id, [
      ...activeBeat.broll,
      { id: crypto.randomUUID(), text: newShot.trim(), done: false },
    ]);
    setNewShot("");
  }

  return (
    <aside className="flex w-full shrink-0 flex-col gap-6 overflow-y-auto border-l p-5">
      <section>
        <p className="mono-label mb-3">Pacing</p>
        <PacingBar
          beats={beats}
          customKinds={customKinds}
          activeId={activeBeat?.id ?? null}
          onSelect={onSelectBeat}
        />
        {activeBeat && meta && (
          <p className="mt-2 text-[13px] text-muted-foreground">
            <span className="font-medium" style={meta.textStyle}>
              {activeBeat.label}
            </span>{" "}
            <span className="font-mono">
              · {Math.round((activeBeat.sec / total) * 100)}% of runtime
            </span>
          </p>
        )}
      </section>

      {activeBeat && (
        <RailSection title="B-roll & shots" count={activeBeat.broll.length}>
          <ul className="flex flex-col gap-1">
            {activeBeat.broll.map((shot) => (
              <ShotRow
                key={shot.id}
                shot={shot}
                beatId={activeBeat.id}
                autoFocus={focusShotId === shot.id}
                onFocusHandled={onFocusShotHandled}
                onRename={(text) =>
                  onSetBroll(
                    activeBeat.id,
                    activeBeat.broll.map((s) => (s.id === shot.id ? { ...s, text } : s)),
                  )
                }
                onToggle={(done) =>
                  onSetBroll(
                    activeBeat.id,
                    activeBeat.broll.map((s) => (s.id === shot.id ? { ...s, done } : s)),
                  )
                }
                onRemove={() => onRemoveShot(activeBeat.id, shot.id)}
              />
            ))}
          </ul>
          <div className="flex items-center gap-2 px-2">
            <Plus className="size-3.5 text-muted-foreground" />
            <input
              value={newShot}
              onChange={(e) => setNewShot(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addShot()}
              placeholder="Add a shot…"
              className="w-full bg-transparent py-1 text-[13px] outline-none placeholder:text-muted-foreground"
            />
          </div>
        </RailSection>
      )}

      {activeBeat && (
        <RailSection title="Comments" count={activeBeat.comments.length}>
          {activeBeat.comments.length === 0 ? (
            <p className="px-2 text-[12px] leading-relaxed text-muted-foreground">
              Select a passage in the script and hit Comment to leave a review note
              without rewriting.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {activeBeat.comments.map((comment) => (
                <CommentRow
                  key={comment.id}
                  comment={comment}
                  autoFocus={focusCommentId === comment.id}
                  onFocusHandled={onFocusCommentHandled}
                  onChangeBody={(body) =>
                    onSetComments(
                      activeBeat.id,
                      activeBeat.comments.map((c) =>
                        c.id === comment.id ? { ...c, body } : c,
                      ),
                    )
                  }
                  onToggleResolved={(resolved) =>
                    onSetComments(
                      activeBeat.id,
                      activeBeat.comments.map((c) =>
                        c.id === comment.id ? { ...c, resolved } : c,
                      ),
                    )
                  }
                  onRemove={() => onRemoveComment(activeBeat.id, comment.id)}
                />
              ))}
            </ul>
          )}
        </RailSection>
      )}

      {children}
    </aside>
  );
}

function ShotRow({
  shot,
  beatId,
  autoFocus,
  onFocusHandled,
  onRename,
  onToggle,
  onRemove,
}: {
  shot: BrollItem;
  beatId: string;
  autoFocus: boolean;
  onFocusHandled?: () => void;
  onRename: (text: string) => void;
  onToggle: (done: boolean) => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <li
      className="group flex items-start gap-3 rounded-lg px-2 py-1.5 hover:bg-accent"
      onMouseEnter={() =>
        shotMarkEls(shot.id).forEach((el) => el.classList.add("shot-mark-hot"))
      }
      onMouseLeave={() =>
        shotMarkEls(shot.id).forEach((el) => el.classList.remove("shot-mark-hot"))
      }
    >
      <Checkbox
        className="mt-0.5"
        checked={shot.done}
        onCheckedChange={(checked) => onToggle(checked === true)}
      />
      <div className="min-w-0 flex-1">
        <input
          aria-label="Shot description"
          // Focus moves here right after "add shot", by design.
          autoFocus={autoFocus}
          value={draft ?? shot.text}
          placeholder="Describe this shot…"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (draft !== null && draft.trim() !== shot.text) onRename(draft.trim());
            setDraft(null);
            onFocusHandled?.();
          }}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className={cn(
            "w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/70",
            shot.done && "text-muted-foreground line-through",
          )}
        />
        {shot.quote && (
          <button
            title="Jump to these words in the script"
            onClick={() => {
              // A lost mark still jumps to the beat itself.
              const target =
                shotMarkEls(shot.id)[0] ??
                document.querySelector(`[data-beat-id="${beatId}"]`);
              target?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            className="mt-0.5 block max-w-full truncate text-left text-[11px] italic text-muted-foreground transition-colors hover:text-foreground"
          >
            “{shot.quote}”
          </button>
        )}
      </div>
      <button
        aria-label="Remove shot"
        className="mt-1 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={onRemove}
      >
        <X className="size-3.5 text-muted-foreground hover:text-foreground" />
      </button>
    </li>
  );
}

function CommentRow({
  comment,
  autoFocus,
  onFocusHandled,
  onChangeBody,
  onToggleResolved,
  onRemove,
}: {
  comment: CommentItem;
  autoFocus: boolean;
  onFocusHandled?: () => void;
  onChangeBody: (body: string) => void;
  onToggleResolved: (resolved: boolean) => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <li
      className="group flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-accent"
      onMouseEnter={() =>
        commentMarkEls(comment.id).forEach((el) => el.classList.add("comment-mark-hot"))
      }
      onMouseLeave={() =>
        commentMarkEls(comment.id).forEach((el) => el.classList.remove("comment-mark-hot"))
      }
    >
      <Checkbox
        className="mt-0.5"
        checked={comment.resolved}
        onCheckedChange={(checked) => onToggleResolved(checked === true)}
        aria-label="Resolve comment"
      />
      <div className="min-w-0 flex-1">
        {comment.quote && (
          <button
            title="Jump to the highlighted words"
            onClick={() =>
              commentMarkEls(comment.id)[0]?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              })
            }
            className="mb-0.5 block max-w-full truncate text-left text-[11px] italic text-muted-foreground transition-colors hover:text-foreground"
          >
            “{comment.quote}”
          </button>
        )}
        <textarea
          aria-label="Comment"
          autoFocus={autoFocus}
          value={draft ?? comment.body}
          placeholder="Add a note…"
          rows={2}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (draft !== null && draft.trim() !== comment.body) onChangeBody(draft.trim());
            setDraft(null);
            onFocusHandled?.();
          }}
          className={cn(
            "w-full resize-none bg-transparent text-[13px] leading-snug outline-none field-sizing-content placeholder:text-muted-foreground/70",
            comment.resolved && "text-muted-foreground line-through",
          )}
        />
      </div>
      <button
        aria-label="Delete comment"
        className="mt-0.5 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={onRemove}
      >
        <X className="size-3.5 text-muted-foreground hover:text-foreground" />
      </button>
    </li>
  );
}
