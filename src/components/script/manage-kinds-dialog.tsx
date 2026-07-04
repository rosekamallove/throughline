"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { KIND_COLOR_CHOICES, type CustomBeatKind } from "@/lib/beats";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {KIND_COLOR_CHOICES.map((color) => (
        <button
          key={color}
          aria-label={`Color ${color}`}
          onClick={() => onChange(color)}
          className={cn(
            "size-6 rounded-full transition-transform hover:scale-110",
            value === color && "ring-2 ring-ring ring-offset-2 ring-offset-background",
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

export function ManageKindsDialog({
  open,
  onOpenChange,
  customKinds,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customKinds: CustomBeatKind[];
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [color, setColor] = useState(KIND_COLOR_CHOICES[5]);
  const [guide, setGuide] = useState("");

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: trpc.beat.kinds.queryKey() });
  };
  const opts = { onSuccess: invalidate, onError: (e: { message: string }) => toast.error(e.message) };

  const create = useMutation(trpc.beat.kindCreate.mutationOptions(opts));
  const update = useMutation(trpc.beat.kindUpdate.mutationOptions(opts));
  const remove = useMutation(
    trpc.beat.kindDelete.mutationOptions({
      onSuccess: () => {
        invalidate();
        toast.success("Kind deleted — its beats are now Body");
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  function submit() {
    if (!name.trim()) return;
    create.mutate({ name: name.trim(), color, guide: guide.trim() || undefined });
    setName("");
    setGuide("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Beat kinds</DialogTitle>
          <DialogDescription>
            Your own beat types, next to the built-in Hook / Re-hook / Body /
            Conclusion. The guide shows up in the coach panel.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {customKinds.map((kind) => (
            <KindRow
              key={kind.id}
              kind={kind}
              onUpdate={(fields) => update.mutate({ id: kind.id, ...fields })}
              onDelete={() => remove.mutate({ id: kind.id })}
            />
          ))}
          {customKinds.length === 0 && (
            <p className="rounded-xl border border-dashed p-4 text-center text-[13px] text-muted-foreground">
              No custom kinds yet
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-xl border bg-muted/40 p-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Kind name — e.g. Demo, Skit, Ad read…"
          />
          <ColorPicker value={color} onChange={setColor} />
          <Input
            value={guide}
            onChange={(e) => setGuide(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Coach guidance (optional)"
          />
          <Button onClick={submit} disabled={!name.trim() || create.isPending}>
            <Plus className="size-4" /> Add kind
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function KindRow({
  kind,
  onUpdate,
  onDelete,
}: {
  kind: CustomBeatKind;
  onUpdate: (fields: { name?: string; color?: string; guide?: string | null }) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="group rounded-xl border p-2.5">
      <div className="flex items-center gap-2.5">
        <button
          aria-label="Change color"
          onClick={() => setPickerOpen((o) => !o)}
          className="size-4 shrink-0 rounded-full"
          style={{ backgroundColor: kind.color }}
        />
        <input
          value={name ?? kind.name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            if (name !== null && name.trim() && name !== kind.name) {
              onUpdate({ name: name.trim() });
            }
            setName(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none"
        />
        <button
          aria-label={`Delete ${kind.name}`}
          onClick={onDelete}
          className="opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
        </button>
      </div>
      {pickerOpen && (
        <div className="mt-2">
          <ColorPicker
            value={kind.color}
            onChange={(color) => {
              onUpdate({ color });
              setPickerOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
