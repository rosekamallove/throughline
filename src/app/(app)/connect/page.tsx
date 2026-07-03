"use client";

import { Check, Play } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

const BENEFITS = [
  "Import your published videos",
  "Live views & CTR on every card",
  "Packaging judged in your real feed",
];

export default function ConnectPage() {
  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="w-full max-w-[460px] rounded-2xl border border-border bg-card p-8 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary shadow-[0_8px_30px_rgba(255,0,0,.35)]">
          <Play className="size-6 fill-white text-white" />
        </span>
        <h1 className="mt-5 text-[26px] font-bold leading-tight">
          Connect your YouTube channel
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Pull in your published videos so every title and thumbnail decision is
          made in context — next to the real thing, with real numbers.
        </p>

        <ul className="mt-6 flex flex-col gap-2.5 rounded-xl border border-border bg-muted p-4 text-left">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-center gap-3 text-sm">
              <span className="flex size-5 items-center justify-center rounded-full bg-saved-dot/15">
                <Check className="size-3 text-saved-dot" />
              </span>
              {benefit}
            </li>
          ))}
        </ul>

        <Button
          className="mt-6 w-full"
          onClick={() =>
            toast.info("YouTube sync ships in v1.1 — the OAuth groundwork is already in place.")
          }
        >
          <Play className="size-4 fill-white" /> Connect with YouTube
        </Button>
        <Link
          href="/"
          className="mt-3 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          Maybe later
        </Link>
      </div>
    </div>
  );
}
