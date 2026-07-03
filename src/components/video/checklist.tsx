"use client";

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
}: {
  items: ChecklistItem[];
  onToggle: (id: string, done: boolean) => void;
}) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => (
        <li key={item.id}>
          <label
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-hover",
              item.done && "text-sub2 line-through",
            )}
          >
            <Checkbox
              checked={item.done}
              onCheckedChange={(checked) => onToggle(item.id, checked === true)}
            />
            {item.label}
          </label>
        </li>
      ))}
    </ul>
  );
}
