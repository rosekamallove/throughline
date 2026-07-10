const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

export function formatCompact(n: number): string {
  return compact.format(n);
}

const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

/** "Jul 12" — for release-date chips and the calendar. */
export function formatShortDate(date: Date): string {
  return shortDate.format(date);
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const steps: [number, string][] = [
    [60 * 60 * 24 * 365, "year"],
    [60 * 60 * 24 * 30, "month"],
    [60 * 60 * 24 * 7, "week"],
    [60 * 60 * 24, "day"],
    [60 * 60, "hour"],
    [60, "minute"],
  ];
  for (const [step, unit] of steps) {
    const value = Math.floor(seconds / step);
    if (value >= 1) return `${value} ${unit}${value > 1 ? "s" : ""} ago`;
  }
  return "just now";
}
