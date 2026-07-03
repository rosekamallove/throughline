import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import type { BrollItem } from "@/lib/types";

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
    /** Coach guidance override; null falls back to the per-kind default in lib/beats.ts. */
    guide: text("guide"),
    broll: jsonb("broll").$type<BrollItem[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("beats_video_id_idx").on(t.videoId)],
);
