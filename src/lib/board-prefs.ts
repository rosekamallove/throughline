"use client";

import { useSyncExternalStore } from "react";

/**
 * Micro external store for dashboard view prefs (view mode + collapsed board
 * columns), persisted to localStorage. useSyncExternalStore keeps SSR
 * hydration clean (server snapshot = defaults).
 */

export type BoardSort = "custom" | "created" | "published";

interface BoardPrefs {
  view: "grid" | "board" | "calendar";
  sort: BoardSort;
  collapsed: Record<string, boolean>;
}

const STORAGE_KEY = "throughline:boardPrefs";
const DEFAULTS: BoardPrefs = { view: "grid", sort: "custom", collapsed: {} };

let state: BoardPrefs | null = null;
const listeners = new Set<() => void>();

function load(): BoardPrefs {
  if (state) return state;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state = raw ? { ...DEFAULTS, ...(JSON.parse(raw) as BoardPrefs) } : DEFAULTS;
  } catch {
    state = DEFAULTS;
  }
  return state;
}

function set(update: Partial<BoardPrefs>) {
  state = { ...load(), ...update };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // private mode etc. — in-memory only
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useBoardPrefs(): [BoardPrefs, typeof set] {
  const snapshot = useSyncExternalStore(subscribe, load, () => DEFAULTS);
  return [snapshot, set];
}

export function toggleColumnCollapsed(stage: string) {
  const current = load();
  set({ collapsed: { ...current.collapsed, [stage]: !current.collapsed[stage] } });
}
