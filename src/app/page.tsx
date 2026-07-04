import { headers } from "next/headers";

import { Landing } from "@/components/landing";
import { AppShell } from "@/components/shell/app-shell";
import { Dashboard } from "@/components/video/dashboard";
import { auth } from "@/lib/auth";

/** Guests get the landing page; a signed-in user gets the channel. */
export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return <Landing />;

  const initial = (session.user.name || session.user.email || "?")
    .charAt(0)
    .toUpperCase();

  return (
    <AppShell userInitial={initial}>
      <Dashboard />
    </AppShell>
  );
}
