import type { Value } from "platejs";

/** Plain text → minimal Plate value (one paragraph per line). */
export function textToValue(text: string): Value {
  const lines = text.length ? text.split("\n") : [""];
  return lines.map((line) => ({ type: "p", children: [{ text: line }] }));
}
