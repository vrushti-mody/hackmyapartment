import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import EpisodeModel from "@/lib/db/models/Episode";
import ProductModel from "@/lib/db/models/Product";
import {
  BundleSummary,
  serializeProduct,
  toBundleSummary,
} from "@/lib/db/store-utils";

function isEmbeddedItem(value: unknown): value is {
  id?: string;
  title?: string;
  description?: string;
  amount?: number;
  affiliateLink?: string;
  imageUrl?: string;
  tags?: string[];
} {
  return !!value && typeof value === "object" && "affiliateLink" in value;
}

function getAffiliateLink(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const maybeLink = (value as { affiliateLink?: unknown }).affiliateLink;
  return typeof maybeLink === "string" ? maybeLink.trim() : "";
}

export async function GET() {
  try {
    await dbConnect();

    const [products, episodes] = await Promise.all([
      ProductModel.find({}).sort({ updatedAt: -1 }),
      EpisodeModel.find({})
        .sort({ createdAt: -1 })
        .select("id roomType budgetPhrase roomImageUrl createdAt items"),
    ]);

    const bundlesByProductId = new Map<string, ReturnType<typeof toBundleSummary>[]>();
    const embeddedProducts = new Map<
      string,
      {
        id: string;
        title: string;
        description: string;
        amount: number;
        affiliateLink: string;
        imageUrl: string;
        tags: string[];
        createdAt: string;
        updatedAt: string;
        bundles: BundleSummary[];
      }
    >();

    for (const episode of episodes) {
      const bundle = toBundleSummary(episode.toObject());
      const seenInBundle = new Set<string>();

      for (const productObjectId of episode.items) {
        if (isEmbeddedItem(productObjectId)) {
          const affiliateLink = String(productObjectId.affiliateLink || "").trim();
          if (!affiliateLink || seenInBundle.has(affiliateLink)) continue;

          seenInBundle.add(affiliateLink);
          const existing = embeddedProducts.get(affiliateLink);
          const nextBundleList = existing?.bundles || [];
          nextBundleList.push(bundle);

          embeddedProducts.set(affiliateLink, {
            id: String(productObjectId.id || affiliateLink),
            title: String(productObjectId.title || ""),
            description: String(productObjectId.description || ""),
            amount: Number(productObjectId.amount || 0),
            affiliateLink,
            imageUrl: String(productObjectId.imageUrl || ""),
            tags: Array.isArray(productObjectId.tags)
              ? productObjectId.tags.map((tag) => String(tag))
              : [],
            createdAt: existing?.createdAt || bundle.createdAt,
            updatedAt: bundle.createdAt,
            bundles: nextBundleList,
          });
          continue;
        }

        const productId = String(productObjectId);
        if (!productId || seenInBundle.has(productId)) continue;

        seenInBundle.add(productId);
        const existing = bundlesByProductId.get(productId) || [];
        existing.push(bundle);
        bundlesByProductId.set(productId, existing);
      }
    }

    const activeProducts = products
      .filter((product) => (bundlesByProductId.get(String(product._id)) || []).length > 0)
      .map((product) =>
        serializeProduct(
          product,
          bundlesByProductId.get(String(product._id)) || []
        )
      );

    const knownAffiliateLinks = new Set(
      activeProducts.map((product) => getAffiliateLink(product))
    );

    const fallbackProducts = Array.from(embeddedProducts.values())
      .filter((product) => !knownAffiliateLinks.has(product.affiliateLink))
      .map((product) => ({
        ...product,
        episodeId: product.bundles[0]?.id || "",
        episodeRoomType: product.bundles[0]?.roomType || "",
      }));

    return NextResponse.json([...activeProducts, ...fallbackProducts]);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
