import type { Metadata } from "next";
import { Anton, Geist, Geist_Mono, Roboto_Condensed } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/shell/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { TRPCReactProvider } from "@/trpc/client";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

// Logo wordmark only — the closest Google font to YouTube Sans.
const robotoCondensed = Roboto_Condensed({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-roboto-condensed",
  display: "swap",
});

// Thumbnail packaging text only — not app chrome.
const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Throughline",
  description: "Scripting & production for YouTube creators",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full antialiased",
        geistSans.variable,
        geistMono.variable,
        anton.variable,
        robotoCondensed.variable,
      )}
    >
      <body className="flex min-h-full flex-col font-sans">
        <ThemeProvider>
          <TRPCReactProvider>
            {children}
            <Toaster position="bottom-right" />
          </TRPCReactProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
