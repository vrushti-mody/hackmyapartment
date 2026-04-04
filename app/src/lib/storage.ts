/**
 * Browser localStorage persistence for episodes and drafts.
 *
 * All functions guard against SSR (server-side rendering) by checking for
 * `window` — Next.js may evaluate these modules on the server where
 * localStorage doesn't exist.
 *
 * Two separate keys are used:
 *   - Episodes: the full list of completed/saved episodes.
 *   - Draft: a single in-progress episode so the user doesn't lose work
 *     if they close the tab mid-creation.
 */

import { Episode } from "./types";

const EPISODES_KEY = "hackmyapartment_episodes";
const DRAFT_KEY = "hackmyapartment_draft";

/** Persist the full episodes array to localStorage. */
export function saveEpisodes(episodes: Episode[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(EPISODES_KEY, JSON.stringify(episodes));
}

/** Load all saved episodes, returning an empty array if none exist. */
export function loadEpisodes(): Episode[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(EPISODES_KEY);
  return data ? JSON.parse(data) : [];
}

/** Save a partial episode as the current draft (only one draft at a time). */
export function saveDraft(episode: Partial<Episode>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DRAFT_KEY, JSON.stringify(episode));
}

/** Load the current draft, or null if no draft exists. */
export function loadDraft(): Partial<Episode> | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(DRAFT_KEY);
  return data ? JSON.parse(data) : null;
}

/** Remove the draft — typically called after an episode is finalized. */
export function clearDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DRAFT_KEY);
}
