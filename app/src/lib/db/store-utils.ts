import { randomUUID } from "crypto";
import EpisodeModel from "@/lib/db/models/Episode";
import ProductModel from "@/lib/db/models/Product";
import {
  getProductIdentityKey,
  normalizeAffiliateLink,
  normalizeProductTitle,
} from "@/lib/product-identity";

export interface BundleSummary {
  id: string;
  reelType: "create" | "upgrade";
  theme?: string;
  roomType: string;
  budgetPhrase: string;
  roomImageUrl?: string;
  createdAt: string;
}

type BundleSummarySource = {
  id?: unknown;
  reelType?: unknown;
  theme?: unknown;
  roomType?: unknown;
  budgetPhrase?: unknown;
  roomImageUrl?: unknown;
  createdAt?: unknown;
};

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
    normalizedTitle: normalizeProductTitle(item.title),
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

export function dedupeItemsByIdentity(items: unknown[]): Record<string, unknown>[] {
  const seen = new Set<string>();
  const uniqueItems: Record<string, unknown>[] = [];

  for (const rawItem of items) {
    if (!rawItem || typeof rawItem !== "object") continue;

    const item = sanitizeItem(rawItem as Record<string, unknown>);
    const identityKey = getProductIdentityKey(item);
    if (!identityKey || seen.has(identityKey)) continue;

    seen.add(identityKey);
    uniqueItems.push(item);
  }

  return uniqueItems;
}

export async function upsertProducts(
  items: unknown[],
  createdAt: string,
  updatedAt: string
) {
  const uniqueItems = dedupeItemsByIdentity(items);
  const productObjectIds = [];

  for (const rawItem of uniqueItems) {
    const item = sanitizeItem(rawItem);
    if (!item.affiliateLink) continue;

    const matchClauses: Array<Record<string, string>> = [
      { affiliateLink: item.affiliateLink },
    ];
    if (item.normalizedTitle) {
      matchClauses.push({ normalizedTitle: item.normalizedTitle });
    }

    const existing = await ProductModel.findOne({ $or: matchClauses });

    const payload = {
      title: item.title,
      normalizedTitle: item.normalizedTitle,
      description: item.description,
      amount: item.amount,
      imageUrl: item.imageUrl,
      tags: item.tags,
      updatedAt,
    };

    let upserted;

    if (existing) {
      existing.set(payload);
      if (!existing.affiliateLink || existing.affiliateLink === item.affiliateLink) {
        existing.affiliateLink = item.affiliateLink;
      }
      upserted = await existing.save();
    } else {
      upserted = await ProductModel.create({
        id: item.id || randomUUID(),
        affiliateLink: item.affiliateLink,
        createdAt,
        ...payload,
      });
    }

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
    reelType: episode.reelType === "create" ? "create" : "upgrade",
    theme: typeof episode.theme === "string" ? episode.theme : undefined,
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
    const key = getProductIdentityKey(item);

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
