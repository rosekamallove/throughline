"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Play, RefreshCw } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { YOUTUBE_SCOPES } from "@/lib/youtube-scopes";
import { useTRPC } from "@/trpc/client";

const BENEFITS = [
  "Import your published videos",
  "Real thumbnails, views & duration on every card",
  "Packaging judged next to the real thing",
];

export default function ConnectPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: status } = useQuery(trpc.youtube.status.queryOptions());

  const sync = useMutation(
    trpc.youtube.sync.mutationOptions({
      onSuccess: (r) => {
        toast.success(
          `Synced ${r.channel}: ${r.created} imported, ${r.updated} updated`,
        );
        void queryClient.invalidateQueries({ queryKey: trpc.video.list.queryKey() });
        void queryClient.invalidateQueries({ queryKey: trpc.youtube.status.queryKey() });
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  async function connect() {
    const { error } = await authClient.linkSocial({
      provider: "google",
      callbackURL: "/connect",
      scopes: YOUTUBE_SCOPES,
    });
    if (error) toast.error(error.message ?? "Could not start Google sign-in");
  }

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="w-full max-w-[460px] rounded-2xl border bg-card p-8 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
          <Play className="size-6 fill-primary-foreground text-primary-foreground" />
        </span>
        <h1 className="mt-5 text-[26px] font-bold leading-tight">
          Connect your YouTube channel
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Pull in your published videos so every title and thumbnail decision is
          made in context — next to the real thing, with real numbers.
        </p>

        <ul className="mt-6 flex flex-col gap-2.5 rounded-xl border bg-muted/50 p-4 text-left">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-center gap-3 text-sm">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-saved-dot/15">
                <Check className="size-3 text-saved-dot" />
              </span>
              {benefit}
            </li>
          ))}
        </ul>

        {!status ? (
          <Skeleton className="mt-6 h-10 w-full" />
        ) : !status.configured ? (
          <div className="mt-6 rounded-xl border border-dashed p-4 text-left text-[13px] leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">One-time setup needed</p>
            <p className="mt-1">
              Create a Google Cloud OAuth client (enable the YouTube Data API v3
              and YouTube Analytics API), then set{" "}
              <code className="font-mono">GOOGLE_CLIENT_ID</code> and{" "}
              <code className="font-mono">GOOGLE_CLIENT_SECRET</code> in{" "}
              <code className="font-mono">.env</code> and restart. Steps are in
              the README.
            </p>
          </div>
        ) : !status.connected ? (
          <Button className="mt-6 w-full" onClick={connect}>
            <Play className="size-4 fill-primary-foreground" /> Connect with YouTube
          </Button>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Connected ·{" "}
              {status.imported > 0
                ? `${status.imported} videos imported`
                : "no videos imported yet"}
            </p>
            <Button
              className="w-full"
              disabled={sync.isPending}
              onClick={() => sync.mutate()}
            >
              <RefreshCw className={sync.isPending ? "size-4 animate-spin" : "size-4"} />
              {sync.isPending ? "Syncing…" : "Sync published videos"}
            </Button>
          </div>
        )}

        <Link
          href="/"
          className="mt-4 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          Back to channel
        </Link>
      </div>
    </div>
  );
}
