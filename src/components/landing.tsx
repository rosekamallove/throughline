import { ChevronDown, Check, FileText, Play, Plus, Volume2 } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Two sections: hero with a crafted editor mock, bento of feature mocks.
 *  Everything is built from the product's own tokens; no screenshots. */
export function Landing() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <section className="relative">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo className="text-[22px]" />
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
          <EditorMock />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-10 pt-20 sm:pt-24">
        <div className="grid gap-3 md:grid-cols-3">
          <Tile className="md:col-span-2 md:row-span-2">
            <TileText
              title="Your channel is the dashboard"
              body="Published videos with real numbers, next to what you're making. Titles and thumbnails get judged in the feed, not in a vacuum."
            />
            <FeedMock />
          </Tile>

          <Tile>
            <TileText
              title="Shots anchored to your words"
              body="Highlight a line, capture the b-roll idea. The words stay marked in the script."
            />
            <ShotMock />
          </Tile>

          <Tile>
            <TileText
              title="Research on the same screen"
              body="Notes as documents, reference videos playable in the rail. Nothing lives in another tab."
            />
            <ResearchMock />
          </Tile>

          <Tile className="md:col-span-2">
            <TileText
              title="Idea to published, one board"
              body="Six stages with drag and drop. Capture ideas at the bottom of the column, ship them out the other end."
            />
            <BoardMock />
          </Tile>

          <Tile>
            <TileText
              title="Hear it before you record"
              body="One click reads the script aloud, per beat or start to finish, so you can judge the flow."
            />
            <ListenMock />
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

/* ------------------------------------------------------------------ */
/* shared scraps                                                       */

const BEAT = {
  hook: "var(--beat-hook)",
  rehook: "var(--beat-rehook)",
  body: "var(--beat-body)",
  conclusion: "var(--beat-conclusion)",
} as const;

function BeatTag({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="rounded-md px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[1.5px]"
      style={{
        color,
        background: `color-mix(in oklab, ${color} 16%, transparent)`,
      }}
    >
      {children}
    </span>
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
    <div className={cn("flex flex-col overflow-hidden rounded-2xl border bg-card", className)}>
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

/* ------------------------------------------------------------------ */
/* hero: three-pane editor                                             */

const OUTLINE = [
  { color: BEAT.hook, label: "Hook", time: "0:13" },
  { color: BEAT.body, label: "Context · Night owl", time: "0:38" },
  { color: BEAT.rehook, label: "Re-hook", time: "0:09" },
  { color: BEAT.body, label: "Week 1 · The pain", time: "1:42" },
  { color: BEAT.body, label: "Week 2 · The crash", time: "1:36" },
  { color: BEAT.body, label: "Week 3 · The turn", time: "1:48" },
  { color: BEAT.body, label: "Week 4 · Autopilot", time: "1:24" },
  { color: BEAT.conclusion, label: "Conclusion · Verdict", time: "0:42" },
] as const;

const PACING = [
  { color: BEAT.hook, w: "3%" },
  { color: BEAT.body, w: "8%" },
  { color: BEAT.rehook, w: "2%" },
  { color: BEAT.body, w: "21%" },
  { color: BEAT.body, w: "20%" },
  { color: BEAT.body, w: "22%" },
  { color: BEAT.body, w: "17%" },
  { color: BEAT.conclusion, w: "7%" },
] as const;

const HERO_THUMB = { color: "#0C8599", lines: ["I WOKE UP", "AT *5AM*", "30 DAYS"] } as const;

function EditorMock() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card text-left shadow-2xl shadow-foreground/10">
      <div className="grid md:grid-cols-[236px_minmax(0,1fr)_252px]">
        {/* outline rail */}
        <aside className="hidden border-r p-5 md:block">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>← Back</span>
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-saved-dot" /> Saved
            </span>
          </div>
          <div
            className="mt-4 flex aspect-video items-center justify-center rounded-lg px-2"
            style={{ background: HERO_THUMB.color }}
          >
            <span className="font-anton text-center text-[15px] leading-[1.08] tracking-wide text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.25)]">
              {HERO_THUMB.lines.map((line) => (
                <ThumbLine key={line} line={line} />
              ))}
            </span>
          </div>
          <div className="mt-3 flex gap-2">
            <MiniStat value="8:12" label="runtime" />
            <MiniStat value="1,132" label="words" />
          </div>
          <p className="mono-label mt-5">Script outline</p>
          <ul className="mt-2 flex flex-col gap-0.5">
            {OUTLINE.map((row) => (
              <li
                key={row.label}
                className="flex items-center gap-2 rounded-md px-1.5 py-1 text-[11px] first:bg-muted"
              >
                <span className="size-1.5 shrink-0 rounded-full" style={{ background: row.color }} />
                <span className="truncate">{row.label}</span>
                <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                  {row.time}
                </span>
              </li>
            ))}
          </ul>
        </aside>

        {/* script */}
        <div className="p-6 sm:p-9">
          <div className="flex items-center justify-between">
            <p className="mono-label">Script</p>
            <span className="flex items-center overflow-hidden rounded-full bg-secondary text-[11px] font-medium">
              <span className="flex items-center gap-1.5 py-1 pl-3 pr-2">
                <Volume2 className="size-3" /> Listen
              </span>
              <span aria-hidden className="h-3 w-px bg-border" />
              <span className="px-1.5 py-1">
                <ChevronDown className="size-3 text-muted-foreground" />
              </span>
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            I woke up at 5AM for 30 days
          </h2>
          <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">
            8 beats · 1,132 words · 8:12
          </p>

          <div className="mt-7 flex flex-col gap-6">
            <div className="border-l-2 pl-4" style={{ borderColor: BEAT.hook }}>
              <div className="flex items-baseline gap-2">
                <BeatTag color={BEAT.hook}>Hook</BeatTag>
                <span className="text-[11px] font-medium text-muted-foreground">Hook</span>
                <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                  31w · 0:13
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                Every productivity guru swears the 5AM club changed their life. So
                I <span className="shot-mark">set my alarm for 5AM, thirty days straight</span>,
                and tracked everything: sleep, focus, mood. Day 12 nearly broke me.
              </p>
            </div>

            <div className="pl-4">
              <div className="flex items-baseline gap-2">
                <BeatTag color={BEAT.body}>Body</BeatTag>
                <span className="text-[11px] font-medium text-muted-foreground">
                  Context · Night owl
                </span>
                <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                  87w · 0:38
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                Quick context: I have not willingly seen a sunrise in ten years. My
                best work ships after midnight, which is exactly why this needed to
                happen…
              </p>
            </div>

            <div className="pl-4">
              <div className="flex items-baseline gap-2">
                <BeatTag color={BEAT.rehook}>Re-hook</BeatTag>
                <span className="text-[11px] font-medium text-muted-foreground">Re-hook</span>
                <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                  20w · 0:09
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                Stick around for week three, because the one change that actually
                stuck is not what you think.
              </p>
            </div>

            <div className="hidden pl-4 sm:block">
              <div className="flex items-baseline gap-2">
                <BeatTag color={BEAT.body}>Body</BeatTag>
                <span className="text-[11px] font-medium text-muted-foreground">
                  Week 1 · The pain
                </span>
                <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                  234w · 1:42
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                Day one felt like a superpower. By day four the snooze button was
                winning, and Friday night I fell asleep at 9PM in my street
                clothes…
              </p>
            </div>
          </div>
        </div>

        {/* coach rail */}
        <aside className="hidden border-l p-5 lg:block">
          <p className="mono-label">Pacing</p>
          <div className="mt-2.5 flex h-1.5 gap-px overflow-hidden rounded-full">
            {PACING.map((seg, i) => (
              <span key={i} style={{ background: seg.color, width: seg.w }} />
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            <span style={{ color: BEAT.hook }}>Hook</span>
            <span className="font-mono"> · 3% of runtime</span>
          </p>

          <p className="mono-label mt-6">B-roll &amp; shots · 4</p>
          <ul className="mt-2 flex flex-col gap-2">
            <MiniShotRow text="Alarm macro: 5:00 flip" done />
            <MiniShotRow text="Day 1 diary cam" done />
            <MiniShotRow text="Timelapse: sunrise desk" />
            <MiniShotRow text="Coffee pour close-up" />
          </ul>

          <p className="mono-label mt-6">Research · 2</p>
          <ul className="mt-2 flex flex-col gap-1.5 text-[11px]">
            <li className="flex items-center gap-1.5">
              <FileText className="size-3 shrink-0 text-muted-foreground" />
              Sleep study notes
            </li>
            <li className="flex items-center gap-1.5">
              <FileText className="size-3 shrink-0 text-muted-foreground" />
              5AM club teardown
            </li>
          </ul>

          <p className="mono-label mt-6">References · 1</p>
          <div className="mt-2 flex items-center gap-2 rounded-lg border bg-background px-2.5 py-1.5 text-[11px] text-muted-foreground">
            <Play className="size-3 shrink-0 fill-current" />
            <span className="truncate">youtube.com/watch?v=Vv8…</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 rounded-lg border px-2.5 py-1.5">
      <p className="font-mono text-sm font-semibold">{value}</p>
      <p className="mono-label mt-0.5 !text-[8px]">{label}</p>
    </div>
  );
}

function MiniShotRow({ text, done = false }: { text: string; done?: boolean }) {
  return (
    <li className="flex items-center gap-2 text-[11px]">
      <span
        className={cn(
          "flex size-3.5 shrink-0 items-center justify-center rounded border",
          done && "border-transparent bg-primary text-primary-foreground",
        )}
      >
        {done && <Check className="size-2.5" />}
      </span>
      <span className={cn(done && "text-muted-foreground line-through")}>{text}</span>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* bento mocks                                                         */

const FEED = [
  {
    color: "#0C8599",
    lines: ["I WOKE UP", "AT *5AM*", "30 DAYS"],
    title: "I woke up at 5AM for 30 days",
    meta: "In Production · finish the rough cut",
    stage: "var(--stage-production)",
  },
  {
    color: "#2F9E44",
    lines: ["I SPENT", "*$5,000*", "ON ADS"],
    title: "I spent $5,000 on Google Ads",
    meta: "Scripting · finish the script",
    stage: "var(--stage-scripting)",
  },
  {
    color: "#3B5BDB",
    lines: ["RANK *#1*", "IN CHATGPT"],
    title: "How to rank in ChatGPT in 7 Days",
    meta: "142K views · 3 weeks ago",
    stage: "var(--stage-published)",
  },
  {
    color: "#E8590C",
    lines: ["YOUR NEXT", "*$1M* APP", "IN 2 MIN"],
    title: "Find your next app idea in 2 minutes",
    meta: "89K views · 1 month ago",
    stage: "var(--stage-published)",
  },
] as const;

function ThumbLine({ line }: { line: string }) {
  const parts = line.split(/\*(.+?)\*/);
  return (
    <span className="block">
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} style={{ color: "var(--thumb-accent)" }}>
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </span>
  );
}

function FeedMock() {
  return (
    <div className="grid flex-1 grid-cols-2 gap-x-5 gap-y-6 px-6 pb-6">
      {FEED.map((v) => (
        <div key={v.title} className="min-w-0">
          <div
            className="flex aspect-video items-center justify-center rounded-xl px-3"
            style={{ background: v.color }}
          >
            <span className="font-anton text-center text-[clamp(14px,2.2vw,22px)] leading-[1.08] tracking-wide text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.25)]">
              {v.lines.map((line) => (
                <ThumbLine key={line} line={line} />
              ))}
            </span>
          </div>
          <p className="mt-2 flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-[1.5px] text-muted-foreground">
            <span className="size-1.5 rounded-full" style={{ background: v.stage }} />
            {v.meta.split(" · ")[0]}
          </p>
          <p className="mt-0.5 truncate text-[13px] font-medium">{v.title}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {v.meta.split(" · ")[1]}
          </p>
        </div>
      ))}
    </div>
  );
}

function ShotMock() {
  return (
    <div className="px-6 pb-6">
      <p className="text-[13px] leading-relaxed text-foreground/90">
        …opens with <span className="shot-mark">the product in hand</span>, no
        intro at all…
      </p>
      <div className="mt-3 rounded-lg border bg-background px-3 py-2">
        <div className="flex items-center gap-2.5">
          <span className="size-3.5 shrink-0 rounded border" />
          <span className="text-[12px]">Screen-rec: product close-up</span>
        </div>
        <p className="mt-1 truncate pl-6 text-[10px] italic text-muted-foreground">
          &ldquo;the product in hand&rdquo;
        </p>
      </div>
    </div>
  );
}

function ResearchMock() {
  return (
    <div className="flex flex-1 flex-col gap-2.5 px-6 pb-6">
      <p className="mono-label">Research · 2</p>
      <div className="rounded-lg border bg-background">
        <div className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium">
          <FileText className="size-3 text-muted-foreground" /> Competitor teardown
        </div>
        <p className="border-t px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          MKBHD opens with the product in hand. No intro.
        </p>
      </div>
      <p className="mono-label mt-1.5">References · 1</p>
      <div className="overflow-hidden rounded-lg border bg-background">
        <div className="flex aspect-video items-center justify-center bg-foreground/80">
          <span className="flex size-8 items-center justify-center rounded-full bg-black/70">
            <Play className="size-3.5 fill-white text-white" />
          </span>
        </div>
        <p className="truncate px-3 py-1.5 text-[11px] text-muted-foreground">
          youtube.com/watch?v=dQw4…
        </p>
      </div>
    </div>
  );
}

const BOARD_COLS = [
  {
    label: "Ideation",
    dot: "var(--stage-ideation)",
    cards: ["Idea: build in public for 7 days", "Idea: $1M niches with AI"],
    quickAdd: true,
  },
  {
    label: "Scripting",
    dot: "var(--stage-scripting)",
    cards: ["I spent $5,000 on Google Ads"],
    thumb: "#2F9E44",
  },
  {
    label: "Production",
    dot: "var(--stage-production)",
    cards: ["I woke up at 5AM for 30 days"],
    thumb: "#0C8599",
  },
  {
    label: "Published",
    dot: "var(--stage-published)",
    cards: ["How to rank in ChatGPT in 7 Days"],
    thumb: "#3B5BDB",
  },
] as const;

function BoardMock() {
  return (
    <div className="flex flex-1 gap-2.5 overflow-hidden px-6 pb-6">
      {BOARD_COLS.map((col, i) => (
        <div
          key={col.label}
          className={cn(
            "flex w-40 shrink-0 flex-col gap-2 rounded-xl border bg-muted/40 p-2.5 sm:flex-1",
            i > 1 && "hidden sm:flex",
          )}
        >
          <p className="flex items-center gap-1.5 text-[11px] font-semibold">
            <span className="size-1.5 rounded-full" style={{ background: col.dot }} />
            {col.label}
            <span className="font-mono text-[9px] font-normal text-muted-foreground">
              {col.cards.length}
            </span>
          </p>
          {col.cards.map((card) => (
            <div key={card} className="rounded-lg border bg-card p-1.5 shadow-xs">
              {"thumb" in col && (
                <div className="mb-1.5 aspect-video rounded-md" style={{ background: col.thumb }} />
              )}
              <p className="line-clamp-2 text-[10px] font-medium leading-snug">{card}</p>
            </div>
          ))}
          {"quickAdd" in col && (
            <p className="flex items-center gap-1 rounded-lg border border-dashed px-2 py-1.5 text-[10px] text-muted-foreground">
              <Plus className="size-2.5" /> New video
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

const VOICES = ["Samantha", "Daniel", "Karen", "Ava"] as const;

function ListenMock() {
  return (
    <div className="flex flex-1 flex-col items-start gap-2 px-6 pb-6">
      <span className="flex items-center overflow-hidden rounded-full bg-secondary text-sm font-medium">
        <span className="flex items-center gap-2 py-2 pl-4 pr-3">
          <Volume2 className="size-4" /> Listen
        </span>
        <span aria-hidden className="h-4 w-px bg-border" />
        <span className="px-2 py-2">
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </span>
      </span>
      <div className="ml-6 w-44 rounded-xl border bg-popover p-1 shadow-md">
        <p className="mono-label px-2 py-1.5">Voice</p>
        {VOICES.map((voice, i) => (
          <p
            key={voice}
            className={cn(
              "flex items-center justify-between rounded-lg px-2 py-1.5 text-[12px]",
              i === 0 && "bg-accent",
            )}
          >
            {voice}
            {i === 0 && <Check className="size-3" />}
          </p>
        ))}
      </div>
    </div>
  );
}
