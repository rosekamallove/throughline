import { describe, expect, it } from "vitest";

import { countWords, formatDuration, wordsToSeconds } from "./runtime";

describe("countWords", () => {
  it("counts simple words", () => {
    expect(countWords("one two three")).toBe(3);
  });
  it("returns 0 for empty and whitespace-only text", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   \n\t ")).toBe(0);
  });
  it("collapses repeated whitespace", () => {
    expect(countWords("a  b\n\nc\td")).toBe(4);
  });
});

describe("wordsToSeconds", () => {
  it("uses the 2.3 words/sec pace from the handoff", () => {
    // 342 words → 148.7 → 149s. (UI totals sum per-beat rounded values,
    // so the seeded script's tile reads 2:28 — both are correct.)
    expect(wordsToSeconds(342)).toBe(149);
  });
  it("rounds to nearest second", () => {
    expect(wordsToSeconds(0)).toBe(0);
    expect(wordsToSeconds(23)).toBe(10);
  });
});

describe("formatDuration", () => {
  it("formats minutes and zero-pads seconds", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(59)).toBe("0:59");
    expect(formatDuration(60)).toBe("1:00");
    expect(formatDuration(664)).toBe("11:04");
  });
});
