import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import EpisodeModel from "@/lib/db/models/Episode";
import ProductModel from "@/lib/db/models/Product";
import {
  BundleSummary,
  serializeProduct,
  toBundleSummary,
} from "@/lib/db/store-utils";
import { getProductIdentityKey, normalizeAffiliateLink } from "@/lib/product-identity";

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
          const affiliateLink = normalizeAffiliateLink(productObjectId.affiliateLink);
          const identityKey = getProductIdentityKey(productObjectId);
          if (!identityKey || !affiliateLink || seenInBundle.has(identityKey)) continue;

          seenInBundle.add(identityKey);
          const existing = embeddedProducts.get(identityKey);
          const nextBundleList = existing?.bundles || [];
          nextBundleList.push(bundle);

          embeddedProducts.set(identityKey, {
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

    const dedupedProducts = new Map<string, (typeof activeProducts)[number]>();

    for (const product of activeProducts) {
      const identityKey = getProductIdentityKey(
        product as Record<string, unknown>
      );
      if (!identityKey) continue;

      const existing = dedupedProducts.get(identityKey);
      if (!existing) {
        dedupedProducts.set(identityKey, product);
        continue;
      }

      const mergedBundles = [...existing.bundles];
      for (const bundle of product.bundles) {
        if (!mergedBundles.some((candidate) => candidate.id === bundle.id)) {
          mergedBundles.push(bundle);
        }
      }

      existing.bundles = mergedBundles;
    }

    const knownIdentityKeys = new Set(dedupedProducts.keys());

    const fallbackProducts = Array.from(embeddedProducts.values())
      .filter(
        (product) =>
          !knownIdentityKeys.has(
            getProductIdentityKey(product as Record<string, unknown>)
          )
      )
      .map((product) => ({
        ...product,
        episodeId: product.bundles[0]?.id || "",
        episodeRoomType: product.bundles[0]?.roomType || "",
      }));

    return NextResponse.json([...dedupedProducts.values(), ...fallbackProducts]);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
