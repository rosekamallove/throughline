import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { DEFAULT_BEAT_SKELETON } from "@/lib/beats";
import { STAGES, DEFAULT_CHECKLIST, stageIndex } from "@/lib/stages";
import { thumbTextSchema } from "@/lib/types";
import { beats, checklistItems, videos } from "@/server/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";

const stageSchema = z.enum(STAGES);

export const videoRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.query.videos.findMany({
      where: eq(videos.userId, ctx.session.user.id),
    });
    // Feed order from the prototype: latest pipeline stage first (published →
    // idea), newest first within a stage.
    return rows.sort((a, b) => {
      const s = stageIndex(b.stage) - stageIndex(a.stage);
      if (s !== 0) return s;
      const at = (a.publishedAt ?? a.createdAt).getTime();
      const bt = (b.publishedAt ?? b.createdAt).getTime();
      return bt - at;
    });
  }),

  byId: protectedProcedure.input(z.object({ id: z.uuid() })).query(async ({ ctx, input }) => {
    const video = await ctx.db.query.videos.findFirst({
      where: and(eq(videos.id, input.id), eq(videos.userId, ctx.session.user.id)),
      with: {
        beats: { orderBy: (b, { asc: a }) => [a(b.position)] },
        variants: { orderBy: (v, { asc: a }) => [a(v.position)] },
        checklist: { orderBy: (c, { asc: a }) => [a(c.position)] },
      },
    });
    if (!video) throw new TRPCError({ code: "NOT_FOUND" });
    return video;
  }),

  create: protectedProcedure
    .input(z.object({ title: z.string().min(1).max(200) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        const [video] = await tx
          .insert(videos)
          .values({ userId: ctx.session.user.id, title: input.title })
          .returning();
        await tx.insert(checklistItems).values(
          DEFAULT_CHECKLIST.map((label, i) => ({ videoId: video.id, label, position: i })),
        );
        await tx.insert(beats).values(
          DEFAULT_BEAT_SKELETON.map((b, i) => ({
            videoId: video.id,
            kind: b.kind,
            label: b.label,
            position: i,
          })),
        );
        return video;
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.uuid(),
        title: z.string().min(1).max(200).optional(),
        nextAction: z.string().max(200).nullable().optional(),
        packagingColor: z.string().max(20).nullable().optional(),
        thumbText: thumbTextSchema.nullable().optional(),
        progress: z.number().int().min(0).max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...fields } = input;
      const [updated] = await ctx.db
        .update(videos)
        .set({ ...fields, updatedAt: new Date() })
        .where(and(eq(videos.id, id), eq(videos.userId, ctx.session.user.id)))
        .returning();
      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      return updated;
    }),

  setStage: protectedProcedure
    .input(z.object({ id: z.uuid(), stage: stageSchema }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(videos)
        .set({
          stage: input.stage,
          updatedAt: new Date(),
          // Stage side effects live here (the plan's one bookkeeper for publishedAt).
          ...(input.stage === "published" ? { publishedAt: new Date(), progress: 100 } : {}),
        })
        .where(and(eq(videos.id, input.id), eq(videos.userId, ctx.session.user.id)))
        .returning();
      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(videos)
        .where(and(eq(videos.id, input.id), eq(videos.userId, ctx.session.user.id)));
      return { id: input.id };
    }),
});
