export const STAGES = [
  "ideation",
  "packaging",
  "scripting",
  "production",
  "scheduled",
  "published",
] as const;

export type Stage = (typeof STAGES)[number];

interface StageMeta {
  label: string;
  /** Compact label for tight spots (stepper, board column headers). */
  shortLabel: string;
  /** Literal class strings so Tailwind can statically extract them. */
  dot: string;
  text: string;
  badge: string;
  cssVar: string;
}

export const STAGE_META: Record<Stage, StageMeta> = {
  ideation: {
    label: "Ideation",
    shortLabel: "Ideation",
    dot: "bg-stage-idea",
    text: "text-stage-idea",
    badge: "bg-stage-idea/15 text-stage-idea",
    cssVar: "var(--stage-idea)",
  },
  packaging: {
    label: "Title & Thumbnail",
    shortLabel: "Packaging",
    dot: "bg-stage-packaging",
    text: "text-stage-packaging",
    badge: "bg-stage-packaging/15 text-stage-packaging",
    cssVar: "var(--stage-packaging)",
  },
  scripting: {
    label: "Scripting",
    shortLabel: "Scripting",
    dot: "bg-stage-scripting",
    text: "text-stage-scripting",
    badge: "bg-stage-scripting/15 text-stage-scripting",
    cssVar: "var(--stage-scripting)",
  },
  production: {
    label: "In Production",
    shortLabel: "Production",
    dot: "bg-stage-editing",
    text: "text-stage-editing",
    badge: "bg-stage-editing/15 text-stage-editing",
    cssVar: "var(--stage-editing)",
  },
  scheduled: {
    label: "Scheduled",
    shortLabel: "Scheduled",
    dot: "bg-stage-recording",
    text: "text-stage-recording",
    badge: "bg-stage-recording/15 text-stage-recording",
    cssVar: "var(--stage-recording)",
  },
  published: {
    label: "Published",
    shortLabel: "Published",
    dot: "bg-stage-published",
    text: "text-stage-published",
    badge: "bg-stage-published/15 text-stage-published",
    cssVar: "var(--stage-published)",
  },
};

export function stageIndex(stage: Stage): number {
  return STAGES.indexOf(stage);
}

/** Dashboard filters, in this exact order. "recent" is the default view. */
export const FILTERS = [
  { key: "recent", label: "Recent" },
  { key: "ideation", label: "Ideation" },
  { key: "packaging", label: "Title & Thumbnail" },
  { key: "scripting", label: "Scripting" },
  { key: "production", label: "In Production" },
  { key: "scheduled", label: "Scheduled" },
  { key: "published", label: "Published" },
  { key: "all", label: "All Videos" },
] as const;

export type FilterKey = (typeof FILTERS)[number]["key"];

/** Instantiated per video on creation (and by the seed). */
export const DEFAULT_CHECKLIST = [
  "Script locked",
  "Recorded",
  "Edit v1 done",
  "Thumbnail A/B picked",
  "Title finalized",
  "Scheduled",
] as const;
