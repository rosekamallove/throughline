import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { checklistItems } from "@/server/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const checklistRouter = createTRPCRouter({
  toggle: protectedProcedure
    .input(z.object({ id: z.uuid(), done: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.query.checklistItems.findFirst({
        where: eq(checklistItems.id, input.id),
        with: { video: { columns: { userId: true } } },
      });
      if (!item || item.video.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      const [updated] = await ctx.db
        .update(checklistItems)
        .set({ done: input.done })
        .where(eq(checklistItems.id, input.id))
        .returning();
      return updated;
    }),
});
