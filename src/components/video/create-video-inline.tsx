"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/trpc/client";

/** "+ Create" morphs into an inline title input — a video is just a title,
 *  no modal needed. */
export function CreateVideoInline() {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  const create = useMutation(
    trpc.video.create.mutationOptions({
      onSuccess: (video) => {
        void queryClient.invalidateQueries({ queryKey: trpc.video.list.queryKey() });
        setOpen(false);
        setTitle("");
        router.push(`/video/${video.id}`);
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  function close() {
    setOpen(false);
    setTitle("");
  }

  if (!open) {
    return (
      <Button
        variant="secondary"
        className="hidden rounded-full active:scale-[0.97] sm:inline-flex"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" /> Create
      </Button>
    );
  }

  return (
    <div className="relative duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] animate-in fade-in slide-in-from-right-2">
      <Plus className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        autoFocus
        value={title}
        disabled={create.isPending}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && title.trim() && !create.isPending) {
            create.mutate({ title: title.trim() });
          }
          if (e.key === "Escape") close();
        }}
        onBlur={() => {
          if (!title.trim() && !create.isPending) close();
        }}
        placeholder="Working title, Enter to create"
        className="h-9 w-72 rounded-full pl-9"
      />
    </div>
  );
}
