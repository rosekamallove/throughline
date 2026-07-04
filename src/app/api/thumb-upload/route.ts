import { put } from "@vercel/blob";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";

/** Thumbnail uploads land in Vercel Blob; the public URL is stored on the
 *  packaging variant. Reports 501 when no store is configured so the client
 *  can fall back to inlining a data URL (local dev). */
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ error: "No blob store configured" }, { status: 501 });
  }

  const body = await req.blob();
  if (body.size === 0 || body.size > 4 * 1024 * 1024) {
    return Response.json({ error: "Bad image size" }, { status: 413 });
  }

  const blob = await put(`thumbs/${crypto.randomUUID()}.jpg`, body, {
    access: "public",
    contentType: "image/jpeg",
  });
  return Response.json({ url: blob.url });
}
