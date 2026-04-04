/**
 * Core domain types for the HackMyApartment content pipeline.
 *
 * An "Episode" represents one piece of content (an Instagram Reel) that
 * showcases a curated set of affordable "Items" for a specific room type.
 * The pipeline flows: Items -> Script -> Caption -> Audio -> Video -> Publish.
 */

/** A single product featured in an episode (e.g., an Amazon affiliate item). */
export interface Item {
  id: string;
  title: string;
  description: string;
  amount: number;
  imageUrl: string;
  affiliateLink: string;
  tags: string[];
}

/**
 * A complete episode — tracks everything from the product list through
 * generated content (script, caption, audio) to publication status.
 */
export interface Episode {
  id: string;
  reelType: "create" | "upgrade";
  theme?: string;
  roomType: string;
  items: Item[];
  /** Sum of item amounts before rounding. */
  rawTotal: number;
  /** Total rounded up to nearest $50 for the "under $X" hook. */
  roundedTotal: number;
  budgetPhrase: string;
  /** ElevenLabs TTS audio blob URL — present once voiceover is generated. */
  audioUrl?: string;
  roomImageUrl?: string;
  videoUrl?: string;
  publishedToStorefront: boolean;
  createdAt: string;
  updatedAt: string;
}
