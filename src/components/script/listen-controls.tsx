"use client";

import { ChevronDown, Square, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { englishVoices, rankVoice, resolveVoice } from "@/lib/tts";

/** Whole-script readback trigger + voice picker, next to the SCRIPT eyebrow. */
export function ListenControls({
  playing,
  voices,
  voiceURI,
  onVoiceChange,
  onListen,
  onStop,
}: {
  playing: boolean;
  voices: SpeechSynthesisVoice[];
  voiceURI: string | null;
  onVoiceChange: (uri: string) => void;
  onListen: () => void;
  onStop: () => void;
}) {
  const options = englishVoices(voices).slice(0, 14);
  const effective = resolveVoice(voices, voiceURI)?.voiceURI ?? "";

  return (
    <div className="flex items-center overflow-hidden rounded-full bg-secondary">
      <Button
        variant="ghost"
        size="sm"
        className="rounded-none pl-3 pr-2.5 hover:bg-accent active:scale-[0.97]"
        onClick={playing ? onStop : onListen}
      >
        {playing ? (
          <>
            <Square className="size-3 fill-current" /> Stop
          </>
        ) : (
          <>
            <Volume2 className="size-4" /> Listen
          </>
        )}
      </Button>
      <span aria-hidden className="h-4 w-px bg-border" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Choose voice"
            className="rounded-none px-2 hover:bg-accent"
          >
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
          <DropdownMenuLabel className="mono-label">Voice</DropdownMenuLabel>
          {options.length === 0 && (
            <p className="px-2 py-1.5 text-[13px] text-muted-foreground">
              No English voices found
            </p>
          )}
          <DropdownMenuRadioGroup value={effective} onValueChange={onVoiceChange}>
            {options.map((v) => (
              <DropdownMenuRadioItem key={v.voiceURI} value={v.voiceURI}>
                <span className="truncate">{v.name}</span>
                {rankVoice(v) >= 30 && (
                  <span className="ml-auto pl-2 font-mono text-[10px] uppercase text-muted-foreground">
                    HQ
                  </span>
                )}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
