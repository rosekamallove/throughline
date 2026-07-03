"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

import { DEFAULT_THEME, THEMES } from "@/lib/themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      themes={THEMES.map((t) => t.id)}
      defaultTheme={DEFAULT_THEME}
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
