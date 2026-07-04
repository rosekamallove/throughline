import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";

import { thumbTextSchema } from "@/lib/types";
import { packagingVariants, videos } from "@/server/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";

type Ctx = Parameters<Parameters<typeof protectedProcedure.query>[0]>[0]["ctx"];

async function assertVideoOwned(ctx: Ctx, videoId: string) {
  const video = await ctx.db.query.videos.findFirst({
    where: and(eq(videos.id, videoId), eq(videos.userId, ctx.session.user.id)),
    columns: { id: true },
  });
  if (!video) throw new TRPCError({ code: "NOT_FOUND" });
}

async function assertVariantOwned(ctx: Ctx, variantId: string) {
  const variant = await ctx.db.query.packagingVariants.findFirst({
    where: eq(packagingVariants.id, variantId),
    with: { video: { columns: { userId: true } } },
  });
  if (!variant || variant.video.userId !== ctx.session.user.id) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }
  return variant;
}

export const packagingRouter = createTRPCRouter({
  listByVideo: protectedProcedure
    .input(z.object({ videoId: z.uuid() }))
    .query(async ({ ctx, input }) => {
      await assertVideoOwned(ctx, input.videoId);
      return ctx.db.query.packagingVariants.findMany({
        where: eq(packagingVariants.videoId, input.videoId),
        orderBy: [asc(packagingVariants.position)],
      });
    }),

  create: protectedProcedure
    .input(
      z.discriminatedUnion("kind", [
        z.object({
          kind: z.literal("title"),
          videoId: z.uuid(),
          title: z.string().min(1).max(200),
          estCtr: z.number().min(0).max(100).nullish(),
        }),
        z.object({
          kind: z.literal("thumbnail"),
          videoId: z.uuid(),
          color: z.string().max(20).nullish(),
          thumbText: thumbTextSchema.nullish(),
          imageUrl: z.string().max(2_000_000).nullish(),
          estCtr: z.number().min(0).max(100).nullish(),
        }),
      ]),
    )
    .mutation(async ({ ctx, input }) => {
      await assertVideoOwned(ctx, input.videoId);
      const siblings = await ctx.db.query.packagingVariants.findMany({
        where: and(
          eq(packagingVariants.videoId, input.videoId),
          eq(packagingVariants.kind, input.kind),
        ),
        columns: { position: true },
      });
      const position = siblings.length
        ? Math.max(...siblings.map((s) => s.position)) + 1
        : 0;
      const [created] = await ctx.db
        .insert(packagingVariants)
        .values({ ...input, position })
        .returning();
      return created;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.uuid(),
        title: z.string().min(1).max(200).optional(),
        color: z.string().max(20).nullable().optional(),
        thumbText: thumbTextSchema.nullable().optional(),
        imageUrl: z.string().max(2_000_000).nullable().optional(),
        estCtr: z.number().min(0).max(100).nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertVariantOwned(ctx, input.id);
      const { id, ...fields } = input;
      const [updated] = await ctx.db
        .update(packagingVariants)
        .set({ ...fields, updatedAt: new Date() })
        .where(eq(packagingVariants.id, id))
        .returning();
      return updated;
    }),

  /** Flip isSelected within (videoId, kind) and denormalize the winning
   *  payload onto the videos row — the dashboard reads videos only. */
  select: protectedProcedure
    .input(z.object({ variantId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const variant = await assertVariantOwned(ctx, input.variantId);
      return ctx.db.transaction(async (tx) => {
        await tx
          .update(packagingVariants)
          .set({ isSelected: false })
          .where(
            and(
              eq(packagingVariants.videoId, variant.videoId),
              eq(packagingVariants.kind, variant.kind),
            ),
          );
        await tx
          .update(packagingVariants)
          .set({ isSelected: true, updatedAt: new Date() })
          .where(eq(packagingVariants.id, variant.id));
        const payload =
          variant.kind === "title"
            ? { title: variant.title ?? undefined }
            : {
                packagingColor: variant.color,
                thumbText: variant.thumbText,
                thumbImageUrl: variant.imageUrl,
              };
        const [video] = await tx
          .update(videos)
          .set({ ...payload, updatedAt: new Date() })
          .where(eq(videos.id, variant.videoId))
          .returning();
        return video;
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const variant = await assertVariantOwned(ctx, input.id);
      if (variant.isSelected) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Select another option before deleting the current one",
        });
      }
      await ctx.db.delete(packagingVariants).where(eq(packagingVariants.id, input.id));
      return { id: input.id };
    }),
});
