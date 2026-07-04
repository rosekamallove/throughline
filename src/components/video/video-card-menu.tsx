"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, MoreVertical, PenLine, SquarePlay, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { STAGES, STAGE_META, type Stage } from "@/lib/stages";
import { cn } from "@/lib/utils";
import type { Video } from "@/trpc/types";
import { useTRPC } from "@/trpc/client";

export function VideoCardMenu({ video, className }: { video: Video; className?: string }) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: trpc.video.list.queryKey() });

  const setStage = useMutation(
    trpc.video.setStage.mutationOptions({
      onSuccess: invalidate,
      onError: (e) => toast.error(e.message),
    }),
  );
  const deleteVideo = useMutation(
    trpc.video.delete.mutationOptions({
      onSuccess: () => {
        invalidate();
        toast.success("Video deleted");
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  // Cards live inside <Link>s — keep menu interactions from navigating.
  const stop = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div onClick={stop} onPointerDown={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Video options"
          className={cn(
            "rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground",
            className,
          )}
        >
          <MoreVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={() => router.push(`/video/${video.id}`)}>
            <PenLine className="size-4" /> Open
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/video/${video.id}/script`)}>
            <SquarePlay className="size-4" /> Open script
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <ArrowRight className="mr-2 size-4 text-muted-foreground" /> Move to
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                {STAGES.filter((s) => s !== video.stage).map((s: Stage) => (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => setStage.mutate({ id: video.id, stage: s })}
                  >
                    <span className={cn("size-2 rounded-full", STAGE_META[s].dot)} />
                    {STAGE_META[s].label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="size-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{video.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              The script, packaging options, and checklist go with it. This can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteVideo.mutate({ id: video.id })}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
