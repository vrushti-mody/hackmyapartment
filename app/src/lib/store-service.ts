/**
 * Store Service — Data abstraction layer.
 *
 * Reads from the MongoDB bundle and product APIs.
 * Returns empty arrays when the database has no data yet.
 */
import { Episode, Item } from "@/lib/types";

/* ─── Gradient fallbacks for rooms without AI images ─── */
const ROOM_GRADIENTS: Record<string, string> = {
  Kitchen: "linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)",
  Bedroom: "linear-gradient(135deg, #ddd6fe 0%, #8b5cf6 100%)",
  "Living Room": "linear-gradient(135deg, #d1fae5 0%, #34d399 100%)",
  Bathroom: "linear-gradient(135deg, #bfdbfe 0%, #3b82f6 100%)",
  Office: "linear-gradient(135deg, #e5e7eb 0%, #6b7280 100%)",
  Outdoor: "linear-gradient(135deg, #bbf7d0 0%, #22c55e 100%)",
};

export function getRoomGradient(roomType: string): string {
  return ROOM_GRADIENTS[roomType] || "linear-gradient(135deg, #f3f4f6 0%, #9ca3af 100%)";
}

/* ─── Data access functions ─── */

/** Get all episodes from MongoDB API. Returns empty array if none exist. */
export async function getEpisodes(): Promise<Episode[]> {
  if (typeof window === "undefined") return [];

  try {
    const res = await fetch("/api/store/episodes");
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  } catch (e) {
    console.warn("Failed to fetch from MongoDB API:", e);
  }

  return [];
}

/** Get a single episode by ID. */
export async function getEpisodeById(id: string): Promise<Episode | undefined> {
  const eps = await getEpisodes();
  return eps.find((e) => e.id === id);
}

/** Safely issue a PUT request to update an existing Episode in MongoDB */
export async function updateEpisode(id: string, updates: Partial<Episode>): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const res = await fetch(`/api/store/episodes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Failed to update episode in API");
  } catch (e) {
    console.error("Failed to update episode:", e);
    throw e;
  }
}

/** Safely issue a DELETE request to completely prune an Episode from MongoDB */
export async function deleteEpisode(id: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const res = await fetch(`/api/store/episodes/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete episode in API");
  } catch (e) {
    console.error("Failed to delete episode:", e);
    throw e;
  }
}

/** Get all unique storefront products plus the bundles they appear in. */
export interface ProductWithEpisode extends Item {
  bundles: Array<{
    id: string;
    roomType: string;
    budgetPhrase: string;
    roomImageUrl?: string;
    createdAt: string;
  }>;
  episodeId: string;
  episodeRoomType: string;
  createdAt: string;
  updatedAt: string;
}

function deriveProductsFromEpisodes(episodes: Episode[]): ProductWithEpisode[] {
  const productsByAffiliateLink = new Map<string, ProductWithEpisode>();

  for (const episode of episodes) {
    const bundle = {
      id: episode.id,
      roomType: episode.roomType,
      budgetPhrase: episode.budgetPhrase,
      roomImageUrl: episode.roomImageUrl,
      createdAt: episode.createdAt,
    };

    for (const item of episode.items) {
      const affiliateKey = item.affiliateLink.trim();
      if (!affiliateKey) continue;

      const existing = productsByAffiliateLink.get(affiliateKey);
      if (existing) {
        if (!existing.bundles.some((b) => b.id === episode.id)) {
          existing.bundles.push(bundle);
        }
        continue;
      }

      productsByAffiliateLink.set(affiliateKey, {
        ...item,
        bundles: [bundle],
        episodeId: episode.id,
        episodeRoomType: episode.roomType,
        createdAt: episode.createdAt,
        updatedAt: episode.updatedAt,
      });
    }
  }

  return Array.from(productsByAffiliateLink.values());
}

export async function getAllProducts(): Promise<ProductWithEpisode[]> {
  if (typeof window === "undefined") return [];

  try {
    const res = await fetch("/api/store/products");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {
    console.warn("Failed to fetch products from MongoDB API:", e);
  }

  const episodes = await getEpisodes();
  return deriveProductsFromEpisodes(episodes);
}

/** Get a single storefront product by ID, including a primary bundle payload. */
export async function getProductById(id: string): Promise<(ProductWithEpisode & { episode: Episode }) | undefined> {
  if (typeof window === "undefined") return undefined;

  try {
    const res = await fetch(`/api/store/products/${id}`);
    if (res.ok) {
      const data = await res.json();
      if (data) return data || undefined;
    }
  } catch (e) {
    console.warn("Failed to fetch product from MongoDB API:", e);
  }

  const episodes = await getEpisodes();
  const derivedProducts = deriveProductsFromEpisodes(episodes);
  const product = derivedProducts.find((item) => item.id === id);
  if (!product) return undefined;

  const episode =
    episodes.find((ep) => ep.id === product.episodeId) ||
    episodes.find((ep) => ep.items.some((item) => item.id === id));

  if (!episode) return undefined;

  return { ...product, episode };
}

/** Search products by query matching title, description, or tags. */
export async function searchProducts(query: string): Promise<ProductWithEpisode[]> {
  const q = query.toLowerCase().trim();
  const all = await getAllProducts();
  if (!q) return all;
  return all.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.episodeRoomType.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q))
  );
}

/** Search episodes by query matching roomType or item titles/tags. */
export async function searchEpisodes(query: string): Promise<Episode[]> {
  const q = query.toLowerCase().trim();
  const eps = await getEpisodes();
  if (!q) return eps;
  return eps.filter(
    (ep) =>
      ep.roomType.toLowerCase().includes(q) ||
      ep.items.some(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q))
      )
  );
}

/** Get all unique categories across episodes. */
export async function getCategories(): Promise<string[]> {
  const eps = await getEpisodes();
  const cats = new Set(eps.map((e) => e.roomType));
  return Array.from(cats).sort();
}

/** Get all unique tags across all products. */
export async function getAllTags(): Promise<string[]> {
  const tags = new Set<string>();

  const products = await getAllProducts();
  for (const product of products) {
    for (const tag of product.tags) {
      tags.add(tag.trim());
    }
  }

  return Array.from(tags).sort();
}
