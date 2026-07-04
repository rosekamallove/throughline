"use client";

import { usePathname } from "next/navigation";

import { SiteHeader } from "@/components/shell/site-header";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppShell({
  children,
  userInitial,
}: {
  children: React.ReactNode;
  userInitial?: string;
}) {
  const pathname = usePathname();
  // The script editor brings its own chrome — the shell header is noise there.
  const isEditor = /^\/video\/[^/]+\/script$/.test(pathname);

  return (
    <TooltipProvider>
      <div className="flex h-dvh min-w-0 flex-col">
        {!isEditor && <SiteHeader userInitial={userInitial} />}
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </TooltipProvider>
  );
}
