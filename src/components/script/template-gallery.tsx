"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookmarkPlus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { resolveBeatMeta, type CustomBeatKind } from "@/lib/beats";
import { SCRIPT_TEMPLATES, type ScriptTemplate } from "@/lib/templates";
import { useTRPC } from "@/trpc/client";

function StructureStrip({
  template,
  customKinds,
}: {
  template: ScriptTemplate;
  customKinds: CustomBeatKind[];
}) {
  return (
    <div className="flex h-1.5 w-full gap-px overflow-hidden rounded-full">
      {template.beats.map((b, i) => (
        <span
          key={i}
          className="flex-1"
          style={resolveBeatMeta(b.kind, customKinds).dotStyle}
        />
      ))}
    </div>
  );
}

function TemplatePreview({
  template,
  customKinds,
  onBack,
  onUse,
}: {
  template: ScriptTemplate;
  customKinds: CustomBeatKind[];
  onBack: () => void;
  onUse: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-col gap-4">
      <StructureStrip template={template} customKinds={customKinds} />
      <ScrollArea className="max-h-[55vh] pr-3">
        <ol className="flex flex-col gap-2.5">
          {template.beats.map((beat, i) => {
            const meta = resolveBeatMeta(beat.kind, customKinds);
            return (
              <li
                key={i}
                className="rounded-xl border-l-[3px] bg-muted/50 p-3"
                style={meta.barStyle}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[1.5px]"
                    style={meta.tagStyle}
                  >
                    {meta.label}
                  </span>
                  <span className="text-sm font-medium">{beat.label}</span>
                </div>
                {beat.guide && (
                  <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">
                    {beat.guide}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </ScrollArea>
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-4" /> All templates
        </Button>
        <Button onClick={onUse}>Use this template</Button>
      </div>
    </div>
  );
}

export function TemplateGalleryDialog({
  open,
  onOpenChange,
  videoId,
  scriptHasContent,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  scriptHasContent: boolean;
  onApply: (templateId: string) => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState<ScriptTemplate | null>(null);
  const [confirmFor, setConfirmFor] = useState<ScriptTemplate | null>(null);
  const [saveName, setSaveName] = useState("");

  const { data: userTemplates = [] } = useQuery({
    ...trpc.beat.templates.queryOptions(),
    enabled: open,
  });
  const { data: customKinds = [] } = useQuery({
    ...trpc.beat.kinds.queryOptions(),
    enabled: open,
  });

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: trpc.beat.templates.queryKey() });

  const saveTemplate = useMutation(
    trpc.beat.templateSave.mutationOptions({
      onSuccess: (t) => {
        invalidate();
        toast.success(`Saved “${t.name}”`);
      },
      onError: (e) => toast.error(e.message),
    }),
  );
  const deleteTemplate = useMutation(
    trpc.beat.templateDelete.mutationOptions({
      onSuccess: invalidate,
      onError: (e) => toast.error(e.message),
    }),
  );

  const mine: ScriptTemplate[] = userTemplates.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    beats: t.beats.map((b) => ({ ...b, guide: b.guide ?? undefined })),
  }));

  function use(template: ScriptTemplate) {
    if (scriptHasContent) {
      setConfirmFor(template);
      return;
    }
    onApply(template.id);
    close();
  }

  function close() {
    setPreview(null);
    onOpenChange(false);
  }

  function card(template: ScriptTemplate, deletable: boolean) {
    return (
      <div
        key={template.id}
        role="button"
        tabIndex={0}
        onClick={() => setPreview(template)}
        onKeyDown={(e) => e.key === "Enter" && setPreview(template)}
        className="group relative flex cursor-pointer flex-col gap-2.5 rounded-xl border bg-card p-4 text-left transition-colors hover:border-ring hover:bg-accent/40"
      >
        <StructureStrip template={template} customKinds={customKinds} />
        <div className="flex-1">
          <p className="text-sm font-semibold">{template.name}</p>
          {template.description && (
            <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
              {template.description}
            </p>
          )}
        </div>
        <div className="relative h-8">
          <p className="mono-label absolute inset-y-0 left-0 hidden items-center transition-[opacity,translate] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] pointer-fine:flex pointer-fine:group-hover:-translate-y-1 pointer-fine:group-hover:opacity-0 pointer-fine:group-focus-within:opacity-0">
            {template.beats.length} beats
          </p>
          <div className="absolute inset-0 flex items-center justify-end gap-1.5 transition-[opacity,translate] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] pointer-fine:translate-y-1 pointer-fine:opacity-0 pointer-fine:group-hover:translate-y-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:translate-y-0 pointer-fine:group-focus-within:opacity-100">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground active:scale-[0.97]"
              onClick={(e) => {
                e.stopPropagation();
                setPreview(template);
              }}
            >
              Preview
            </Button>
            <Button
              size="sm"
              className="active:scale-[0.97]"
              onClick={(e) => {
                e.stopPropagation();
                use(template);
              }}
            >
              Use template
            </Button>
          </div>
        </div>
        {deletable && (
          <button
            aria-label={`Delete ${template.name}`}
            onClick={(e) => {
              e.stopPropagation();
              deleteTemplate.mutate({ id: template.id });
            }}
            className="absolute right-2 top-2 rounded-full p-1 opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100"
          >
            <X className="size-3.5 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) setPreview(null);
          onOpenChange(o);
        }}
      >
        <DialogContent
          className="sm:max-w-5xl"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{preview ? preview.name : "Script templates"}</DialogTitle>
            <DialogDescription>
              {preview
                ? preview.description || "Your template"
                : "Proven beat structures. Pick one and make it yours — labels, guides, and pacing come pre-wired."}
            </DialogDescription>
          </DialogHeader>

          {preview ? (
            <TemplatePreview
              template={preview}
              customKinds={customKinds}
              onBack={() => setPreview(null)}
              onUse={() => use(preview)}
            />
          ) : (
            <ScrollArea className="max-h-[65vh] pr-3">
              <div className="flex flex-col gap-5">
                {mine.length > 0 && (
                  <div>
                    <p className="mono-label mb-2">Your templates</p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {mine.map((t) => card(t, true))}
                    </div>
                  </div>
                )}
                <div>
                  {mine.length > 0 && <p className="mono-label mb-2">Built-in</p>}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {SCRIPT_TEMPLATES.map((t) => card(t, false))}
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl border bg-muted/40 p-3">
                  <BookmarkPlus className="size-4 shrink-0 text-muted-foreground" />
                  <Input
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Save this video's beat structure as a template…"
                    className="h-9 border-none bg-transparent shadow-none"
                  />
                  <Button
                    size="sm"
                    disabled={!saveName.trim() || saveTemplate.isPending}
                    onClick={() => {
                      saveTemplate.mutate({ videoId, name: saveName.trim() });
                      setSaveName("");
                    }}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
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
                close();
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
