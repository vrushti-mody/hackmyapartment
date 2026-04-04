/**
 * ProductCard — Individual product listing on the /shop storefront.
 *
 * Displays the product image (or a placeholder), title, description,
 * up to 3 tag badges, price, and a "Buy on Amazon" affiliate link.
 * The affiliate link opens in a new tab with `noopener noreferrer`.
 */
"use client";

import { Item } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  item: Item;
}

export function ProductCard({ item }: ProductCardProps) {
  return (
    <Card className="overflow-hidden flex flex-col">
      {/* Product image */}
      <div className="aspect-square bg-muted relative">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-muted-foreground">
            🛍️
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <h4 className="font-semibold text-sm line-clamp-2">{item.title}</h4>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {item.description}
        </p>

        {/* Tags — capped at 3 to avoid overflow in the card layout.
            Guard against empty-string tags that appear when the user
            clears the comma-separated input. */}
        {item.tags.length > 0 && item.tags[0] !== "" && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-auto pt-3">
          <div className="text-lg font-bold mb-2">
            ${item.amount.toFixed(2)}
          </div>
          <a
            href={item.affiliateLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 w-full"
          >
            Buy on Amazon
          </a>
        </div>
      </div>
    </Card>
  );
}
