"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BarChart3 } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { toast } from "sonner";

import { TitleOptions } from "@/components/packaging/title-options";
import { VariantGrid } from "@/components/packaging/variant-grid";
import { VideoCard } from "@/components/video/video-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/trpc/client";

export default function PackagingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: video } = useQuery(trpc.video.byId.queryOptions({ id }));

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: trpc.video.byId.queryKey({ id }) });
    void queryClient.invalidateQueries({ queryKey: trpc.video.list.queryKey() });
  };

  const select = useMutation(
    trpc.packaging.select.mutationOptions({
      onSuccess: invalidate,
      onError: (e) => toast.error(e.message),
    }),
  );
  const create = useMutation(
    trpc.packaging.create.mutationOptions({
      onSuccess: invalidate,
      onError: (e) => toast.error(e.message),
    }),
  );
  const remove = useMutation(
    trpc.packaging.delete.mutationOptions({
      onSuccess: invalidate,
      onError: (e) => toast.error(e.message),
    }),
  );

  if (!video) {
    return (
      <div className="mx-auto max-w-[1040px] p-6">
        <Skeleton className="h-8 w-48" />
        <div className="mt-6 grid grid-cols-[1.4fr_1fr] gap-8">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const thumbnails = video.variants.filter((v) => v.kind === "thumbnail");
  const titles = video.variants.filter((v) => v.kind === "title");

  return (
    <div className="mx-auto w-full max-w-[1040px] px-6 pb-16 pt-4">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href={`/video/${id}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back
        </Link>
        <h1 className="text-sm font-medium">Title &amp; Thumbnail</h1>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-8">
          <section>
            <p className="mono-label mb-3">Thumbnail options</p>
            <VariantGrid
              variants={thumbnails}
              onSelect={(variantId) => select.mutate({ variantId })}
              onDelete={(variantId) => remove.mutate({ id: variantId })}
              onCreate={({ color, lines }) =>
                create.mutate({ kind: "thumbnail", videoId: id, color, thumbText: lines })
              }
            />
          </section>

          <section>
            <p className="mono-label mb-3">Title options</p>
            <TitleOptions
              variants={titles}
              onSelect={(variantId) => select.mutate({ variantId })}
              onDelete={(variantId) => remove.mutate({ id: variantId })}
              onCreate={(title) => create.mutate({ kind: "title", videoId: id, title })}
            />
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section>
            <p className="mono-label mb-3">Preview — in feed</p>
            <div className="rounded-2xl border border-border bg-muted p-4">
              <VideoCard video={{ ...video, views: video.views ?? 12_400 }} viewerMode />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <BarChart3 className="size-4 text-muted-foreground" /> Test your packaging
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
              Get quick gut-check votes on your title + thumbnail combos before you publish.
            </p>
            <Button
              className="mt-4 w-full"
              onClick={() => toast.info("Feedback polls are coming with the YouTube sync (v1.1)")}
            >
              Start a feedback poll
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}
