import Image from "next/image";
import Link from "next/link";

import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";

/** Two sections: hero with the editor, bento with everything else. */
export function Landing() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <section className="relative">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="flex items-center gap-2.5">
            <LogoMark className="size-8" />
            <span className="text-base font-semibold tracking-tight">Throughline</span>
          </span>
          <Button asChild variant="secondary" size="sm" className="rounded-full">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </nav>

        <div className="mx-auto max-w-6xl px-6 pt-14 text-center sm:pt-20">
          <p className="mono-label duration-500 animate-in fade-in">
            For solo YouTube creators
          </p>
          <h1 className="mx-auto mt-5 max-w-3xl text-balance text-5xl font-bold leading-[1.04] tracking-tight duration-500 animate-in fade-in slide-in-from-bottom-2 sm:text-6xl">
            Write videos that keep people watching
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground delay-100 duration-500 animate-in fade-in slide-in-from-bottom-2">
            Script in beats with live pacing, plan every shot where you wrote it,
            and run each video from idea to published on one board.
          </p>
          <div className="mt-8 delay-150 duration-500 animate-in fade-in slide-in-from-bottom-2">
            <Button asChild size="lg" className="rounded-full px-7 active:scale-[0.97]">
              <Link href="/sign-in">Start writing</Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-6xl px-6 delay-200 duration-700 animate-in fade-in slide-in-from-bottom-4">
          <div className="relative overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-foreground/10">
            <Image
              src="/landing/editor.png"
              alt="The Throughline script editor: beats with live pacing, shots and research in the rail"
              width={1720}
              height={1000}
              priority
              className="w-full"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/60 to-transparent"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-10 pt-20 sm:pt-28">
        <div className="grid gap-3 md:grid-cols-3 md:[grid-template-rows:auto_auto_auto]">
          <Tile className="md:col-span-2 md:row-span-2">
            <TileText
              title="Your channel is the dashboard"
              body="Published videos with real thumbnails and numbers, next to what you're making. Titles and thumbnails get judged in the feed, not in a vacuum."
            />
            <Bleed src="/landing/channel.png" alt="The dashboard: your channel feed with drafts and published videos" />
          </Tile>

          <Tile>
            <TileText
              title="Shots anchored to your words"
              body="Highlight a line, capture the b-roll idea. The words stay marked in the script."
            />
            <div className="px-6 pb-6">
              <div className="overflow-hidden rounded-lg border">
                <Image
                  src="/landing/shot.png"
                  alt="A hook beat with the shot's words highlighted in amber"
                  width={636}
                  height={115}
                  className="w-full"
                />
              </div>
            </div>
          </Tile>

          <Tile>
            <TileText
              title="Research on the same screen"
              body="Notes as documents, reference videos playable in the rail. Nothing lives in another tab."
            />
            <div className="relative min-h-[240px] flex-1">
              <div className="absolute inset-x-6 top-0 overflow-hidden rounded-t-xl border shadow-sm">
                <Image
                  src="/landing/research.png"
                  alt="Research pages and a playable reference video in the editor rail"
                  width={302}
                  height={570}
                  className="w-full"
                />
              </div>
            </div>
          </Tile>

          <Tile className="md:col-span-2">
            <TileText
              title="Idea to published, one board"
              body="Six stages with drag and drop. Capture ideas at the bottom of the column, ship them out the other end."
            />
            <Bleed src="/landing/board.png" alt="The pipeline board with six stages" />
          </Tile>

          <Tile>
            <TileText
              title="Hear it before you record"
              body="One click reads the script aloud, per beat or start to finish, so you can judge the flow."
            />
            <div className="px-6 pb-6">
              <div className="overflow-hidden rounded-lg border">
                <Image
                  src="/landing/listen.png"
                  alt="The Listen control with its voice picker open"
                  width={480}
                  height={380}
                  className="w-full"
                />
              </div>
            </div>
          </Tile>
        </div>

        <p className="mt-14 pb-6 text-center text-sm text-muted-foreground">
          Private beta ·{" "}
          <Link href="/sign-in" className="underline-offset-4 hover:text-foreground hover:underline">
            Sign in
          </Link>
        </p>
      </section>
    </div>
  );
}

function Tile({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border bg-card ${className}`}
    >
      {children}
    </div>
  );
}

function TileText({ title, body }: { title: string; body: string }) {
  return (
    <div className="p-6">
      <h3 className="text-[15px] font-semibold">{title}</h3>
      <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  );
}

/** Screenshot that bleeds off the tile's bottom-right corner. */
function Bleed({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative min-h-[260px] flex-1">
      <div className="absolute inset-y-0 left-6 right-0 overflow-hidden rounded-tl-xl border-l border-t shadow-sm">
        <Image
          src={src}
          alt={alt}
          width={1720}
          height={1000}
          className="h-full w-full object-cover object-left-top"
        />
      </div>
    </div>
  );
}
