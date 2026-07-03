"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

import { ThumbnailPackaging } from "@/components/video/thumbnail-packaging";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { PackagingVariant } from "@/trpc/types";

const TAGS = ["A", "B", "C", "D", "E", "F"];

export function VariantGrid({
  variants,
  onSelect,
  onDelete,
  onCreate,
}: {
  variants: PackagingVariant[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: (input: { color: string; lines: string[] }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState("#CE2E6C");
  const [lines, setLines] = useState(["", "", ""]);

  function submit() {
    const filled = lines.map((l) => l.trim()).filter(Boolean);
    if (!filled.length) return;
    onCreate({ color, lines: filled });
    setOpen(false);
    setLines(["", "", ""]);
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {variants.map((v, i) => (
        <div key={v.id} className="group relative flex flex-col gap-1.5">
          <button onClick={() => onSelect(v.id)} className="text-left">
            <ThumbnailPackaging
              color={v.color}
              lines={v.thumbText}
              imageUrl={v.imageUrl}
              className={cn(
                "transition-shadow",
                v.isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
              )}
            />
          </button>
          <span className="font-mono text-[11px] text-muted-foreground">
            {TAGS[i]}
            {v.estCtr != null && ` · ${v.estCtr}% CTR`}
            {v.isSelected && " · selected"}
          </span>
          {!v.isSelected && (
            <button
              aria-label="Delete option"
              onClick={() => onDelete(v.id)}
              className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
            >
              <X className="size-3 text-white" />
            </button>
          )}
        </div>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="flex aspect-video flex-col items-center justify-center gap-1.5 rounded-thumb border border-dashed border-border bg-muted text-muted-foreground transition-colors hover:border-sub hover:text-foreground">
            <Plus className="size-5" />
            <span className="text-[12px]">Add option</span>
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New thumbnail option</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Label htmlFor="thumb-color" className="mb-1.5 block">
                  Background
                </Label>
                <Input
                  id="thumb-color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#CE2E6C"
                />
              </div>
              <ThumbnailPackaging
                color={color}
                lines={lines.filter((l) => l.trim())}
                className="w-28 shrink-0"
              />
            </div>
            {lines.map((line, i) => (
              <div key={i}>
                <Label htmlFor={`thumb-line-${i}`} className="mb-1.5 block">
                  Line {i + 1}{" "}
                  <span className="font-normal text-muted-foreground">(wrap a word in * to highlight)</span>
                </Label>
                <Input
                  id={`thumb-line-${i}`}
                  value={line}
                  onChange={(e) =>
                    setLines((ls) => ls.map((l, j) => (j === i ? e.target.value : l)))
                  }
                  placeholder={i === 2 ? "*7 DAYS*" : "REDDIT"}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={submit}>Add option</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
