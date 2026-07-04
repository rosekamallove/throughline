"use client";

import { ChevronRight, Plus } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

/** Collapsible sidebar section with a mono-label header. */
export function RailSection({
  title,
  count,
  onAdd,
  addLabel,
  children,
}: {
  title: string;
  count?: number;
  onAdd?: () => void;
  addLabel?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <section>
      <div className="mb-1 flex items-center justify-between">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="mono-label -ml-1 flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:text-foreground"
        >
          <ChevronRight
            className={cn(
              "size-3 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
              open && "rotate-90",
            )}
          />
          {title}
          {count != null && count > 0 && <span className="normal-nums">· {count}</span>}
        </button>
        {onAdd && open && (
          <button
            aria-label={addLabel}
            onClick={onAdd}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Plus className="size-3.5" />
          </button>
        )}
      </div>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-250 ease-[cubic-bezier(0.23,1,0.32,1)]",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        {/* -m-1/p-1 pushes the clip edge out so focus rings and card shadows
            aren't shaved off — but only while open: a negative margin grows
            the item beyond the collapsed 0fr row and leaks a sliver. */}
        <div className={cn("overflow-hidden", open && "-m-1")}>
          <div className="flex flex-col gap-1.5 p-1">{children}</div>
        </div>
      </div>
    </section>
  );
}
