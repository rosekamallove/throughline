import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";

import { BEAT_KINDS } from "@/lib/beats";
import { SCRIPT_TEMPLATES } from "@/lib/templates";
import { brollItemSchema, type BeatTextVariant } from "@/lib/types";
import { beats, videos } from "@/server/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";

type Ctx = Parameters<Parameters<typeof protectedProcedure.query>[0]>[0]["ctx"];

async function assertVideoOwned(ctx: Ctx, videoId: string) {
  const video = await ctx.db.query.videos.findFirst({
    where: and(eq(videos.id, videoId), eq(videos.userId, ctx.session.user.id)),
    columns: { id: true },
  });
  if (!video) throw new TRPCError({ code: "NOT_FOUND" });
}

async function assertBeatOwned(ctx: Ctx, beatId: string) {
  const beat = await ctx.db.query.beats.findFirst({
    where: eq(beats.id, beatId),
    with: { video: { columns: { userId: true } } },
  });
  if (!beat || beat.video.userId !== ctx.session.user.id) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }
  return beat;
}

export const beatRouter = createTRPCRouter({
  listByVideo: protectedProcedure
    .input(z.object({ videoId: z.uuid() }))
    .query(async ({ ctx, input }) => {
      await assertVideoOwned(ctx, input.videoId);
      return ctx.db.query.beats.findMany({
        where: eq(beats.videoId, input.videoId),
        orderBy: [asc(beats.position)],
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        videoId: z.uuid(),
        kind: z.enum(BEAT_KINDS),
        label: z.string().min(1).max(120),
        afterPosition: z.number().int().min(-1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertVideoOwned(ctx, input.videoId);
      return ctx.db.transaction(async (tx) => {
        const existing = await tx.query.beats.findMany({
          where: eq(beats.videoId, input.videoId),
          orderBy: [asc(beats.position)],
          columns: { id: true, position: true },
        });
        const target = input.afterPosition + 1;
        for (const b of existing.filter((b) => b.position >= target).reverse()) {
          await tx.update(beats).set({ position: b.position + 1 }).where(eq(beats.id, b.id));
        }
        const [created] = await tx
          .insert(beats)
          .values({
            videoId: input.videoId,
            kind: input.kind,
            label: input.label,
            position: target,
          })
          .returning();
        return created;
      });
    }),

  /** Debounced autosave target — returns only updatedAt so success never
   *  triggers a list refetch that would clobber the caret. `text` is the
   *  plain-text mirror of the Plate `content` document. */
  updateText: protectedProcedure
    .input(
      z.object({
        id: z.uuid(),
        text: z.string().max(20_000),
        content: z.array(z.record(z.string(), z.unknown())).max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const beat = await assertBeatOwned(ctx, input.id);
      // The beat's text/content mirror the active variant — keep both in sync
      // so switching away and back never loses edits.
      const variants = beat.activeVariantId
        ? beat.variants.map((v) =>
            v.id === beat.activeVariantId
              ? { ...v, text: input.text, content: input.content ?? v.content }
              : v,
          )
        : beat.variants;
      const [updated] = await ctx.db
        .update(beats)
        .set({
          text: input.text,
          ...(input.content ? { content: input.content } : {}),
          variants,
          updatedAt: new Date(),
        })
        .where(eq(beats.id, input.id))
        .returning({ id: beats.id, updatedAt: beats.updatedAt });
      return updated;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.uuid(),
        label: z.string().min(1).max(120).optional(),
        kind: z.enum(BEAT_KINDS).optional(),
        guide: z.string().max(500).nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertBeatOwned(ctx, input.id);
      const { id, ...fields } = input;
      const [updated] = await ctx.db
        .update(beats)
        .set({ ...fields, updatedAt: new Date() })
        .where(eq(beats.id, id))
        .returning();
      return updated;
    }),

  setBroll: protectedProcedure
    .input(z.object({ id: z.uuid(), broll: z.array(brollItemSchema).max(20) }))
    .mutation(async ({ ctx, input }) => {
      await assertBeatOwned(ctx, input.id);
      const [updated] = await ctx.db
        .update(beats)
        .set({ broll: input.broll, updatedAt: new Date() })
        .where(eq(beats.id, input.id))
        .returning();
      return updated;
    }),

  reorder: protectedProcedure
    .input(z.object({ videoId: z.uuid(), orderedIds: z.array(z.uuid()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      await assertVideoOwned(ctx, input.videoId);
      return ctx.db.transaction(async (tx) => {
        const existing = await tx.query.beats.findMany({
          where: eq(beats.videoId, input.videoId),
          columns: { id: true },
        });
        const existingIds = new Set(existing.map((b) => b.id));
        const sameSet =
          existing.length === input.orderedIds.length &&
          input.orderedIds.every((id) => existingIds.has(id));
        if (!sameSet) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "orderedIds must match the video's beats exactly",
          });
        }
        for (const [index, id] of input.orderedIds.entries()) {
          await tx.update(beats).set({ position: index }).where(eq(beats.id, id));
        }
        return { ok: true };
      });
    }),

  /** Fork the current take into a new variant and switch to it. */
  addVariant: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const beat = await assertBeatOwned(ctx, input.id);
      // First fork also snapshots the original so it stays selectable as "A".
      const variants = [...beat.variants];
      if (variants.length === 0) {
        variants.push({
          id: crypto.randomUUID(),
          label: "A",
          text: beat.text,
          content: (beat.content as BeatTextVariant["content"]) ?? null,
        });
      }
      const label = String.fromCharCode(65 + variants.length);
      const fresh: BeatTextVariant = {
        id: crypto.randomUUID(),
        label,
        text: beat.text,
        content: (beat.content as BeatTextVariant["content"]) ?? null,
      };
      variants.push(fresh);
      const [updated] = await ctx.db
        .update(beats)
        .set({ variants, activeVariantId: fresh.id, updatedAt: new Date() })
        .where(eq(beats.id, input.id))
        .returning();
      return updated;
    }),

  switchVariant: protectedProcedure
    .input(z.object({ id: z.uuid(), variantId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const beat = await assertBeatOwned(ctx, input.id);
      const target = beat.variants.find((v) => v.id === input.variantId);
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "Unknown variant" });
      const [updated] = await ctx.db
        .update(beats)
        .set({
          text: target.text,
          content: target.content,
          activeVariantId: target.id,
          updatedAt: new Date(),
        })
        .where(eq(beats.id, input.id))
        .returning();
      return updated;
    }),

  deleteVariant: protectedProcedure
    .input(z.object({ id: z.uuid(), variantId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const beat = await assertBeatOwned(ctx, input.id);
      const remaining = beat.variants.filter((v) => v.id !== input.variantId);
      const wasActive = beat.activeVariantId === input.variantId;
      const fallback = wasActive ? remaining[0] : null;
      const [updated] = await ctx.db
        .update(beats)
        .set({
          variants: remaining.length > 1 ? remaining : [],
          activeVariantId:
            remaining.length > 1 ? (fallback?.id ?? beat.activeVariantId) : null,
          ...(fallback ? { text: fallback.text, content: fallback.content } : {}),
          updatedAt: new Date(),
        })
        .where(eq(beats.id, input.id))
        .returning();
      return updated;
    }),

  /** Replace the video's beats with a template's structure. Destructive —
   *  the client confirms first when the current script has content. */
  applyTemplate: protectedProcedure
    .input(z.object({ videoId: z.uuid(), templateId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertVideoOwned(ctx, input.videoId);
      const template = SCRIPT_TEMPLATES.find((t) => t.id === input.templateId);
      if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Unknown template" });
      return ctx.db.transaction(async (tx) => {
        await tx.delete(beats).where(eq(beats.videoId, input.videoId));
        const created = await tx
          .insert(beats)
          .values(
            template.beats.map((b, i) => ({
              videoId: input.videoId,
              kind: b.kind,
              label: b.label,
              guide: b.guide ?? null,
              position: i,
            })),
          )
          .returning();
        return created;
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const beat = await assertBeatOwned(ctx, input.id);
      await ctx.db.transaction(async (tx) => {
        await tx.delete(beats).where(eq(beats.id, input.id));
        // Close the position gap.
        const rest = await tx.query.beats.findMany({
          where: eq(beats.videoId, beat.videoId),
          orderBy: [asc(beats.position)],
          columns: { id: true },
        });
        for (const [index, b] of rest.entries()) {
          await tx.update(beats).set({ position: index }).where(eq(beats.id, b.id));
        }
      });
      return { id: input.id };
    }),
});
