"use client";

import { usePathname, useRouter } from "next/navigation";

import { GuideRail } from "@/components/shell/guide-rail";
import { TopBar } from "@/components/shell/top-bar";
import { signOut } from "@/lib/auth-client";

export function AppShell({
  children,
  userInitial,
}: {
  children: React.ReactNode;
  userInitial?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function onSignOut() {
    await signOut();
    router.push("/sign-in");
    router.refresh();
  }
  // The script editor brings its own outline rail — give it the full width.
  const hideRail = /^\/video\/[^/]+\/script/.test(pathname);

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <TopBar onSignOut={onSignOut} userInitial={userInitial} />
      <div className="flex min-h-0 flex-1">
        {!hideRail && <GuideRail />}
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
