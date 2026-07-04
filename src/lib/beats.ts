import type { CSSProperties } from "react";

export const BEAT_KINDS = ["hook", "rehook", "body", "conclusion"] as const;

export type BuiltinBeatKind = (typeof BEAT_KINDS)[number];
export type BeatKind = string;

export interface CustomBeatKind {
  id: string;
  name: string;
  color: string;
  guide: string | null;
}

/** Style objects, not classes — Tailwind can't statically extract user-chosen colors. */
export interface ResolvedBeatMeta {
  label: string;
  color: string;
  dotStyle: CSSProperties;
  tagStyle: CSSProperties;
  barStyle: CSSProperties;
  textStyle: CSSProperties;
  guide: string;
}

const BUILTIN_META: Record<BuiltinBeatKind, { label: string; color: string; guide: string }> = {
  hook: {
    label: "Hook",
    color: "var(--beat-hook)",
    guide: "One line. State the promise and the stakes.",
  },
  rehook: {
    label: "Re-hook",
    color: "var(--beat-rehook)",
    guide: "Re-tease the payoff so nobody bails.",
  },
  body: {
    label: "Body",
    color: "var(--beat-body)",
    guide: "Give value first. One idea per beat, shown on screen.",
  },
  conclusion: {
    label: "Conclusion",
    color: "var(--beat-conclusion)",
    guide: "Honest reflection + a hook into the next video.",
  },
};

function metaFrom(label: string, color: string, guide: string): ResolvedBeatMeta {
  return {
    label,
    color,
    dotStyle: { backgroundColor: color },
    tagStyle: {
      backgroundColor: `color-mix(in oklab, ${color} 16%, transparent)`,
      color,
    },
    barStyle: { borderLeftColor: color },
    textStyle: { color },
    guide,
  };
}

export function isBuiltinKind(kind: BeatKind): kind is BuiltinBeatKind {
  return (BEAT_KINDS as readonly string[]).includes(kind);
}

export function resolveBeatMeta(
  kind: BeatKind,
  customKinds: CustomBeatKind[] = [],
): ResolvedBeatMeta {
  if (isBuiltinKind(kind)) {
    const b = BUILTIN_META[kind];
    return metaFrom(b.label, b.color, b.guide);
  }
  const custom = customKinds.find((c) => c.id === kind);
  // A deleted custom kind falls back to Body so old beats keep rendering.
  if (!custom) return metaFrom(BUILTIN_META.body.label, BUILTIN_META.body.color, BUILTIN_META.body.guide);
  return metaFrom(custom.name, custom.color, custom.guide ?? BUILTIN_META.body.guide);
}

export const KIND_COLOR_CHOICES = [
  "#E5674B",
  "#E0A83B",
  "#2C9C86",
  "#7C6BD6",
  "#3E86C9",
  "#CE2E6C",
  "#D99A00",
  "#1E7D42",
  "#9AA4B2",
  "#E5484D",
];
