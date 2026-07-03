"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full text-sub hover:text-foreground"
      aria-label="Toggle theme"
      onClick={() => setTheme(theme === "yt-light" ? "yt-dark" : "yt-light")}
    >
      {/* Both icons rendered; CSS picks by theme, so no hydration branch. */}
      <Sun className="size-5 [[data-theme=yt-light]_&]:hidden" />
      <Moon className="hidden size-5 [[data-theme=yt-light]_&]:block" />
    </Button>
  );
}
