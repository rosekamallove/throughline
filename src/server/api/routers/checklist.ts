import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";

import { checklistItems, videos } from "@/server/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";

type Ctx = Parameters<Parameters<typeof protectedProcedure.query>[0]>[0]["ctx"];

async function assertItemOwned(ctx: Ctx, id: string) {
  const item = await ctx.db.query.checklistItems.findFirst({
    where: eq(checklistItems.id, id),
    with: { video: { columns: { userId: true } } },
  });
  if (!item || item.video.userId !== ctx.session.user.id) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }
  return item;
}

export const checklistRouter = createTRPCRouter({
  toggle: protectedProcedure
    .input(z.object({ id: z.uuid(), done: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await assertItemOwned(ctx, input.id);
      const [updated] = await ctx.db
        .update(checklistItems)
        .set({ done: input.done })
        .where(eq(checklistItems.id, input.id))
        .returning();
      return updated;
    }),

  add: protectedProcedure
    .input(z.object({ videoId: z.uuid(), label: z.string().min(1).max(200) }))
    .mutation(async ({ ctx, input }) => {
      const video = await ctx.db.query.videos.findFirst({
        where: and(eq(videos.id, input.videoId), eq(videos.userId, ctx.session.user.id)),
        columns: { id: true },
      });
      if (!video) throw new TRPCError({ code: "NOT_FOUND" });
      const siblings = await ctx.db.query.checklistItems.findMany({
        where: eq(checklistItems.videoId, input.videoId),
        orderBy: [asc(checklistItems.position)],
        columns: { position: true },
      });
      const position = siblings.length
        ? Math.max(...siblings.map((s) => s.position)) + 1
        : 0;
      const [created] = await ctx.db
        .insert(checklistItems)
        .values({ videoId: input.videoId, label: input.label, position })
        .returning();
      return created;
    }),

  rename: protectedProcedure
    .input(z.object({ id: z.uuid(), label: z.string().min(1).max(200) }))
    .mutation(async ({ ctx, input }) => {
      await assertItemOwned(ctx, input.id);
      const [updated] = await ctx.db
        .update(checklistItems)
        .set({ label: input.label })
        .where(eq(checklistItems.id, input.id))
        .returning();
      return updated;
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      await assertItemOwned(ctx, input.id);
      await ctx.db.delete(checklistItems).where(eq(checklistItems.id, input.id));
      return { id: input.id };
    }),
});
