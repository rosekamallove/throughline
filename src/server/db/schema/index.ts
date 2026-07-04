import { relations } from "drizzle-orm";

import { beats } from "./beats";
import { checklistItems } from "./checklist";
import { packagingVariants } from "./packaging";
import { notes, referenceLinks } from "./research";
import { videos } from "./videos";

export * from "./auth";
export * from "./beats";
export * from "./checklist";
export * from "./packaging";
export * from "./research";
export * from "./videos";

export const videosRelations = relations(videos, ({ many }) => ({
  beats: many(beats),
  variants: many(packagingVariants),
  checklist: many(checklistItems),
}));

export const beatsRelations = relations(beats, ({ one }) => ({
  video: one(videos, { fields: [beats.videoId], references: [videos.id] }),
}));

export const packagingVariantsRelations = relations(packagingVariants, ({ one }) => ({
  video: one(videos, { fields: [packagingVariants.videoId], references: [videos.id] }),
}));

export const checklistItemsRelations = relations(checklistItems, ({ one }) => ({
  video: one(videos, { fields: [checklistItems.videoId], references: [videos.id] }),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  video: one(videos, { fields: [notes.videoId], references: [videos.id] }),
}));

export const referenceLinksRelations = relations(referenceLinks, ({ one }) => ({
  video: one(videos, { fields: [referenceLinks.videoId], references: [videos.id] }),
}));
