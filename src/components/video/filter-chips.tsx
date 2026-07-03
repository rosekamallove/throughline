"use client";

import { FILTERS, type FilterKey } from "@/lib/stages";
import { cn } from "@/lib/utils";

export function FilterChips({
  value,
  onChange,
  counts,
}: {
  value: FilterKey;
  onChange: (key: FilterKey) => void;
  counts: Record<FilterKey, number>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((f) => {
        const active = value === f.key;
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors",
              active
                ? "bg-chip-active-bg text-chip-active-text"
                : "bg-chip text-chip-text hover:bg-hover",
            )}
          >
            {f.label}
            <span className={cn("font-mono text-[11px]", active ? "opacity-70" : "text-sub2")}>
              {counts[f.key] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}
