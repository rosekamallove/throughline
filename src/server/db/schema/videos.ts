import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

// Pipeline order: packaging (Title & Thumbnail) deliberately precedes
// scripting — packaging-first is the workflow this tool is built around.
export const videoStage = pgEnum("video_stage", [
  "ideation",
  "packaging",
  "scripting",
  "production",
  "scheduled",
  "published",
]);

export const videoSource = pgEnum("video_source", ["manual", "youtube"]);

export const videos = pgTable("videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  /** The selected title — packaging.select copies the winning variant here. */
  title: text("title").notNull(),
  stage: videoStage("stage").notNull().default("ideation"),
  source: videoSource("source").notNull().default("manual"),
  youtubeVideoId: text("youtube_video_id"),
  /** YouTube privacyStatus; non-public videos stay out of the main feed. */
  privacy: text("privacy", { enum: ["public", "unlisted", "private"] })
    .notNull()
    .default("public"),
  /** CSS-thumbnail packaging: saturated bg + Anton lines ("*token*" = yellow). */
  packagingColor: text("packaging_color"),
  thumbText: jsonb("thumb_text").$type<string[]>(),
  /** Real uploaded thumbnail — wins over CSS mode when set. */
  thumbImageUrl: text("thumb_image_url"),
  /** 0–100, shown as the card progress bar for in-production stages. */
  progress: integer("progress").notNull().default(0),
  /** Manual order within a kanban column (lower = higher). Ties break on
   *  createdAt; the grid/feed still sorts by recency, not this. */
  position: integer("position").notNull().default(0),
  /** Optional planned publish date the creator sets; drives the calendar. */
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  nextAction: text("next_action"),
  // Published-only stats (populated by the v1.1 YouTube sync).
  views: integer("views"),
  ctr: real("ctr"),
  durationSec: integer("duration_sec"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
