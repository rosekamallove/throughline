import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { STAGES, stageIndex } from "@/lib/stages";
import { thumbTextSchema } from "@/lib/types";
import { youtubeIdFromUrl } from "@/lib/youtube";
import { videos } from "@/server/db/schema";

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
      // No default checklist or beat skeleton — new videos start empty.
      const [video] = await ctx.db
        .insert(videos)
        .values({ userId: ctx.session.user.id, title: input.title })
        .returning();
      return video;
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

  // Stamp a Throughline video with its published YouTube id so a later sync
  // updates this row (views/CTR/thumbnail) instead of importing a duplicate.
  linkYouTube: protectedProcedure
    .input(z.object({ id: z.uuid(), url: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const ytId = youtubeIdFromUrl(input.url);
      if (!ytId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "That doesn't look like a YouTube video URL.",
        });
      }

      const target = await ctx.db.query.videos.findFirst({
        where: and(eq(videos.id, input.id), eq(videos.userId, ctx.session.user.id)),
      });
      if (!target) throw new TRPCError({ code: "NOT_FOUND" });

      // If a prior sync already imported this exact video as its own card,
      // absorb its stats onto the target and drop the duplicate. If instead a
      // different hand-made video already claims this id, refuse.
      const dup = await ctx.db.query.videos.findFirst({
        where: and(
          eq(videos.userId, ctx.session.user.id),
          eq(videos.youtubeVideoId, ytId),
        ),
      });

      const patch: Partial<typeof videos.$inferInsert> = {
        youtubeVideoId: ytId,
        stage: "published",
        progress: 100,
        updatedAt: new Date(),
      };
      let absorbed = false;
      if (dup && dup.id !== input.id) {
        if (dup.source !== "youtube") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "That YouTube video is already linked to another video here.",
          });
        }
        patch.views = dup.views;
        patch.ctr = dup.ctr;
        patch.durationSec = dup.durationSec;
        patch.publishedAt = dup.publishedAt;
        patch.privacy = dup.privacy;
        patch.thumbImageUrl = target.thumbImageUrl ?? dup.thumbImageUrl;
        await ctx.db.delete(videos).where(eq(videos.id, dup.id));
        absorbed = true;
      }

      await ctx.db.update(videos).set(patch).where(eq(videos.id, input.id));
      return { id: input.id, youtubeVideoId: ytId, absorbed };
    }),

  unlinkYouTube: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(videos)
        .set({ youtubeVideoId: null, updatedAt: new Date() })
        .where(and(eq(videos.id, input.id), eq(videos.userId, ctx.session.user.id)))
        .returning({ id: videos.id });
      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      return { id: input.id };
    }),
});
