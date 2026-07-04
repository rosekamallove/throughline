"use client";

import { Check } from "lucide-react";

import { STAGES, STAGE_META, stageIndex, type Stage } from "@/lib/stages";
import { cn } from "@/lib/utils";

export function PipelineStepper({
  stage,
  onSelect,
}: {
  stage: Stage;
  onSelect?: (stage: Stage) => void;
}) {
  const current = stageIndex(stage);

  return (
    <div className="flex items-start">
      {STAGES.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={s} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full items-center">
              <div
                className={cn(
                  "h-0.5 flex-1",
                  i === 0 ? "bg-transparent" : i <= current ? "bg-primary" : "bg-border",
                )}
              />
              <button
                aria-label={STAGE_META[s].label}
                onClick={() => onSelect?.(s)}
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  done || active
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-card hover:border-sub",
                )}
              >
                {done && <Check className="size-3" />}
                {active && <span className="size-1.5 rounded-full bg-white" />}
              </button>
              <div
                className={cn(
                  "h-0.5 flex-1",
                  i === STAGES.length - 1
                    ? "bg-transparent"
                    : i < current
                      ? "bg-primary"
                      : "bg-border",
                )}
              />
            </div>
            <span
              className={cn(
                "font-mono text-[10px] uppercase tracking-[1.5px]",
                done || active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {STAGE_META[s].shortLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
}
