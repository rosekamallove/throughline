"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";

/** Maps a Better Auth OAuth error (code + optional description) to a line the
 *  user can act on. The allowlist rejection carries its own message; other
 *  failures fall back to their code or a generic line. */
function authErrorMessage(code: string | null, description: string | null): string | null {
  if (!code) return null;
  if (description) return description;
  switch (code) {
    case "EMAIL_NOT_ALLOWED":
      return "This is a private, single-user app and that account isn't on the allowlist.";
    case "account_not_linked":
      return "That account couldn't be linked. Try the address you originally signed up with.";
    default:
      return "Sign in failed. Please try again.";
  }
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(() =>
    authErrorMessage(params.get("error"), params.get("error_description")),
  );
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await signIn.email({ email, password });
    setBusy(false);
    if (error) {
      setError(error.message ?? "Sign in failed");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8">
        <div className="mb-6">
          <Logo className="text-[23px]" />
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={busy} className="mt-1">
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="mono-label">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button
          variant="secondary"
          className="w-full"
          onClick={() =>
            signIn.social({
              provider: "google",
              callbackURL: "/",
              // Route OAuth failures (e.g. the allowlist rejection) back here
              // with ?error=&error_description= instead of a blank error page.
              errorCallbackURL: "/sign-in",
            })
          }
        >
          Continue with Google
        </Button>
      </div>
    </main>
  );
}
