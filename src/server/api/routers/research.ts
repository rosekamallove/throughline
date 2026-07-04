import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";

import { notes, referenceLinks, videos } from "@/server/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";

type Ctx = Parameters<Parameters<typeof protectedProcedure.query>[0]>[0]["ctx"];

async function assertVideoOwned(ctx: Ctx, videoId: string) {
  const video = await ctx.db.query.videos.findFirst({
    where: and(eq(videos.id, videoId), eq(videos.userId, ctx.session.user.id)),
    columns: { id: true },
  });
  if (!video) throw new TRPCError({ code: "NOT_FOUND" });
}

export function youtubeIdFromUrl(url: string): string | null {
  const m =
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/.exec(url);
  return m?.[1] ?? null;
}

export const researchRouter = createTRPCRouter({
  byVideo: protectedProcedure
    .input(z.object({ videoId: z.uuid() }))
    .query(async ({ ctx, input }) => {
      await assertVideoOwned(ctx, input.videoId);
      const [noteRows, refRows] = await Promise.all([
        ctx.db.query.notes.findMany({
          where: eq(notes.videoId, input.videoId),
          orderBy: [asc(notes.position)],
        }),
        ctx.db.query.referenceLinks.findMany({
          where: eq(referenceLinks.videoId, input.videoId),
          orderBy: [asc(referenceLinks.position)],
        }),
      ]);
      return { notes: noteRows, references: refRows };
    }),

  noteAdd: protectedProcedure
    .input(z.object({ videoId: z.uuid(), title: z.string().max(120).optional() }))
    .mutation(async ({ ctx, input }) => {
      await assertVideoOwned(ctx, input.videoId);
      const siblings = await ctx.db.query.notes.findMany({
        where: eq(notes.videoId, input.videoId),
        columns: { position: true },
      });
      const position = siblings.length
        ? Math.max(...siblings.map((s) => s.position)) + 1
        : 0;
      const [created] = await ctx.db
        .insert(notes)
        .values({ videoId: input.videoId, title: input.title ?? "Untitled", position })
        .returning();
      return created;
    }),

  noteUpdate: protectedProcedure
    .input(
      z.object({
        id: z.uuid(),
        title: z.string().min(1).max(120).optional(),
        content: z.array(z.record(z.string(), z.unknown())).max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const note = await ctx.db.query.notes.findFirst({
        where: eq(notes.id, input.id),
        with: { video: { columns: { userId: true } } },
      });
      if (!note || note.video.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      const { id, ...fields } = input;
      const [updated] = await ctx.db
        .update(notes)
        .set({ ...fields, updatedAt: new Date() })
        .where(eq(notes.id, id))
        .returning();
      return updated;
    }),

  noteDelete: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const note = await ctx.db.query.notes.findFirst({
        where: eq(notes.id, input.id),
        with: { video: { columns: { userId: true } } },
      });
      if (!note || note.video.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      await ctx.db.delete(notes).where(eq(notes.id, input.id));
      return { id: input.id };
    }),

  refAdd: protectedProcedure
    .input(
      z.object({
        videoId: z.uuid(),
        url: z.url().max(2000),
        title: z.string().max(200).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertVideoOwned(ctx, input.videoId);
      const siblings = await ctx.db.query.referenceLinks.findMany({
        where: eq(referenceLinks.videoId, input.videoId),
        columns: { position: true },
      });
      const position = siblings.length
        ? Math.max(...siblings.map((s) => s.position)) + 1
        : 0;
      const isYouTube = youtubeIdFromUrl(input.url) !== null;
      const [created] = await ctx.db
        .insert(referenceLinks)
        .values({
          videoId: input.videoId,
          url: input.url,
          title: input.title ?? "",
          kind: isYouTube ? "youtube" : "link",
          position,
        })
        .returning();
      return created;
    }),

  refDelete: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const ref = await ctx.db.query.referenceLinks.findFirst({
        where: eq(referenceLinks.id, input.id),
        with: { video: { columns: { userId: true } } },
      });
      if (!ref || ref.video.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      await ctx.db.delete(referenceLinks).where(eq(referenceLinks.id, input.id));
      return { id: input.id };
    }),
});
