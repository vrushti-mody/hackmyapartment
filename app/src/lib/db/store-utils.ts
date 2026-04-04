import { randomUUID } from "crypto";
import EpisodeModel from "@/lib/db/models/Episode";
import ProductModel from "@/lib/db/models/Product";

export interface BundleSummary {
  id: string;
  roomType: string;
  budgetPhrase: string;
  roomImageUrl?: string;
  createdAt: string;
}

type BundleSummarySource = {
  id?: unknown;
  roomType?: unknown;
  budgetPhrase?: unknown;
  roomImageUrl?: unknown;
  createdAt?: unknown;
};

function normalizeAffiliateLink(link: unknown): string {
  return typeof link === "string" ? link.trim() : "";
}

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];

  return Array.from(
    new Set(
      tags
        .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
        .filter(Boolean)
    )
  );
}

function sanitizeItem(item: Record<string, unknown>) {
  const affiliateLink = normalizeAffiliateLink(item.affiliateLink);

  return {
    id: typeof item.id === "string" ? item.id.trim() : "",
    title: typeof item.title === "string" ? item.title.trim() : "",
    description:
      typeof item.description === "string" ? item.description.trim() : "",
    amount:
      typeof item.amount === "number"
        ? item.amount
        : Number(item.amount) || 0,
    affiliateLink,
    imageUrl: typeof item.imageUrl === "string" ? item.imageUrl.trim() : "",
    tags: normalizeTags(item.tags),
  };
}

export function dedupeItemsByAffiliateLink(items: unknown[]): Record<string, unknown>[] {
  const seen = new Set<string>();
  const uniqueItems: Record<string, unknown>[] = [];

  for (const rawItem of items) {
    if (!rawItem || typeof rawItem !== "object") continue;

    const item = sanitizeItem(rawItem as Record<string, unknown>);
    if (!item.affiliateLink || seen.has(item.affiliateLink)) continue;

    seen.add(item.affiliateLink);
    uniqueItems.push(item);
  }

  return uniqueItems;
}

export async function upsertProducts(
  items: unknown[],
  createdAt: string,
  updatedAt: string
) {
  const uniqueItems = dedupeItemsByAffiliateLink(items);
  const productObjectIds = [];

  for (const rawItem of uniqueItems) {
    const item = sanitizeItem(rawItem);
    if (!item.affiliateLink) continue;

    const upserted = await ProductModel.findOneAndUpdate(
      { affiliateLink: item.affiliateLink },
      {
        $set: {
          title: item.title,
          description: item.description,
          amount: item.amount,
          affiliateLink: item.affiliateLink,
          imageUrl: item.imageUrl,
          tags: item.tags,
          updatedAt,
        },
        $setOnInsert: {
          id: item.id || randomUUID(),
          createdAt,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    productObjectIds.push(upserted._id);
  }

  return productObjectIds;
}

export async function deleteOrphanProducts() {
  const referencedProductIds = await EpisodeModel.distinct("items");

  await ProductModel.deleteMany({
    _id: { $nin: referencedProductIds },
  });
}

export function toBundleSummary(episode: BundleSummarySource): BundleSummary {
  return {
    id: String(episode.id || ""),
    roomType: String(episode.roomType || ""),
    budgetPhrase: String(episode.budgetPhrase || ""),
    roomImageUrl:
      typeof episode.roomImageUrl === "string" ? episode.roomImageUrl : undefined,
    createdAt: String(episode.createdAt || ""),
  };
}

export function stripMongoFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripMongoFields);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const plain =
    typeof (value as { toObject?: () => Record<string, unknown> }).toObject === "function"
      ? (value as { toObject: () => Record<string, unknown> }).toObject()
      : (value as Record<string, unknown>);

  const result: Record<string, unknown> = {};

  for (const [key, nestedValue] of Object.entries(plain)) {
    if (key === "_id" || key === "__v") continue;
    result[key] = stripMongoFields(nestedValue);
  }

  return result;
}

function dedupeSerializedItems(items: unknown[]) {
  const seen = new Set<string>();
  const uniqueItems: unknown[] = [];

  for (const rawItem of items) {
    if (!rawItem || typeof rawItem !== "object") continue;

    const item = rawItem as Record<string, unknown>;
    const key =
      normalizeAffiliateLink(item.affiliateLink) ||
      (typeof item.id === "string" ? item.id.trim() : "");

    if (!key || seen.has(key)) continue;

    seen.add(key);
    uniqueItems.push(rawItem);
  }

  return uniqueItems;
}

export function serializeEpisode(episode: unknown) {
  const plainEpisode = stripMongoFields(episode) as Record<string, unknown>;

  return {
    ...plainEpisode,
    items: Array.isArray(plainEpisode.items)
      ? dedupeSerializedItems(plainEpisode.items)
      : [],
  };
}

export function serializeProduct(
  product: Record<string, unknown>,
  bundles: BundleSummary[],
  primaryBundle?: unknown
) {
  const plainProduct = stripMongoFields(product) as Record<string, unknown>;
  const primary = bundles[0];

  return {
    ...plainProduct,
    bundles,
    episodeId: primary?.id || "",
    episodeRoomType: primary?.roomType || "",
    ...(primaryBundle ? { episode: serializeEpisode(primaryBundle) } : {}),
  };
}
