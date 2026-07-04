"use client";

import { FlipHorizontal2, Minus, Pause, Play, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { TimedBeat } from "@/components/script/pacing-bar";
import { resolveBeatMeta, type CustomBeatKind } from "@/lib/beats";
import { cn } from "@/lib/utils";

const PREFS_KEY = "throughline:prompter";

interface PrompterPrefs {
  fontSize: number;
  speed: number;
  mirror: boolean;
}

const DEFAULTS: PrompterPrefs = { fontSize: 40, speed: 1, mirror: false };
const FONT_RANGE = { min: 24, max: 72 } as const;
const SPEED_RANGE = { min: 0.4, max: 2.5 } as const;

function loadPrefs(): PrompterPrefs {
  try {
    const parsed = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}") as
      Partial<PrompterPrefs>;
    return {
      fontSize: typeof parsed.fontSize === "number" ? parsed.fontSize : DEFAULTS.fontSize,
      speed: typeof parsed.speed === "number" ? parsed.speed : DEFAULTS.speed,
      mirror: typeof parsed.mirror === "boolean" ? parsed.mirror : DEFAULTS.mirror,
    };
  } catch {
    return DEFAULTS;
  }
}

/** Fullscreen teleprompter. Always white-on-black regardless of theme —
 *  this is a reading surface for recording, not app chrome. */
export function Prompter({
  title,
  beats,
  customKinds,
  totalSec,
  onClose,
}: {
  title: string;
  beats: TimedBeat[];
  customKinds: CustomBeatKind[];
  totalSec: number;
  onClose: () => void;
}) {
  const [prefs, setPrefsState] = useState<PrompterPrefs>(loadPrefs);
  const [playing, setPlaying] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  function setPrefs(update: Partial<PrompterPrefs>) {
    setPrefsState((prev) => {
      const next = { ...prev, ...update };
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      } catch {
        // private mode etc. — in-memory only
      }
      return next;
    });
  }

  const clampSpeed = (v: number) =>
    Math.round(Math.min(SPEED_RANGE.max, Math.max(SPEED_RANGE.min, v)) * 10) / 10;
  const clampFont = (v: number) =>
    Math.min(FONT_RANGE.max, Math.max(FONT_RANGE.min, v));

  // Auto-scroll: the whole doc passes in totalSec of speech, so px/sec is
  // scroll range over duration, scaled by the user's speed multiplier.
  // Position accumulates in a float — per-frame deltas are sub-pixel and
  // would vanish into scrollTop's integer rounding otherwise.
  useEffect(() => {
    if (!playing) return;
    const el = scrollRef.current;
    if (!el || totalSec === 0) return;
    let raf: number;
    let last = performance.now();
    let pos = el.scrollTop;
    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const range = el.scrollHeight - el.clientHeight;
      // A manual wheel/drag while playing moves scrollTop under us; resync.
      if (Math.abs(el.scrollTop - pos) > 4) pos = el.scrollTop;
      pos = Math.min(pos + (range / totalSec) * prefs.speed * dt, range);
      el.scrollTop = pos;
      if (pos >= range - 1) {
        setPlaying(false);
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, prefs.speed, totalSec]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        setPrefs({ speed: clampSpeed(prefs.speed + (e.key === "ArrowUp" ? 0.1 : -0.1)) });
      } else if (e.key === "+" || e.key === "=") {
        setPrefs({ fontSize: clampFont(prefs.fontSize + 2) });
      } else if (e.key === "-") {
        setPrefs({ fontSize: clampFont(prefs.fontSize - 2) });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prefs.speed, prefs.fontSize, onClose]);

  const readable = beats.filter((b) => b.text.trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 bg-black text-zinc-50">
      {/* eyeline */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[38%] z-10">
        <div className="h-px bg-white/10" />
        <div className="absolute left-2 top-1/2 size-2 -translate-y-1/2 rotate-45 rounded-[2px] bg-white/30" />
      </div>

      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-4 bg-gradient-to-b from-black via-black/80 to-transparent px-5 pb-8 pt-4">
        <span className="truncate text-[13px] text-zinc-500">{title}</span>
        <div className="flex shrink-0 items-center gap-1.5">
          <PrompterButton
            aria-label="Smaller text"
            onClick={() => setPrefs({ fontSize: clampFont(prefs.fontSize - 2) })}
          >
            <Minus className="size-3.5" />
          </PrompterButton>
          <span className="w-9 text-center font-mono text-[11px] text-zinc-400">
            {prefs.fontSize}px
          </span>
          <PrompterButton
            aria-label="Bigger text"
            onClick={() => setPrefs({ fontSize: clampFont(prefs.fontSize + 2) })}
          >
            <Plus className="size-3.5" />
          </PrompterButton>

          <span aria-hidden className="mx-1.5 h-4 w-px bg-white/15" />

          <PrompterButton
            aria-label="Slower"
            onClick={() => setPrefs({ speed: clampSpeed(prefs.speed - 0.1) })}
          >
            <Minus className="size-3.5" />
          </PrompterButton>
          <span className="w-9 text-center font-mono text-[11px] text-zinc-400">
            {prefs.speed.toFixed(1)}×
          </span>
          <PrompterButton
            aria-label="Faster"
            onClick={() => setPrefs({ speed: clampSpeed(prefs.speed + 0.1) })}
          >
            <Plus className="size-3.5" />
          </PrompterButton>

          <span aria-hidden className="mx-1.5 h-4 w-px bg-white/15" />

          <PrompterButton
            aria-label="Mirror for teleprompter glass"
            active={prefs.mirror}
            onClick={() => setPrefs({ mirror: !prefs.mirror })}
          >
            <FlipHorizontal2 className="size-3.5" />
          </PrompterButton>
          <PrompterButton aria-label="Exit" onClick={onClose}>
            <X className="size-3.5" />
          </PrompterButton>
        </div>
      </div>

      <div ref={scrollRef} className="h-full overflow-y-auto px-8">
        <div
          className={cn("mx-auto max-w-[900px]", prefs.mirror && "-scale-x-100")}
          style={{ fontSize: prefs.fontSize }}
        >
          <div className="h-[38vh]" />
          {readable.map((beat) => {
            const color = resolveBeatMeta(beat.kind, customKinds).color;
            return (
              <section key={beat.id} className="mb-[1.4em]">
                <p className="mb-[0.5em] flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[1.5px] text-zinc-500">
                  <span className="size-1.5 rounded-full" style={{ background: color }} />
                  {beat.label}
                </p>
                {beat.text.split("\n").map(
                  (line, i) =>
                    line.trim() && (
                      <p key={i} className="mb-[0.7em] font-medium leading-[1.55]">
                        {line}
                      </p>
                    ),
                )}
              </section>
            );
          })}
          {readable.length === 0 && (
            <p className="text-center text-zinc-500">Nothing to read yet.</p>
          )}
          <div className="h-[62vh]" />
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 bg-gradient-to-t from-black via-black/80 to-transparent pb-5 pt-10">
        <button
          aria-label={playing ? "Pause" : "Play"}
          onClick={(e) => {
            e.currentTarget.blur();
            setPlaying((p) => !p);
          }}
          className="flex size-12 items-center justify-center rounded-full bg-white text-black transition-transform active:scale-95"
        >
          {playing ? (
            <Pause className="size-5 fill-current" />
          ) : (
            <Play className="ml-0.5 size-5 fill-current" />
          )}
        </button>
        <p className="font-mono text-[10px] uppercase tracking-[1.5px] text-zinc-600">
          Space play · ↑↓ speed · Esc exit
        </p>
      </div>
    </div>
  );
}

function PrompterButton({
  active = false,
  className,
  onClick,
  ...props
}: React.ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      {...props}
      onClick={(e) => {
        e.currentTarget.blur();
        onClick?.(e);
      }}
      className={cn(
        "flex size-7 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-white/10 hover:text-white active:scale-95",
        active && "bg-white/15 text-white",
        className,
      )}
    />
  );
}
