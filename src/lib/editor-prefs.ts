"use client";

import { useSyncExternalStore } from "react";

/** Micro external store for script-editor rail widths, persisted to
 *  localStorage. useSyncExternalStore keeps SSR hydration clean. */

interface EditorPrefs {
  leftWidth: number;
  rightWidth: number;
  timeline: boolean;
}

export const RAIL_LIMITS = {
  left: { min: 220, max: 420 },
  right: { min: 260, max: 480 },
} as const;

const STORAGE_KEY = "throughline:editorPrefs";
const DEFAULTS: EditorPrefs = { leftWidth: 284, rightWidth: 318, timeline: false };

let state: EditorPrefs | null = null;
const listeners = new Set<() => void>();

function load(): EditorPrefs {
  if (state) return state;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<EditorPrefs>) : {};
    state = {
      leftWidth: typeof parsed.leftWidth === "number" ? parsed.leftWidth : DEFAULTS.leftWidth,
      rightWidth:
        typeof parsed.rightWidth === "number" ? parsed.rightWidth : DEFAULTS.rightWidth,
      timeline: typeof parsed.timeline === "boolean" ? parsed.timeline : DEFAULTS.timeline,
    };
  } catch {
    state = DEFAULTS;
  }
  return state;
}

function set(update: Partial<EditorPrefs>) {
  state = { ...load(), ...update };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // private mode etc. — in-memory only
  }
  listeners.forEach((l) => l());
}

export function useEditorPrefs(): [EditorPrefs, typeof set] {
  const snapshot = useSyncExternalStore(subscribe, load, () => DEFAULTS);
  return [snapshot, set];
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
