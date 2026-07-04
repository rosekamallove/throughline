import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";

import { videos } from "@/server/db/schema";
import {
  YouTubeNotConnectedError,
  getAccessToken,
  getChannel,
  getCtrByVideo,
  getVideos,
  getYouTubeAccount,
  listUploadIds,
} from "@/server/youtube";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const youtubeRouter = createTRPCRouter({
  status: protectedProcedure.query(async ({ ctx }) => {
    const configured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    const yt = configured
      ? await getYouTubeAccount(ctx.db, ctx.session.user.id)
      : null;
    const imported = await ctx.db.$count(
      videos,
      and(eq(videos.userId, ctx.session.user.id), eq(videos.source, "youtube")),
    );
    return { configured, connected: !!yt, imported };
  }),

  sync: protectedProcedure.mutation(async ({ ctx }) => {
    let token: string;
    try {
      token = await getAccessToken(ctx.db, ctx.session.user.id);
    } catch (e) {
      if (e instanceof YouTubeNotConnectedError) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: e.message });
      }
      throw e;
    }

    const channel = await getChannel(token);
    const ids = await listUploadIds(token, channel.uploadsPlaylistId);
    const [ytVideos, ctrMap] = await Promise.all([
      getVideos(token, ids),
      getCtrByVideo(token),
    ]);

    // Shorts have no isShort flag in the Data API; <=3min is the Shorts
    // duration cap and this channel's long-form runs well past it.
    const longform = ytVideos.filter((v) => v.durationSec > 180);

    let created = 0;
    let updated = 0;
    for (const yt of longform) {
      const stats = {
        title: yt.title,
        views: yt.views,
        ctr: ctrMap.get(yt.id) ?? null,
        durationSec: yt.durationSec,
        publishedAt: yt.publishedAt,
        thumbImageUrl: yt.thumbnailUrl,
        privacy: yt.privacy,
        updatedAt: new Date(),
      };
      const existing = await ctx.db.query.videos.findFirst({
        where: and(
          eq(videos.userId, ctx.session.user.id),
          eq(videos.youtubeVideoId, yt.id),
        ),
        columns: { id: true },
      });
      if (existing) {
        await ctx.db.update(videos).set(stats).where(eq(videos.id, existing.id));
        updated++;
      } else {
        await ctx.db.insert(videos).values({
          ...stats,
          userId: ctx.session.user.id,
          source: "youtube",
          youtubeVideoId: yt.id,
          stage: "published",
          progress: 100,
          createdAt: yt.publishedAt,
        });
        created++;
      }
    }

    return { channel: channel.title, created, updated, total: longform.length };
  }),
});
