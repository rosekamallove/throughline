"use client";

import { Square, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface SpeakableBeat {
  id: string;
  text: string;
}

/** Gut-check readback via the browser's speechSynthesis — no API keys, good
 *  enough to judge flow and pacing. Highlights each beat as it's read. */
export function ListenButton({
  beats,
  onBeatStart,
}: {
  beats: SpeakableBeat[];
  onBeatStart: (id: string) => void;
}) {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  function stop() {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  function play() {
    const synth = window.speechSynthesis;
    if (!synth) {
      toast.error("Speech synthesis isn't available in this browser");
      return;
    }
    synth.cancel();
    const readable = beats.filter((b) => b.text.trim());
    if (!readable.length) {
      toast.info("Nothing to read yet");
      return;
    }
    readable.forEach((beat, i) => {
      const utterance = new SpeechSynthesisUtterance(beat.text);
      utterance.rate = 1.05;
      utterance.onstart = () => onBeatStart(beat.id);
      if (i === readable.length - 1) utterance.onend = () => setSpeaking(false);
      synth.speak(utterance);
    });
    setSpeaking(true);
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      className="rounded-full"
      onClick={speaking ? stop : play}
    >
      {speaking ? (
        <>
          <Square className="size-3.5 fill-current" /> Stop
        </>
      ) : (
        <>
          <Volume2 className="size-4" /> Listen
        </>
      )}
    </Button>
  );
}
