import { z } from "zod";

/** Shape of the `beats.broll` jsonb column. */
export const brollItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  done: z.boolean(),
});
export type BrollItem = z.infer<typeof brollItemSchema>;

/** Shape of the `thumbText` jsonb columns: one string per line, `*token*` = highlight. */
export const thumbTextSchema = z.array(z.string()).max(4);
export type ThumbText = z.infer<typeof thumbTextSchema>;
