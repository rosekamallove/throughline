/**
 * Client-side thumbnail ingestion matching YouTube's requirements:
 * 16:9, rendered at 1280×720, JPG/PNG/WebP/GIF source, ≥640px wide.
 * Cover-crops to 16:9 and compresses to a JPEG data URL (~200–400KB),
 * which is stored directly on the variant row — no blob storage needed
 * for a single-user tool. Swap for real object storage with the YT sync.
 */
export async function fileToThumbDataUrl(file: File): Promise<string> {
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

  return canvas.toDataURL("image/jpeg", 0.85);
}
