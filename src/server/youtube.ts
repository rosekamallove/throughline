import "server-only";

import { and, eq } from "drizzle-orm";

import type { Db } from "@/server/db";
import { account } from "@/server/db/schema";

const DATA_API = "https://www.googleapis.com/youtube/v3";

export class YouTubeNotConnectedError extends Error {
  constructor(message = "YouTube is not connected") {
    super(message);
  }
}

/** The user's Google account row, if it carries a YouTube scope. */
export async function getYouTubeAccount(db: Db, userId: string) {
  const row = await db.query.account.findFirst({
    where: and(eq(account.userId, userId), eq(account.providerId, "google")),
  });
  if (!row?.refreshToken) return null;
  if (!row.scope?.includes("youtube")) return null;
  return row;
}

/**
 * Access token with manual refresh (instantdocs googleDocs.ts pattern):
 * reuse while >60s of life remains, otherwise exchange the refresh token.
 */
export async function getAccessToken(db: Db, userId: string): Promise<string> {
  const row = await getYouTubeAccount(db, userId);
  if (!row) throw new YouTubeNotConnectedError();

  const fresh =
    row.accessToken &&
    row.accessTokenExpiresAt &&
    row.accessTokenExpiresAt.getTime() > Date.now() + 60_000;
  if (fresh) return row.accessToken!;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: row.refreshToken!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new YouTubeNotConnectedError(
      "Google token refresh failed. Reconnect YouTube",
    );
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };

  await db
    .update(account)
    .set({
      accessToken: data.access_token,
      accessTokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
      updatedAt: new Date(),
    })
    .where(eq(account.id, row.id));

  return data.access_token;
}

async function api<T>(token: string, url: string): Promise<T> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouTube API ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

interface ChannelInfo {
  channelId: string;
  title: string;
  subscriberCount: number | null;
  uploadsPlaylistId: string;
}

export async function getChannel(token: string): Promise<ChannelInfo> {
  const data = await api<{
    items?: {
      id: string;
      snippet: { title: string };
      statistics?: { subscriberCount?: string };
      contentDetails: { relatedPlaylists: { uploads: string } };
    }[];
  }>(token, `${DATA_API}/channels?part=snippet,contentDetails,statistics&mine=true`);
  const channel = data.items?.[0];
  if (!channel) throw new Error("No YouTube channel on this Google account");
  return {
    channelId: channel.id,
    title: channel.snippet.title,
    subscriberCount: channel.statistics?.subscriberCount
      ? Number(channel.statistics.subscriberCount)
      : null,
    uploadsPlaylistId: channel.contentDetails.relatedPlaylists.uploads,
  };
}

export async function listUploadIds(
  token: string,
  uploadsPlaylistId: string,
  maxVideos = 200,
): Promise<string[]> {
  const ids: string[] = [];
  let pageToken = "";
  while (ids.length < maxVideos) {
    const data = await api<{
      items?: { contentDetails: { videoId: string } }[];
      nextPageToken?: string;
    }>(
      token,
      `${DATA_API}/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50${pageToken ? `&pageToken=${pageToken}` : ""}`,
    );
    ids.push(...(data.items ?? []).map((i) => i.contentDetails.videoId));
    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }
  return ids.slice(0, maxVideos);
}

export interface YouTubeVideo {
  id: string;
  title: string;
  publishedAt: Date;
  thumbnailUrl: string | null;
  views: number | null;
  durationSec: number;
  privacy: "public" | "unlisted" | "private";
}

export function parseIsoDuration(iso: string): number {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso);
  if (!m) return 0;
  return (Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0)) * 60 + Number(m[3] ?? 0);
}

export async function getVideos(token: string, ids: string[]): Promise<YouTubeVideo[]> {
  const out: YouTubeVideo[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const data = await api<{
      items?: {
        id: string;
        snippet: {
          title: string;
          publishedAt: string;
          liveBroadcastContent?: string;
          thumbnails?: Record<string, { url: string } | undefined>;
        };
        statistics?: { viewCount?: string };
        contentDetails: { duration: string };
        status?: { privacyStatus?: string };
      }[];
    }>(
      token,
      `${DATA_API}/videos?part=snippet,statistics,contentDetails,status&id=${chunk.join(",")}`,
    );
    for (const item of data.items ?? []) {
      const thumbs = item.snippet.thumbnails ?? {};
      out.push({
        id: item.id,
        title: item.snippet.title,
        publishedAt: new Date(item.snippet.publishedAt),
        thumbnailUrl:
          thumbs.maxres?.url ?? thumbs.high?.url ?? thumbs.medium?.url ?? null,
        views: item.statistics?.viewCount ? Number(item.statistics.viewCount) : null,
        durationSec: parseIsoDuration(item.contentDetails.duration),
        privacy:
          item.status?.privacyStatus === "unlisted" ||
          item.status?.privacyStatus === "private"
            ? item.status.privacyStatus
            : "public",
      });
    }
  }
  return out;
}

/**
 * Per-video thumbnail CTR, best effort. Impressions metrics have limited
 * availability in the Analytics API — any failure returns an empty map and
 * the sync proceeds without CTR.
 */
export async function getCtrByVideo(token: string): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  try {
    const end = new Date().toISOString().slice(0, 10);
    const data = await api<{ rows?: [string, number][] }>(
      token,
      "https://youtubeanalytics.googleapis.com/v2/reports?ids=channel%3D%3DMINE" +
        `&startDate=2005-02-14&endDate=${end}` +
        "&dimensions=video&metrics=impressionsClickThroughRate&sort=-impressionsClickThroughRate&maxResults=200",
    );
    for (const [videoId, ctr] of data.rows ?? []) {
      map.set(videoId, Math.round(ctr * 10) / 10);
    }
  } catch {
    // CTR is a nice-to-have; views/duration still sync.
  }
  return map;
}
