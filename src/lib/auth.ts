import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/server/db";
import * as schema from "@/server/db/schema";

const hasGoogle = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  // Dev server sometimes runs on a non-default port; 403 "Invalid origin" otherwise.
  trustedOrigins: ["http://localhost:3000", "http://localhost:3210"],
  emailAndPassword: { enabled: true },
  socialProviders: hasGoogle
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          // Persist a refresh token from day 1 — substrate for the v1.1 YouTube sync.
          accessType: "offline",
          prompt: "consent",
        },
      }
    : undefined,
  account: {
    // Lets Google sign-in attach to the seeded user row instead of failing
    // with account_not_linked (seed sets emailVerified: true).
    // allowDifferentEmails: the YouTube channel lives on a personal gmail,
    // while the app login is the work address.
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      allowDifferentEmails: true,
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (u) => {
          // Single-user tool on a public URL — reject everyone else at signup.
          // The `code` is what surfaces to the OAuth callback: with it set,
          // Better Auth redirects to errorCallbackURL?error=<code>&error_description=<message>
          // (callback.mjs). Without a code it re-throws to a blank error page.
          if (u.email !== process.env.ALLOWED_EMAIL) {
            throw new APIError("FORBIDDEN", {
              code: "EMAIL_NOT_ALLOWED",
              message: "This is a private, single-user app and that account isn't on the allowlist.",
            });
          }
          return { data: u };
        },
      },
    },
  },
  plugins: [nextCookies()], // must stay last
});

export type Session = typeof auth.$Infer.Session;
