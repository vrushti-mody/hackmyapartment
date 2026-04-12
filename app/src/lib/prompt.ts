/**
 * Image-generation prompt templates for room backdrop images.
 *
 * These prompts are fed to an AI image generator (e.g., DALL-E, Midjourney,
 * Gemini Imagen) to create the background visuals for each Reel. Each prompt
 * is tuned for a 9:16 vertical aspect ratio and an Instagram-friendly
 * photorealistic style.
 *
 * When `items` are provided, the product names and their key features are
 * woven into the prompt so the generated image reflects the actual products
 * being featured in the reel.
 */

import { Item } from "./types";
import { formatCurrency, getUpgradeHook } from "./budget";

/** Base aesthetic descriptors per room type. */
const ROOM_BASE: Record<string, string> = {
  kitchen:
    "A cozy modern kitchen interior, clean countertops, warm lighting, sage green accents",
  bedroom:
    "A cozy modern bedroom interior, soft bedding, warm ambient lighting, neutral earth tones",
  "living room":
    "A cozy modern living room interior, plush sofa, warm lighting, minimalist decor",
  bathroom:
    "A clean modern bathroom interior, white tile, warm lighting, spa-like ambiance",
  outdoor:
    "A cozy outdoor patio setup, string lights, warm evening glow, lush greenery",
};

/**
 * Build a curated AI image prompt for the given room, optionally enriched
 * with the featured product details and a creator-defined theme/aesthetic.
 */
export function generateRoomPrompt(
  roomType: string,
  items?: Item[],
  theme?: string
): string {
  const rt = roomType.toLowerCase().trim();
  const base =
    ROOM_BASE[rt] ||
    `A cozy modern ${rt} interior, warm lighting, stylish decor`;

  // If a theme is set, lead with it so the aesthetic is front and centre.
  // Strip any leading "A [words] roomType, " prefix so we keep just the style
  // qualifiers (lighting, accents, etc.) and prepend the theme instead.
  const qualifiers = base
    .replace(/^[^,]+,\s*/, "") // drop everything up to and including the first comma
    .trim();
  const aesthetic = theme && theme.trim()
    ? `${theme.trim()} ${rt}, ${qualifiers}`
    : base;

  // If no items, return a clean prompt.
  if (!items || items.length === 0) {
    return `${aesthetic}, Instagram aesthetic, photorealistic, 9:16 vertical portrait`;
  }

  // Build a concise product feature list (max 5 items, 1 line each).
  const productLines = items
    .slice(0, 5)
    .map((item) => {
      // Take the first sentence of the description as the key feature.
      const feature = item.description
        .replace(/\s+/g, " ")
        .trim()
        .split(/(?<=[.!?])\s+/)[0]
        ?.replace(/["""]/g, "")
        .slice(0, 80);
      return `${item.title}${feature ? ` (${feature})` : ""}`;
    })
    .join(", ");

  return (
    `${aesthetic}, featuring ${productLines}, ` +
    `styled for an Instagram reel, photorealistic, natural light, beautiful composition, 9:16 vertical portrait`
  );
}

/**
 * Build a ChatGPT / Claude prompt the creator can copy, paste into any AI
 * chatbot, and get a polished 60-second voiceover script back — which they
 * then paste into the Script textarea.
 */
export function generateVoiceoverPrompt(
  roomType: string,
  items: Item[],
  roundedTotal: number,
  reelType: "upgrade" | "create" = "upgrade",
  theme?: string
): string {
  const themeStr = theme && theme.trim() ? ` with a "${theme.trim()}" aesthetic` : "";
  const upgradeHook = `${getUpgradeHook(roomType, items)}.`;
  const productList = items
    .slice(0, 5)
    .map(
      (item, i) =>
        `${i + 1}. ${item.title} — ${formatCurrency(Math.round(item.amount))}`
    )
    .join("\n");

  if (reelType === "create") {
    return `Write a punchy 60-second Instagram Reel voiceover script for creating a ${roomType.toLowerCase()}${themeStr} on a budget.

Products featured (under $${roundedTotal} total):
${productList}

Requirements:
- Opening hook: 1 short, exciting sentence. No product names yet.
- Per product: EXACTLY 1 sentence naming the product and its price only. No descriptions, features, benefits, materials, or extra detail.
- Closing CTA: "Comment ${roomType.toUpperCase()} for product links or check bio. Follow @hackmyapartment for more."
- Separate each section with a blank line.
- Total: ~100 words for a fast-paced natural reading pace.
- Tone: upbeat, conversational, like a popular content creator.
- No dashes, no em-dashes, no asterisks. Commas and periods only.`;
  }

  return `Write a punchy 60-second Instagram Reel voiceover script for upgrading a ${roomType.toLowerCase()}${themeStr}.

Products featured:
${productList}

Requirements:
- Opening hook: Write exactly this: "${upgradeHook}"
- Per product: EXACTLY 1 sentence naming the product and its price only. No descriptions, features, benefits, materials, or extra detail.
- Closing CTA: "Comment ${roomType.toUpperCase()} for product links or check bio. Follow @hackmyapartment for more."
- Separate each section with a blank line.
- Total: ~100 words for a fast-paced natural reading pace.
- Tone: upbeat, conversational, like a popular content creator.
- No dashes, no em-dashes, no asterisks. Commas and periods only.`;
}
