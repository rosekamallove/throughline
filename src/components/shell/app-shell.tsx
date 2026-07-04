"use client";

import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/shell/app-sidebar";
import { SiteHeader } from "@/components/shell/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppShell({
  children,
  userInitial,
}: {
  children: React.ReactNode;
  userInitial?: string;
}) {
  const pathname = usePathname();
  // The script editor brings its own header — the shell one is noise there.
  const isEditor = /^\/video\/[^/]+\/script$/.test(pathname);

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="h-dvh min-w-0">
          {!isEditor && <SiteHeader userInitial={userInitial} />}
          <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
