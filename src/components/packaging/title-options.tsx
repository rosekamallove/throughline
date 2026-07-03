"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { PackagingVariant } from "@/trpc/types";

export function TitleOptions({
  variants,
  onSelect,
  onDelete,
  onCreate,
}: {
  variants: PackagingVariant[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: (title: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const selected = variants.find((v) => v.isSelected);

  function submit() {
    if (!draft.trim()) return;
    onCreate(draft.trim());
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-1">
      <RadioGroup value={selected?.id ?? ""} onValueChange={onSelect}>
        {variants.map((v) => (
          <div
            key={v.id}
            className={cn(
              "group flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
              v.isSelected ? "border-primary/60 bg-card" : "border-border hover:bg-accent/50",
            )}
          >
            <RadioGroupItem value={v.id} id={`title-${v.id}`} />
            <Label
              htmlFor={`title-${v.id}`}
              className="min-w-0 flex-1 cursor-pointer text-sm font-normal leading-snug"
            >
              {v.title}
            </Label>
            {v.estCtr != null && (
              <span className="whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                {v.estCtr}% CTR
              </span>
            )}
            {!v.isSelected && (
              <button
                aria-label="Delete title option"
                onClick={() => onDelete(v.id)}
                className="opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="size-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
        ))}
      </RadioGroup>

      <div className="mt-1 flex items-center gap-2 px-4">
        <Plus className="size-4 text-muted-foreground" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Add a title option…"
          className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}
