/**
 * BundleCard — Summary tile for an episode on the /shop storefront.
 *
 * Shows the room type with an emoji icon, budget phrase, and item count.
 * "Shop Now" scrolls the user down to the corresponding product grid
 * section via the `onShopNow` callback.
 */
"use client";

import { Episode } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/** Maps known room types to display emojis; unknown rooms fall back to a house icon. */
const ROOM_ICONS: Record<string, string> = {
  kitchen: "🍳",
  bedroom: "🛏️",
  "living room": "🛋️",
  bathroom: "🛁",
  outdoor: "🌿",
};

interface BundleCardProps {
  episode: Episode;
  /** Called when the user clicks "Shop Now" — typically scrolls to the bundle section. */
  onShopNow: () => void;
}

export function BundleCard({ episode, onShopNow }: BundleCardProps) {
  const icon = ROOM_ICONS[episode.roomType.toLowerCase()] || "🏠";

  return (
    <Card className="p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-bold">{episode.roomType}</h3>
      {episode.theme?.trim() && (
        <p className="text-xs font-medium text-zinc-500 mt-1 line-clamp-2">
          Theme: {episode.theme.trim()}
        </p>
      )}
      <p className="text-sm text-muted-foreground capitalize">
        {episode.budgetPhrase}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {episode.items.length} items
      </p>
      <Button className="mt-4 w-full" size="sm" onClick={onShopNow}>
        Shop Now
      </Button>
    </Card>
  );
}
