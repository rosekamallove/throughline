import type { Metadata } from "next";
import { Anton, JetBrains_Mono, Roboto } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/shell/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { TRPCReactProvider } from "@/trpc/client";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-roboto",
  display: "swap",
});

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jbmono",
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
        roboto.variable,
        anton.variable,
        jetbrainsMono.variable,
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
