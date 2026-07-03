import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { videos } from "./videos";

export const variantKind = pgEnum("variant_kind", ["title", "thumbnail"]);

/**
 * One table for both title and thumbnail options: they share the whole
 * lifecycle (CRUD, estCtr, selection); only the payload columns differ.
 * `select` flips isSelected (one per videoId+kind, enforced in the mutation
 * transaction) and copies the payload onto the videos row.
 */
export const packagingVariants = pgTable(
  "packaging_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    videoId: uuid("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    kind: variantKind("kind").notNull(),
    // kind = "title"
    title: text("title"),
    // kind = "thumbnail"
    color: text("color"),
    thumbText: jsonb("thumb_text").$type<string[]>(),
    imageUrl: text("image_url"),
    estCtr: real("est_ctr"),
    isSelected: boolean("is_selected").notNull().default(false),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("packaging_variants_video_kind_idx").on(t.videoId, t.kind)],
);
