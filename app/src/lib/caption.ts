/**
 * Instagram caption and hashtag generator.
 *
 * Captions are the text that appears below a Reel — separate from the
 * voiceover script. They include a numbered product list and a CTA
 * prompting viewers to comment the room type keyword (which can trigger
 * DM automation) or tap the link-in-bio.
 */

import { Item } from "./types";

/** Decorative emoji per room type for caption headers. */
const ROOM_EMOJIS: Record<string, string> = {
  kitchen: "🍳",
  bedroom: "🛏️",
  "living room": "🛋️",
  bathroom: "🛁",
  outdoor: "🌿",
};

/** Room-specific hashtag sets to complement the universal base tags. */
const ROOM_HASHTAGS: Record<string, string[]> = {
  kitchen: ["#kitchenhacks", "#budgetkitchen", "#kitchenorganization"],
  bedroom: ["#bedroominspo", "#cozybedroom", "#bedroomhacks"],
  "living room": ["#livingroomdecor", "#cozyliving", "#livingroominspo"],
  bathroom: ["#bathroomhacks", "#bathroomdecor", "#bathroomorganization"],
  outdoor: ["#outdoorliving", "#patioseason", "#outdoordecor"],
};

/** Build the Instagram post caption with a header, product list, and CTA. */
export function generateCaption(
  items: Item[],
  roomType: string,
  roundedTotal: number
): string {
  if (items.length === 0 || !roomType) return "";

  const rt = roomType.toLowerCase();
  const emoji = ROOM_EMOJIS[rt] || "🏠";

  const header = `🏠 Upgrade your ${rt} for under $${roundedTotal}! ${emoji}`;
  const productList = items
    .map((item, i) => `${i + 1}. ${item.title} — $${item.amount.toFixed(2)}`)
    .join("\n");

  // CTA encourages keyword comments (for DM automation) and link-in-bio clicks.
  const cta = `💬 Comment "${rt}" and I'll send you the links!\n🔗 Or check the link in bio`;

  return `${header}\n\nHere's everything you need:\n${productList}\n\n${cta}`;
}

/** Combine evergreen base hashtags with room-specific ones for maximum reach. */
export function generateHashtags(roomType: string): string[] {
  const rt = roomType.toLowerCase();
  const base = [
    "#hackmyapartment",
    "#amazonfinds",
    "#apartmentliving",
    "#homehacks",
    "#amazonmusthaves",
    "#affordablehome",
    "#reelsinstagram",
  ];
  const roomSpecific = ROOM_HASHTAGS[rt] || [];
  return [...base, ...roomSpecific];
}
