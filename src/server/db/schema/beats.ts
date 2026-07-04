import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import type { BeatTextVariant, BrollItem } from "@/lib/types";

import { videos } from "./videos";

export const beatKind = pgEnum("beat_kind", ["hook", "rehook", "body", "conclusion"]);

export const beats = pgTable(
  "beats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    videoId: uuid("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    kind: beatKind("kind").notNull(),
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
    /** Alternate takes of this beat. text/content above always mirror the
     *  active variant so stats and the editor never special-case variants. */
    variants: jsonb("variants").$type<BeatTextVariant[]>().notNull().default([]),
    activeVariantId: text("active_variant_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("beats_video_id_idx").on(t.videoId)],
);
