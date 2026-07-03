import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/shell/app-shell";
import { auth } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const initial = (session.user.name || session.user.email || "?")
    .charAt(0)
    .toUpperCase();

  return <AppShell userInitial={initial}>{children}</AppShell>;
}
