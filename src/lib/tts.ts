"use client";

import { useSyncExternalStore } from "react";

/** Browser speechSynthesis helpers — voice discovery, ranking, and a tiny
 *  queue for reading beats aloud. No API keys; quality depends on the OS. */

const VOICE_KEY = "throughline:ttsVoice";

export interface SpeakableBeat {
  id: string;
  text: string;
}

/** Higher = better. OS "premium"/"enhanced" voices beat the robotic
 *  defaults; anything non-English is excluded (-1). */
export function rankVoice(v: SpeechSynthesisVoice): number {
  if (!v.lang.toLowerCase().startsWith("en")) return -1;
  const n = v.name.toLowerCase();
  let score = 0;
  if (n.includes("premium")) score += 50;
  if (n.includes("enhanced")) score += 40;
  if (n.includes("natural")) score += 30;
  if (n.includes("google")) score += 20;
  if (/\b(ava|samantha|zoe|allison|evan|nathan|karen|daniel)\b/.test(n)) score += 10;
  if (v.localService) score += 2;
  if (v.default) score += 1;
  return score;
}

export function englishVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  return voices
    .filter((v) => rankVoice(v) >= 0)
    .sort((a, b) => rankVoice(b) - rankVoice(a));
}

export function resolveVoice(
  voices: SpeechSynthesisVoice[],
  preferredURI: string | null,
): SpeechSynthesisVoice | null {
  return (
    voices.find((v) => v.voiceURI === preferredURI) ?? englishVoices(voices)[0] ?? null
  );
}

export function loadPreferredVoiceURI(): string | null {
  try {
    return localStorage.getItem(VOICE_KEY);
  } catch {
    return null;
  }
}

export function savePreferredVoiceURI(uri: string) {
  try {
    localStorage.setItem(VOICE_KEY, uri);
  } catch {
    // private mode etc.
  }
}

/** Voices arrive async (voiceschanged), so expose them as an external store. */
let cachedVoices: SpeechSynthesisVoice[] = [];
const NO_VOICES: SpeechSynthesisVoice[] = [];

function voicesSnapshot(): SpeechSynthesisVoice[] {
  const fresh = window.speechSynthesis?.getVoices() ?? NO_VOICES;
  if (fresh.length !== cachedVoices.length) cachedVoices = fresh;
  return cachedVoices;
}

function subscribeVoices(cb: () => void) {
  const synth = window.speechSynthesis;
  if (!synth) return () => {};
  synth.addEventListener("voiceschanged", cb);
  return () => synth.removeEventListener("voiceschanged", cb);
}

export function useVoices(): SpeechSynthesisVoice[] {
  return useSyncExternalStore(subscribeVoices, voicesSnapshot, () => NO_VOICES);
}

/** Queue beats as utterances. Returns false when there's nothing to read. */
export function speakBeats(
  beats: SpeakableBeat[],
  voice: SpeechSynthesisVoice | null,
  handlers: { onBeatStart?: (id: string) => void; onDone?: () => void } = {},
): boolean {
  const synth = window.speechSynthesis;
  if (!synth) return false;
  synth.cancel();
  const readable = beats.filter((b) => b.text.trim());
  if (!readable.length) return false;
  readable.forEach((beat, i) => {
    const utterance = new SpeechSynthesisUtterance(beat.text);
    utterance.rate = 1.05;
    if (voice) utterance.voice = voice;
    utterance.onstart = () => handlers.onBeatStart?.(beat.id);
    if (i === readable.length - 1) utterance.onend = () => handlers.onDone?.();
    synth.speak(utterance);
  });
  return true;
}

export function stopSpeech() {
  window.speechSynthesis?.cancel();
}
