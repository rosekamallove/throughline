/**
 * Idempotent seed: the 9 videos + 9-beat Reddit-marketing script from the
 * design handoff prototype (Studio.dc.html). Deterministic IDs so URLs
 * survive reseeds. Run with `pnpm db:seed` — this file must NOT import
 * anything that imports "server-only" (it runs under tsx, not Next).
 */
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import type { BrollItem } from "@/lib/types";

import * as schema from "./schema";
import { account, beats, checklistItems, packagingVariants, user, videos } from "./schema";

const USER_ID = "seed-user-rose";
const ALLOWED_EMAIL = process.env.ALLOWED_EMAIL ?? "rose@groovehq.com";

const vid = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000);

const DEFAULT_CHECKLIST = [
  "Script locked",
  "Recorded",
  "Edit v1 done",
  "Thumbnail A/B picked",
  "Title finalized",
  "Scheduled",
];

type SeedVideo = typeof videos.$inferInsert & { doneChecklist?: number };

const SEED_VIDEOS: SeedVideo[] = [
  {
    id: vid(1),
    userId: USER_ID,
    title: "How I Sold My App for $300K",
    stage: "published",
    packagingColor: "#AF2028",
    thumbText: ["I SOLD MY", "APP FOR", "*$300K*"],
    progress: 100,
    views: 142_000,
    ctr: 11.2,
    durationSec: 11 * 60 + 4,
    publishedAt: daysAgo(21),
    createdAt: daysAgo(40),
    doneChecklist: 6,
  },
  {
    id: vid(2),
    userId: USER_ID,
    title: "The Distribution Playbook Nobody Talks About",
    stage: "published",
    packagingColor: "#0C6E6A",
    thumbText: ["THE", "DISTRIBUTION", "*PLAYBOOK*"],
    progress: 100,
    views: 89_000,
    ctr: 9.4,
    durationSec: 14 * 60 + 22,
    publishedAt: daysAgo(31),
    createdAt: daysAgo(50),
    doneChecklist: 6,
  },
  {
    id: vid(3),
    userId: USER_ID,
    title: "Marketing Is The Only Skill That Matters",
    stage: "published",
    packagingColor: "#17130F",
    thumbText: ["THE *ONLY*", "SKILL THAT", "MATTERS"],
    progress: 100,
    views: 203_000,
    ctr: 13.1,
    durationSec: 9 * 60 + 47,
    publishedAt: daysAgo(62),
    createdAt: daysAgo(80),
    doneChecklist: 6,
  },
  {
    id: vid(4),
    userId: USER_ID,
    title: "find your next app idea in (2 minutes)",
    stage: "packaging",
    packagingColor: "#E0531B",
    thumbText: ["YOUR NEXT", "*$1M* APP", "IN 2 MIN"],
    progress: 90,
    nextAction: "pick winning thumbnail",
    createdAt: daysAgo(12),
    doneChecklist: 3,
  },
  {
    id: vid(5),
    userId: USER_ID,
    title: "I tried Reddit Marketing for 7 DAYS",
    stage: "production",
    packagingColor: "#CE2E6C",
    thumbText: ["REDDIT", "MARKETING", "*7 DAYS*"],
    progress: 62,
    nextAction: "finish the rough cut",
    createdAt: daysAgo(9),
    doneChecklist: 3,
  },
  {
    id: vid(6),
    userId: USER_ID,
    title: "how to rank in ChatGPT in 7 Days",
    stage: "production",
    packagingColor: "#3B41C4",
    thumbText: ["RANK *#1*", "IN CHATGPT"],
    progress: 30,
    nextAction: "record b-roll",
    createdAt: daysAgo(6),
    doneChecklist: 1,
  },
  {
    id: vid(7),
    userId: USER_ID,
    title: "I spent $5,000 on Google Ads",
    stage: "scripting",
    packagingColor: "#1E7D42",
    thumbText: ["I SPENT", "*$5,000*", "ON ADS"],
    progress: 15,
    nextAction: "finish the script",
    createdAt: daysAgo(4),
    doneChecklist: 0,
  },
  {
    id: vid(8),
    userId: USER_ID,
    title: "i built in public for 7 days",
    stage: "ideation",
    createdAt: daysAgo(2),
    doneChecklist: 0,
  },
  {
    id: vid(9),
    userId: USER_ID,
    title: "How to find a $1M idea with AI [Reddit, Claude]",
    stage: "ideation",
    createdAt: daysAgo(7),
    doneChecklist: 0,
  },
];

const broll = (key: string, texts: string[], doneIdx: number[] = []): BrollItem[] =>
  texts.map((text, i) => ({ id: `${key}-${i}`, text, done: doneIdx.includes(i) }));

// The full Reddit-marketing script (prototype beatsRaw), on video 5.
const SEED_BEATS: (typeof beats.$inferInsert)[] = [
  {
    videoId: vid(5),
    kind: "hook",
    label: "Hook",
    position: 0,
    guide: "One line. State the promise and the stakes.",
    text: "Reddit as a marketing channel has been trending hard lately. I wanted to see if it could actually get ME users — so I ran a 7-day experiment.",
    broll: broll("hook", ["Screen-rec: Reddit trending on X", "Text overlay: “7 DAYS”"]),
  },
  {
    videoId: vid(5),
    kind: "body",
    label: "Context & Authority",
    position: 1,
    guide: "Earn the right to be heard. Why trust you on this?",
    text: "The cost of building products is going to zero. In a world where anyone can ship a product, the thing that decides which win is marketing. I sold my last product for $300,000 — it could have been ten times that if I’d known how to get users. Reddit is community-first: no followers needed. Bring real value and you get eyes on it; post a cheap hack and the community shreds it.",
    broll: broll("context", ["B-roll: $300K sale screenshot", "Cutaway: a downvote pile-on"], [0]),
  },
  {
    videoId: vid(5),
    kind: "rehook",
    label: "Re-hook",
    position: 2,
    guide: "Re-tease the payoff so nobody bails.",
    text: "If you don’t want YOUR posts shredded to pieces, you’ll want to stick around till the end.",
    broll: [],
  },
  {
    videoId: vid(5),
    kind: "body",
    label: "Section 1 · Get the vibe",
    position: 3,
    guide: "Concrete first step. Show it on screen.",
    text: "Before any experiment on a new platform, figure out if your ideal customer even hangs out there. For Reddit: type in keywords your customers use, then read everything that surfaces — posts, comments, and especially the subreddits. Hover a sub to see members, weekly visitors, and who’s online now. Make a list of every relevant subreddit.",
    broll: broll("s1", ["Screen-rec: keyword search", "Hover: subreddit member count"], [0]),
  },
  {
    videoId: vid(5),
    kind: "body",
    label: "Section 2 · Rank the subreddits",
    position: 4,
    guide: "The meat. Give a repeatable system.",
    text: "Rank each subreddit qualitatively. Read the rules first. Then study the Hot, Best, and Top posts, plus the Controversial and low performers. Do the same for comments. That tells you what works, what dies, and which subs to shortlist — then write posts that give value first and follow every rule.",
    broll: broll("s2", ["Screen-rec: Top posts filter", "Overlay: the 4-rule checklist"]),
  },
  {
    videoId: vid(5),
    kind: "body",
    label: "Section 3 · Warm up the account",
    position: 5,
    guide: "The step everyone skips.",
    text: "Before you post anything: warm up your account. A brand-new account that drops a promo post gets flagged and buried. Comment, participate, build karma first.",
    broll: broll("s3", ["Screen-rec: commenting", "Graph: account age vs reach"]),
  },
  {
    videoId: vid(5),
    kind: "body",
    label: "Section 4 · The algorithm",
    position: 6,
    guide: "Explain the mechanism simply.",
    text: "Reddit runs on karma. More upvotes and comments push your post higher, which earns more impressions, which feeds karma back to your profile. It doesn’t care if you’re new — if the post is good, it gets the attention it deserves. And Reddit ranks on Google for free.",
    broll: broll("s4", ["Animation: the karma loop", "Screenshot: post ranking on Google"]),
  },
  {
    videoId: vid(5),
    kind: "body",
    label: "Section 5 · Results",
    position: 7,
    guide: "Pay off the hook. Real numbers.",
    text: "7 posts in 7 days. Here’s exactly what each one did — the views, the signups, and the one that completely flopped.",
    broll: broll("s5", ["Screen-rec: analytics dashboard", "Text: 7 posts / 7 days"]),
  },
  {
    videoId: vid(5),
    kind: "conclusion",
    label: "Conclusion",
    position: 8,
    guide: "Honest reflection + a hook into the next video.",
    text: "Honestly? I’m still not happy with these results. I think we can do much better — and next video, I’ll show you how.",
    broll: broll("conclusion", ["B-roll: next-video teaser"]),
  },
];

const SEED_VARIANTS: (typeof packagingVariants.$inferInsert)[] = [
  {
    videoId: vid(5),
    kind: "title",
    title: "I tried Reddit Marketing for 7 DAYS",
    estCtr: 8.1,
    isSelected: true,
    position: 0,
  },
  {
    videoId: vid(5),
    kind: "title",
    title: "I got 50K signups with Reddit (no ads)",
    estCtr: 6.2,
    isSelected: false,
    position: 1,
  },
  {
    videoId: vid(5),
    kind: "thumbnail",
    color: "#CE2E6C",
    thumbText: ["REDDIT", "MARKETING", "*7 DAYS*"],
    estCtr: 8.1,
    isSelected: true,
    position: 0,
  },
  {
    videoId: vid(5),
    kind: "thumbnail",
    color: "#1E7D42",
    thumbText: ["50K", "SIGNUPS", "*NO ADS*"],
    estCtr: 6.2,
    isSelected: false,
    position: 1,
  },
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  await db
    .insert(user)
    .values({
      id: USER_ID,
      name: "Rose Kamal",
      email: ALLOWED_EMAIL,
      emailVerified: true,
    })
    .onConflictDoNothing();

  // Credential account so email+password sign-in works before Google OAuth
  // is configured. Hash must match Better Auth's own (scrypt via its crypto).
  const { hashPassword } = await import("better-auth/crypto");
  await db
    .insert(account)
    .values({
      id: "seed-account-credential",
      accountId: USER_ID,
      providerId: "credential",
      userId: USER_ID,
      password: await hashPassword(process.env.SEED_PASSWORD ?? "throughline-dev"),
    })
    .onConflictDoNothing();

  // Deterministic video ids → cascade wipes beats/variants/checklists too.
  for (const v of SEED_VIDEOS) {
    const { doneChecklist = 0, ...row } = v;
    await db.delete(videos).where(eq(videos.id, row.id!));
    await db.insert(videos).values(row);
    await db.insert(checklistItems).values(
      DEFAULT_CHECKLIST.map((label, i) => ({
        videoId: row.id!,
        label,
        done: i < doneChecklist,
        position: i,
      })),
    );
  }

  await db.insert(beats).values(
    SEED_BEATS.map((b) => ({
      ...b,
      content: [{ type: "p", children: [{ text: b.text ?? "" }] }],
    })),
  );
  await db.insert(packagingVariants).values(SEED_VARIANTS);

  const count = await db.$count(videos);
  console.log(`Seeded ${count} videos for ${ALLOWED_EMAIL}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
