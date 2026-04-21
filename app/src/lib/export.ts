/**
 * Export and download helpers.
 *
 * Provides utilities to format episode product links as shareable text
 * and to trigger browser file downloads for text content or binary blobs
 * (e.g., audio files, rendered videos).
 */

import { Item } from "./types";

/** Format items as a plain-text product-links document with affiliate URLs. */
export function generateLinksExport(items: Item[], roomType: string): string {
  const commentKeyword = roomType.replace(/\s+/g, "").toUpperCase();

  const lines = [
    `Hey! Thanks for commenting "${commentKeyword}" on our reel.`,
    "",
    `Here are the product links for this ${roomType.toLowerCase()} setup:`,
    "",
    ...items.map(
      (item, i) =>
        `${i + 1}. ${item.title} - $${item.amount.toFixed(2)}\n${item.affiliateLink}`
    ),
    "",
    "Let me know if you want the next bundle too.",
  ];
  return lines.join("\n");
}

/** Trigger a browser download for an arbitrary Blob (audio, video, etc.). */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
