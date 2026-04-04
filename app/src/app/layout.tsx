/**
 * RootLayout — Next.js root layout applied to every page.
 *
 * Exposes local-safe font CSS custom properties so production builds do not
 * depend on fetching Google Fonts at build time.
 *
 * This is a server component — no "use client" needed.
 */
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "HackMyApartment — Reel Generator",
  description: "Automate Instagram Reel creation for affordable home decor content",
};

const fontVariables = {
  "--font-geist-sans":
    '"Avenir Next", "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
  "--font-geist-mono":
    '"SFMono-Regular", "SF Mono", "Menlo", "Monaco", "Roboto Mono", monospace',
  "--font-sans":
    '"Avenir Next", "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
} as CSSProperties;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" style={fontVariables}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
