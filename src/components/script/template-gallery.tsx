"use client";

import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BEAT_META } from "@/lib/beats";
import { SCRIPT_TEMPLATES, type ScriptTemplate } from "@/lib/templates";
import { cn } from "@/lib/utils";

function StructureStrip({ template }: { template: ScriptTemplate }) {
  return (
    <div className="flex h-1.5 w-full gap-px overflow-hidden rounded-full">
      {template.beats.map((b, i) => (
        <span key={i} className={cn("flex-1", BEAT_META[b.kind].dot)} />
      ))}
    </div>
  );
}

export function TemplateGalleryDialog({
  open,
  onOpenChange,
  scriptHasContent,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When true, applying asks for confirmation (it replaces the beats). */
  scriptHasContent: boolean;
  onApply: (templateId: string) => void;
}) {
  const [confirmFor, setConfirmFor] = useState<ScriptTemplate | null>(null);

  function pick(template: ScriptTemplate) {
    if (scriptHasContent) {
      setConfirmFor(template);
      return;
    }
    onApply(template.id);
    onOpenChange(false);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Script templates</DialogTitle>
            <DialogDescription>
              Proven beat structures. Pick one and make it yours — labels, guides, and
              pacing come pre-wired.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-3">
            <div className="grid gap-3 sm:grid-cols-2">
              {SCRIPT_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => pick(template)}
                  className="flex flex-col gap-2.5 rounded-xl border bg-card p-4 text-left transition-colors hover:border-ring hover:bg-accent/40"
                >
                  <StructureStrip template={template} />
                  <div>
                    <p className="text-sm font-semibold">{template.name}</p>
                    <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
                      {template.description}
                    </p>
                  </div>
                  <p className="mono-label">{template.beats.length} beats</p>
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmFor !== null} onOpenChange={(o) => !o && setConfirmFor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace the current script?</AlertDialogTitle>
            <AlertDialogDescription>
              Applying “{confirmFor?.name}” replaces your existing beats and their text.
              This can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my script</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmFor) onApply(confirmFor.id);
                setConfirmFor(null);
                onOpenChange(false);
              }}
            >
              Replace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
