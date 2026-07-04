import { index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { videos } from "./videos";

/** Freeform research pages — deliberately separate from the script beats. */
export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    videoId: uuid("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("Untitled"),
    /** Plate document. */
    content: jsonb("content").$type<unknown>(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notes_video_id_idx").on(t.videoId)],
);

export const referenceLinks = pgTable(
  "reference_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    videoId: uuid("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    title: text("title").notNull().default(""),
    /** "youtube" refs render as playable embeds; everything else is a link card. */
    kind: text("kind", { enum: ["youtube", "link"] }).notNull().default("link"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("reference_links_video_id_idx").on(t.videoId)],
);
