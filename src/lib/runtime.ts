/** Speaking pace from the design handoff: ~2.3 words per second. */
export const WORDS_PER_SECOND = 2.3;

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

export function wordsToSeconds(words: number): number {
  return Math.round(words / WORDS_PER_SECOND);
}

export function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
