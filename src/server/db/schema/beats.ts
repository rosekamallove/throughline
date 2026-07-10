import { index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import type { BeatTextVariant, BrollItem, CommentItem } from "@/lib/types";

import { user } from "./auth";
import { videos } from "./videos";

export const beatKinds = pgTable(
  "beat_kinds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull(),
    guide: text("guide"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("beat_kinds_user_id_idx").on(t.userId)],
);

export const scriptTemplates = pgTable(
  "script_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    beats: jsonb("beats")
      .$type<{ kind: string; label: string; guide?: string | null }[]>()
      .notNull()
      .default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("script_templates_user_id_idx").on(t.userId)],
);

export const beats = pgTable(
  "beats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    videoId: uuid("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    /** Built-in key or beat_kinds uuid — text, not enum, so custom kinds need no migration. */
    kind: text("kind").notNull(),
    label: text("label").notNull(),
    // Plain index — no unique constraint, so reorder can rewrite positions in one transaction.
    position: integer("position").notNull(),
    text: text("text").notNull().default(""),
    /** Plate editor document (rich text); `text` stays the plain-text mirror
     *  used for word counts. Null falls back to textToValue(text). */
    content: jsonb("content").$type<unknown>(),
    /** Coach guidance override; null falls back to the per-kind default in lib/beats.ts. */
    guide: text("guide"),
    broll: jsonb("broll").$type<BrollItem[]>().notNull().default([]),
    /** Review notes anchored to passages; each id also marks its words in content. */
    comments: jsonb("comments").$type<CommentItem[]>().notNull().default([]),
    /** Alternate takes of this beat. text/content above always mirror the
     *  active variant so stats and the editor never special-case variants. */
    variants: jsonb("variants").$type<BeatTextVariant[]>().notNull().default([]),
    activeVariantId: text("active_variant_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("beats_video_id_idx").on(t.videoId)],
);
