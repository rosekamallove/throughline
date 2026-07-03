export const BEAT_KINDS = ["hook", "rehook", "body", "conclusion"] as const;

export type BeatKind = (typeof BEAT_KINDS)[number];

interface BeatKindMeta {
  label: string;
  /** Literal class strings so Tailwind can statically extract them. */
  dot: string;
  text: string;
  tag: string;
  bar: string;
  cssVar: string;
  /** Default coach guidance for new beats; the beat's `guide` column overrides it. */
  guide: string;
}

export const BEAT_META: Record<BeatKind, BeatKindMeta> = {
  hook: {
    label: "Hook",
    dot: "bg-beat-hook",
    text: "text-beat-hook",
    tag: "bg-beat-hook/20 text-beat-hook",
    bar: "border-beat-hook",
    cssVar: "var(--beat-hook)",
    guide: "One line. State the promise and the stakes.",
  },
  rehook: {
    label: "Re-hook",
    dot: "bg-beat-rehook",
    text: "text-beat-rehook",
    tag: "bg-beat-rehook/20 text-beat-rehook",
    bar: "border-beat-rehook",
    cssVar: "var(--beat-rehook)",
    guide: "Re-tease the payoff so nobody bails.",
  },
  body: {
    label: "Body",
    dot: "bg-beat-body",
    text: "text-beat-body",
    tag: "bg-beat-body/20 text-beat-body",
    bar: "border-beat-body",
    cssVar: "var(--beat-body)",
    guide: "Give value first. One idea per beat, shown on screen.",
  },
  conclusion: {
    label: "Conclusion",
    dot: "bg-beat-conclusion",
    text: "text-beat-conclusion",
    tag: "bg-beat-conclusion/20 text-beat-conclusion",
    bar: "border-beat-conclusion",
    cssVar: "var(--beat-conclusion)",
    guide: "Honest reflection + a hook into the next video.",
  },
};

/** Skeleton instantiated when a video enters scripting (and on create). */
export const DEFAULT_BEAT_SKELETON: { kind: BeatKind; label: string }[] = [
  { kind: "hook", label: "Hook" },
  { kind: "body", label: "Context & Authority" },
  { kind: "rehook", label: "Re-hook" },
  { kind: "body", label: "Section 1" },
  { kind: "conclusion", label: "Conclusion" },
];
