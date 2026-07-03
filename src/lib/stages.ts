export const STAGES = [
  "idea",
  "scripting",
  "recording",
  "editing",
  "packaging",
  "published",
] as const;

export type Stage = (typeof STAGES)[number];

interface StageMeta {
  label: string;
  /** Literal class strings so Tailwind can statically extract them. */
  dot: string;
  text: string;
  badge: string;
  cssVar: string;
}

export const STAGE_META: Record<Stage, StageMeta> = {
  idea: {
    label: "Idea",
    dot: "bg-stage-idea",
    text: "text-stage-idea",
    badge: "bg-stage-idea/15 text-stage-idea",
    cssVar: "var(--stage-idea)",
  },
  scripting: {
    label: "Scripting",
    dot: "bg-stage-scripting",
    text: "text-stage-scripting",
    badge: "bg-stage-scripting/15 text-stage-scripting",
    cssVar: "var(--stage-scripting)",
  },
  recording: {
    label: "Recording",
    dot: "bg-stage-recording",
    text: "text-stage-recording",
    badge: "bg-stage-recording/15 text-stage-recording",
    cssVar: "var(--stage-recording)",
  },
  editing: {
    label: "Editing",
    dot: "bg-stage-editing",
    text: "text-stage-editing",
    badge: "bg-stage-editing/15 text-stage-editing",
    cssVar: "var(--stage-editing)",
  },
  packaging: {
    label: "Packaging",
    dot: "bg-stage-packaging",
    text: "text-stage-packaging",
    badge: "bg-stage-packaging/15 text-stage-packaging",
    cssVar: "var(--stage-packaging)",
  },
  published: {
    label: "Published",
    dot: "bg-stage-published",
    text: "text-stage-published",
    badge: "bg-stage-published/15 text-stage-published",
    cssVar: "var(--stage-published)",
  },
};

export function stageIndex(stage: Stage): number {
  return STAGES.indexOf(stage);
}

/** Filter chips: "all" + each stage, labels per the design handoff. */
export const FILTERS = [
  { key: "all", label: "All" },
  { key: "idea", label: "Ideas" },
  { key: "scripting", label: "Scripting" },
  { key: "recording", label: "Recording" },
  { key: "editing", label: "Editing" },
  { key: "packaging", label: "Packaging" },
  { key: "published", label: "Published" },
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
