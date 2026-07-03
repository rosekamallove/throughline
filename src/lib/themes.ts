export type ThemeShell = "youtube" | "minimal";

export interface ThemeDef {
  id: string;
  label: string;
  /** Structural chrome variant — AppShell branches on this. v1 ships "youtube" only. */
  shell: ThemeShell;
}

export const THEMES: ThemeDef[] = [
  { id: "yt-dark", label: "YT Dark", shell: "youtube" },
  { id: "yt-light", label: "YT Light", shell: "youtube" },
];

export const DEFAULT_THEME = "yt-dark";
