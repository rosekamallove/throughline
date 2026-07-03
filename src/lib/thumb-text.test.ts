import { describe, expect, it } from "vitest";

import { parseThumbLine } from "./thumb-text";

describe("parseThumbLine", () => {
  it("returns one plain segment when nothing is marked", () => {
    expect(parseThumbLine("I SOLD MY")).toEqual([{ text: "I SOLD MY", highlight: false }]);
  });

  it("parses a fully highlighted line", () => {
    expect(parseThumbLine("*$300K*")).toEqual([{ text: "$300K", highlight: true }]);
  });

  it("parses a highlight in the middle of a line", () => {
    expect(parseThumbLine("THE *ONLY* SKILL")).toEqual([
      { text: "THE ", highlight: false },
      { text: "ONLY", highlight: true },
      { text: " SKILL", highlight: false },
    ]);
  });

  it("parses a leading highlight with a trailing segment", () => {
    expect(parseThumbLine("*$1M* APP")).toEqual([
      { text: "$1M", highlight: true },
      { text: " APP", highlight: false },
    ]);
  });

  it("leaves an unclosed asterisk as plain text", () => {
    expect(parseThumbLine("RANK *1")).toEqual([{ text: "RANK *1", highlight: false }]);
  });

  it("handles the empty line", () => {
    expect(parseThumbLine("")).toEqual([]);
  });
});
