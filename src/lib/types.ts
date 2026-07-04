import { z } from "zod";

/** Shape of the `beats.broll` jsonb column. `text` is the editable shot
 *  description; `quote` is the script excerpt the shot was cut from (its id
 *  also marks those words in the beat content). */
export const brollItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  quote: z.string().optional(),
  done: z.boolean(),
});
export type BrollItem = z.infer<typeof brollItemSchema>;

/** Shape of the `thumbText` jsonb columns: one string per line, `*token*` = highlight. */
export const thumbTextSchema = z.array(z.string()).max(4);
export type ThumbText = z.infer<typeof thumbTextSchema>;

/** Shape of the `beats.variants` jsonb column — alternate takes of a beat. */
export const beatTextVariantSchema = z.object({
  id: z.string(),
  label: z.string(),
  text: z.string(),
  content: z.array(z.record(z.string(), z.unknown())).nullable(),
});
export type BeatTextVariant = z.infer<typeof beatTextVariantSchema>;
