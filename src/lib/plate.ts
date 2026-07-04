import type { Value } from "platejs";

/** Plain text → minimal Plate value (one paragraph per line). */
export function textToValue(text: string): Value {
  const lines = text.length ? text.split("\n") : [""];
  return lines.map((line) => ({ type: "p", children: [{ text: line }] }));
}

type AnyNode = Record<string, unknown>;

export function hasShotMark(value: Value, shotId: string): boolean {
  const walk = (nodes: AnyNode[]): boolean =>
    nodes.some((n) =>
      Array.isArray(n.children) ? walk(n.children as AnyNode[]) : n.shot === shotId,
    );
  return walk(value as AnyNode[]);
}

/** Remove a deleted shot's mark from its text nodes (structure untouched). */
export function stripShotMark(value: Value, shotId: string): Value {
  const walk = (nodes: AnyNode[]): AnyNode[] =>
    nodes.map((n) => {
      if (Array.isArray(n.children)) {
        return { ...n, children: walk(n.children as AnyNode[]) };
      }
      if (n.shot === shotId) {
        const rest = { ...n };
        delete rest.shot;
        return rest;
      }
      return n;
    });
  return walk(value as AnyNode[]) as Value;
}
