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
    id: "listicle",
    name: "Listicle",
    description: "N things, saving the best for last — with a mid-list re-hook.",
    beats: [
      { kind: "hook", label: "Hook", guide: "Why this list matters + tease #1 without revealing it." },
      { kind: "body", label: "Item 5", guide: "Strong opener — never start with the weakest." },
      { kind: "body", label: "Item 4", guide: "Keep pace. One idea, one example each." },
      { kind: "rehook", label: "Re-hook", guide: "\"The next one changed everything for me.\"" },
      { kind: "body", label: "Item 3", guide: "Personal story beats generic advice." },
      { kind: "body", label: "Item 2", guide: "The controversial one — invite comments." },
      { kind: "body", label: "Item 1", guide: "Pay off the hook. Deliver big." },
      { kind: "conclusion", label: "Conclusion", guide: "Which one would you try first? Drive comments." },
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
  {
    id: "case-study",
    name: "Case Study / Experiment",
    description: "\"I tried X for N days\" — result first, then the honest process.",
    beats: [
      { kind: "hook", label: "The result", guide: "Lead with the number. Then: how it happened." },
      { kind: "body", label: "Why this matters", guide: "Why you ran the experiment; why they should care." },
      { kind: "body", label: "The setup", guide: "Rules of the experiment — make it feel fair." },
      { kind: "rehook", label: "Re-hook", guide: "Tease the surprise: \"day 4 broke everything.\"" },
      { kind: "body", label: "The process", guide: "The messy middle. Honesty builds trust here." },
      { kind: "body", label: "The results", guide: "Real numbers, on screen, no rounding up." },
      { kind: "conclusion", label: "What I'd do differently", guide: "Honest reflection + next experiment tease." },
    ],
  },
  {
    id: "review",
    name: "Product Review",
    description: "What it is, what's great, the catch, the verdict.",
    beats: [
      { kind: "hook", label: "Hook", guide: "The one-line verdict, withheld: \"almost perfect, except…\"" },
      { kind: "body", label: "What it is", guide: "30 seconds max. Assume they half-know it." },
      { kind: "body", label: "The good", guide: "Best features with real usage, not spec sheets." },
      { kind: "rehook", label: "The catch", guide: "\"But there's one thing nobody tells you.\"" },
      { kind: "body", label: "The bad", guide: "Specific, fair criticism — this is why they trust you." },
      { kind: "body", label: "Who it's for", guide: "Name the exact person who should/shouldn't buy." },
      { kind: "conclusion", label: "Verdict", guide: "Clear recommendation + what you'd buy instead." },
    ],
  },
  {
    id: "comparison",
    name: "Comparison / VS",
    description: "Two contenders, three rounds, one winner.",
    beats: [
      { kind: "hook", label: "Hook", guide: "The matchup + what's at stake for the viewer's money." },
      { kind: "body", label: "The contenders", guide: "Quick intro of both — no winner signals yet." },
      { kind: "body", label: "Round 1", guide: "The everyday criterion (price, ease, speed)." },
      { kind: "body", label: "Round 2", guide: "The power-user criterion." },
      { kind: "rehook", label: "Re-hook", guide: "\"Round 3 completely flipped my pick.\"" },
      { kind: "body", label: "Round 3", guide: "The dealbreaker criterion." },
      { kind: "conclusion", label: "The winner", guide: "Pick one. Fence-sitting kills comparisons." },
    ],
  },
  {
    id: "explainer",
    name: "Deep-Dive Explainer",
    description: "One big question answered properly — documentary pacing.",
    beats: [
      { kind: "hook", label: "The question", guide: "Frame the mystery. Why is this weird/surprising?" },
      { kind: "body", label: "The obvious answer", guide: "What everyone assumes — set it up to knock down." },
      { kind: "rehook", label: "The twist", guide: "\"Except that's not what actually happens.\"" },
      { kind: "body", label: "The real mechanism", guide: "The core explanation. One metaphor, well used." },
      { kind: "body", label: "The evidence", guide: "Receipts: studies, examples, demonstrations." },
      { kind: "body", label: "The implications", guide: "So what? Connect it to the viewer's life." },
      { kind: "conclusion", label: "The bigger picture", guide: "Zoom out + open the next question." },
    ],
  },
  {
    id: "commentary",
    name: "Reaction / Commentary",
    description: "The thing, your first take, the deep dive, where you land.",
    beats: [
      { kind: "hook", label: "Hook", guide: "The thing everyone's talking about + your angle in one line." },
      { kind: "body", label: "What happened", guide: "The facts, fast and fair — earn both sides' trust." },
      { kind: "body", label: "First take", guide: "Your instinctive reaction, unfiltered." },
      { kind: "rehook", label: "Re-hook", guide: "\"But then I found something that changed my mind.\"" },
      { kind: "body", label: "The deep dive", guide: "What the hot takes miss. Bring receipts." },
      { kind: "conclusion", label: "Where I land", guide: "A position, clearly stated. Invite disagreement." },
    ],
  },
  {
    id: "challenge",
    name: "Challenge",
    description: "Rules, stakes, the grind, the mid-point crisis, the result.",
    beats: [
      { kind: "hook", label: "The challenge", guide: "State the challenge + the forfeit in one breath." },
      { kind: "body", label: "Rules & stakes", guide: "Make the constraints crystal clear — they create drama." },
      { kind: "body", label: "The start", guide: "Early optimism. Let them settle in." },
      { kind: "rehook", label: "The crisis", guide: "The moment it nearly fell apart. Cut before resolving." },
      { kind: "body", label: "The grind", guide: "Montage territory — compress time, keep stakes visible." },
      { kind: "body", label: "The final push", guide: "Slow back down. Real time for the finale." },
      { kind: "conclusion", label: "The result", guide: "Did you make it? + what challenge is next." },
    ],
  },
];
