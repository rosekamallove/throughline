"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export function Checklist({
  items,
  onToggle,
  onAdd,
  onRename,
  onRemove,
}: {
  items: ChecklistItem[];
  onToggle: (id: string, done: boolean) => void;
  onAdd: (label: string) => void;
  onRename: (id: string, label: string) => void;
  onRemove: (id: string) => void;
}) {
  const [draft, setDraft] = useState("");

  function submitDraft() {
    if (!draft.trim()) return;
    onAdd(draft.trim());
    setDraft("");
  }

  return (
    <div>
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => (
          <li
            key={item.id}
            className="group flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-accent/60"
          >
            <Checkbox
              checked={item.done}
              onCheckedChange={(checked) => onToggle(item.id, checked === true)}
            />
            <EditableLabel
              label={item.label}
              done={item.done}
              onRename={(label) => onRename(item.id, label)}
            />
            <button
              aria-label={`Remove ${item.label}`}
              onClick={() => onRemove(item.id)}
              className="opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="size-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-1 flex items-center gap-3 px-2">
        <Plus className="size-4 text-muted-foreground" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitDraft()}
          placeholder="Add an item…"
          className="w-full bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}

function EditableLabel({
  label,
  done,
  onRename,
}: {
  label: string;
  done: boolean;
  onRename: (label: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <input
      value={draft ?? label}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft !== null && draft.trim() && draft !== label) onRename(draft.trim());
        setDraft(null);
      }}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      className={cn(
        "min-w-0 flex-1 cursor-pointer bg-transparent py-0.5 text-sm outline-none focus:cursor-text",
        done && "text-muted-foreground line-through",
      )}
    />
  );
}
