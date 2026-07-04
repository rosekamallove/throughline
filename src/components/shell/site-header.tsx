"use client";

import { Search, SquarePlay } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

import { Logo } from "@/components/logo";
import { CreateVideoInline } from "@/components/video/create-video-inline";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { signOut } from "@/lib/auth-client";

export function SiteHeader({ userInitial = "R" }: { userInitial?: string }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  async function onSignOut() {
    await signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b px-5">
      <Link href="/" aria-label="Home">
        <Logo className="text-[19px]" />
      </Link>

      <div className="relative hidden w-full max-w-sm md:block">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search your videos" className="h-9 rounded-full pl-8" />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <CreateVideoInline />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button aria-label="Account" className="rounded-full">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem asChild>
              <Link href="/connect">
                <SquarePlay className="size-4" /> Connect YouTube
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="mono-label">Theme</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSignOut}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
