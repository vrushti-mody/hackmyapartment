/**
 * Root page — redirects to /shop (handled by next.config.ts).
 * This file is kept as a fallback; the actual redirect is a Next.js config redirect.
 */
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/shop");
}
