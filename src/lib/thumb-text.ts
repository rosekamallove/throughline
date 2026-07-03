export interface ThumbSegment {
  text: string;
  highlight: boolean;
}

/**
 * Thumbnail lines are stored as plain strings where `*token*` marks the
 * highlighted (yellow) span, e.g. "I SOLD MY" / "APP FOR" / "*$300K*".
 */
export function parseThumbLine(line: string): ThumbSegment[] {
  const segments: ThumbSegment[] = [];
  const re = /\*([^*]+)\*/g;
  let last = 0;
  for (let m = re.exec(line); m !== null; m = re.exec(line)) {
    if (m.index > last) {
      segments.push({ text: line.slice(last, m.index), highlight: false });
    }
    segments.push({ text: m[1], highlight: true });
    last = m.index + m[0].length;
  }
  if (last < line.length) {
    segments.push({ text: line.slice(last), highlight: false });
  }
  return segments;
}
