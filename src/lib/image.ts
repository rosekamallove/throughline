/**
 * Client-side thumbnail ingestion matching YouTube's requirements:
 * 16:9, rendered at 1280×720, JPG/PNG/WebP/GIF source, ≥640px wide.
 * Cover-crops to 16:9 and compresses to JPEG, then uploads to blob
 * storage via /api/thumb-upload. When no blob store is configured
 * (local dev), falls back to a data URL stored on the variant row.
 */
async function fileToThumbCanvas(file: File): Promise<HTMLCanvasElement> {
  if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
    throw new Error("Use a JPG, PNG, WebP, or GIF image");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Image is too large (max 8MB)");
  }

  const bitmap = await createImageBitmap(file);
  if (bitmap.width < 640) {
    throw new Error("Image must be at least 640px wide (YouTube minimum)");
  }

  const W = 1280;
  const H = 720;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  const scale = Math.max(W / bitmap.width, H / bitmap.height);
  const dw = bitmap.width * scale;
  const dh = bitmap.height * scale;
  ctx.drawImage(bitmap, (W - dw) / 2, (H - dh) / 2, dw, dh);
  bitmap.close();
  return canvas;
}

/** Crop + compress + upload; returns the URL to store on the variant. */
export async function fileToThumbUrl(file: File): Promise<string> {
  const canvas = await fileToThumbCanvas(file);
  const jpeg = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85),
  );
  if (!jpeg) throw new Error("Couldn't encode the image");

  const res = await fetch("/api/thumb-upload", {
    method: "POST",
    body: jpeg,
    headers: { "content-type": "image/jpeg" },
  });
  if (res.ok) {
    const { url } = (await res.json()) as { url: string };
    return url;
  }
  // 501 = no blob store configured (local dev) — keep the data-URL path.
  if (res.status === 501) return canvas.toDataURL("image/jpeg", 0.85);
  throw new Error("Upload failed, try again");
}
