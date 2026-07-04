"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Link2, Link2Off } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/trpc/client";

/** Link a Throughline video to its published YouTube upload so a sync updates
 *  this card instead of importing a duplicate. */
export function YouTubeLink({
  videoId,
  youtubeVideoId,
}: {
  videoId: string;
  youtubeVideoId: string | null;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: trpc.video.byId.queryKey({ id: videoId }) });
    void queryClient.invalidateQueries({ queryKey: trpc.video.list.queryKey() });
  };

  const link = useMutation(
    trpc.video.linkYouTube.mutationOptions({
      onSuccess: (res) => {
        invalidate();
        setUrl("");
        toast.success(
          res.absorbed ? "Linked and merged the imported copy" : "Linked to YouTube",
        );
      },
      onError: (e) => toast.error(e.message),
    }),
  );
  const unlink = useMutation(
    trpc.video.unlinkYouTube.mutationOptions({
      onSuccess: () => {
        invalidate();
        toast.success("Unlinked from YouTube");
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  if (youtubeVideoId) {
    const watchUrl = `https://youtu.be/${youtubeVideoId}`;
    return (
      <div>
        <p className="mono-label mb-2">YouTube</p>
        <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px]">
          <span className="size-2 shrink-0 rounded-full bg-stage-published" />
          <a
            href={watchUrl}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 flex-1 truncate hover:underline"
          >
            youtu.be/{youtubeVideoId}
          </a>
          <a href={watchUrl} target="_blank" rel="noreferrer" aria-label="Open on YouTube">
            <ExternalLink className="size-3.5 text-muted-foreground hover:text-foreground" />
          </a>
          <button
            onClick={() => unlink.mutate({ id: videoId })}
            disabled={unlink.isPending}
            aria-label="Unlink from YouTube"
            className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <Link2Off className="size-3.5" />
          </button>
        </div>
        <p className="mt-1.5 text-[12px] text-muted-foreground">
          Sync refreshes this video&rsquo;s views, CTR, and thumbnail.
        </p>
      </div>
    );
  }

  const submit = () => {
    if (url.trim() && !link.isPending) link.mutate({ id: videoId, url: url.trim() });
  };

  return (
    <div>
      <p className="mono-label mb-2">YouTube</p>
      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Paste the video&rsquo;s YouTube URL…"
          className="h-9 text-[13px]"
        />
        <Button variant="secondary" disabled={!url.trim() || link.isPending} onClick={submit}>
          <Link2 className="size-4" /> Link
        </Button>
      </div>
      <p className="mt-1.5 text-[12px] text-muted-foreground">
        Connect this to the published video so a sync updates it instead of adding a duplicate.
      </p>
    </div>
  );
}
