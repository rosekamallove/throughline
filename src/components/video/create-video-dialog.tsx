"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/trpc/client";

export function CreateVideoDialog() {
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

  function submit() {
    if (!title.trim() || create.isPending) return;
    create.mutate({ title: title.trim() });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="hidden rounded-full sm:inline-flex">
          <Plus className="size-4" /> Create
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New video</DialogTitle>
          <DialogDescription>
            Starts as an idea with a beat skeleton and checklist ready to go.
          </DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Working title…"
        />
        <DialogFooter>
          <Button onClick={submit} disabled={!title.trim() || create.isPending}>
            {create.isPending ? "Creating…" : "Create video"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
