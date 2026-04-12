/**
 * Voiceover script generator for Instagram Reels — 60-second edition.
 *
 * Keeps the read lean: one hook sentence, one short sentence per product,
 * and one closing CTA.
 */

import { Item } from "./types";
import { formatCurrency, getUpgradeHook } from "./budget";

/** Count words in a string. */
function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Estimate how many seconds a script will take to read aloud at 130 wpm.
 */
export function estimateScriptSeconds(script: string): number {
  return Math.round((wordCount(script) / 130) * 60);
}

/**
 * Build a full voiceover script for one episode, capped at ~130 words.
 *
 * Product order is preserved exactly as entered by the creator.
 */
export function generateScript(
  items: Item[],
  roomType: string,
  roundedTotal: number,
  reelType: "create" | "upgrade" = "upgrade",
  theme: string = ""
): string {
  if (items.length === 0 || !roomType) return "";

  let intro = "";
  let cta = "";

  if (reelType === "create") {
    const themeStr = theme ? `${theme.toLowerCase()} ` : "";
    intro = `Create a beautiful ${themeStr}${roomType.toLowerCase()} for under ${roundedTotal} dollars with these finds.`;
    cta = `Comment "${roomType.toUpperCase()}" for product links or check bio! Follow @hackmyapartment for more.`;
  } else {
    intro = `${getUpgradeHook(roomType, items)}.`;
    cta = `Comment "${roomType.toUpperCase()}" for product links or check bio! Follow @hackmyapartment for more.`;
  }

  const connectors = ["Next,", "Then,", "And,"];
  const lines = items.map((item, i) => {
    if (i === 0) {
      return `First, ${item.title} for ${formatCurrency(item.amount)}.`;
    }
    const connector = connectors[(i - 1) % connectors.length];
    return `${connector} ${item.title} for ${formatCurrency(item.amount)}.`;
  });

  return `${intro}\n\n${lines.join("\n\n")}\n\n${cta}`;
}
