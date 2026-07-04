/** Extract the 11-char video id from any common YouTube URL shape (watch,
 *  youtu.be, shorts, embed), or from a bare id. Pure + no imports, so it is
 *  safe to use on both the client and the server. */
export function youtubeIdFromUrl(input: string): string | null {
  const trimmed = input.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  const m =
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/.exec(
      trimmed,
    );
  return m?.[1] ?? null;
}
