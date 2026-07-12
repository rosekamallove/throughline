"use client";

import { useSyncExternalStore } from "react";

const MOBILE_QUERY = "(max-width: 767px)";

function subscribe(query: string) {
  return (onChange: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  };
}

/** True below Tailwind's `md` breakpoint. SSR snapshot is false (desktop-first),
 *  so the client corrects on mount without a hydration mismatch on the store. */
export function useIsMobile(): boolean {
  return useSyncExternalStore(
    subscribe(MOBILE_QUERY),
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );
}
