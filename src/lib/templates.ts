import type { BeatKind } from "./beats";

export interface TemplateBeat {
  kind: BeatKind;
  label: string;
  guide?: string;
}

export interface ScriptTemplate {
  id: string;
  name: string;
  description: string;
  beats: TemplateBeat[];
}

export const SCRIPT_TEMPLATES: ScriptTemplate[] = [
  {
    id: "classic-retention",
    name: "Classic Retention",
    description: "The house structure — hook hard, earn trust, re-hook, deliver in sections.",
    beats: [
      { kind: "hook", label: "Hook", guide: "One line. State the promise and the stakes." },
      { kind: "body", label: "Context & Authority", guide: "Earn the right to be heard. Why trust you on this?" },
      { kind: "rehook", label: "Re-hook", guide: "Re-tease the payoff so nobody bails." },
      { kind: "body", label: "Section 1", guide: "Concrete first step. Show it on screen." },
      { kind: "body", label: "Section 2", guide: "The meat. Give a repeatable system." },
      { kind: "body", label: "Section 3", guide: "The step everyone skips." },
      { kind: "conclusion", label: "Conclusion", guide: "Honest reflection + a hook into the next video." },
    ],
  },
  {
    id: "tutorial",
    name: "Tutorial / How-To",
    description: "Show the end result first, then walk it back step by step.",
    beats: [
      { kind: "hook", label: "Result demo", guide: "Show the finished thing in the first 15 seconds." },
      { kind: "body", label: "What you need", guide: "Prerequisites in one breath — don't lose beginners." },
      { kind: "body", label: "Step 1", guide: "The smallest possible win, fast." },
      { kind: "body", label: "Step 2", guide: "Build momentum. Show, don't tell." },
      { kind: "rehook", label: "The mistake everyone makes", guide: "Tease the pitfall before the hard part." },
      { kind: "body", label: "Step 3", guide: "The hard part — slow down here." },
      { kind: "body", label: "Recap", guide: "The whole flow in 20 seconds, sped up." },
      { kind: "conclusion", label: "CTA", guide: "What to build next + where to go from here." },
    ],
  },
  {
    id: "story",
    name: "Story-Driven",
    description: "Cold open, stakes, setback, climax — narrative arc over information.",
    beats: [
      { kind: "hook", label: "Cold open", guide: "Start mid-scene at the most dramatic moment." },
      { kind: "body", label: "The stakes", guide: "What was on the line? Make them feel it." },
      { kind: "body", label: "The journey begins", guide: "Set the scene fast — context in under 60s." },
      { kind: "rehook", label: "The setback", guide: "Everything goes wrong. Don't resolve it yet." },
      { kind: "body", label: "The turn", guide: "The insight or decision that changed the direction." },
      { kind: "body", label: "The climax", guide: "Return to the cold-open moment — now with context." },
      { kind: "conclusion", label: "The lesson", guide: "What it means for the viewer, not just you." },
    ],
  },
];
