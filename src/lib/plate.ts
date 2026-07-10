import type { Value } from "platejs";

import { countWords } from "@/lib/runtime";

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

/** Every shot id marked anywhere in the doc. */
export function shotMarkIds(value: Value): string[] {
  const ids = new Set<string>();
  const walk = (nodes: AnyNode[]) => {
    for (const n of nodes) {
      if (Array.isArray(n.children)) walk(n.children as AnyNode[]);
      else if (typeof n.shot === "string") ids.add(n.shot);
    }
  };
  walk(value as AnyNode[]);
  return [...ids];
}

/** Word offset of each shot mark's first leaf, for timeline positioning. */
export function shotWordOffsets(value: Value): Record<string, number> {
  const offsets: Record<string, number> = {};
  let words = 0;
  const walk = (nodes: AnyNode[]) => {
    for (const n of nodes) {
      if (Array.isArray(n.children)) {
        walk(n.children as AnyNode[]);
      } else {
        if (typeof n.shot === "string" && !(n.shot in offsets)) offsets[n.shot] = words;
        words += countWords(String(n.text ?? ""));
      }
    }
  };
  walk(value as AnyNode[]);
  return offsets;
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

/** Every comment id marked anywhere in the doc. */
export function commentMarkIds(value: Value): string[] {
  const ids = new Set<string>();
  const walk = (nodes: AnyNode[]) => {
    for (const n of nodes) {
      if (Array.isArray(n.children)) walk(n.children as AnyNode[]);
      else if (typeof n.comment === "string") ids.add(n.comment);
    }
  };
  walk(value as AnyNode[]);
  return [...ids];
}

/** Remove a deleted comment's mark from its text nodes (structure untouched). */
export function stripCommentMark(value: Value, commentId: string): Value {
  const walk = (nodes: AnyNode[]): AnyNode[] =>
    nodes.map((n) => {
      if (Array.isArray(n.children)) {
        return { ...n, children: walk(n.children as AnyNode[]) };
      }
      if (n.comment === commentId) {
        const rest = { ...n };
        delete rest.comment;
        return rest;
      }
      return n;
    });
  return walk(value as AnyNode[]) as Value;
}
