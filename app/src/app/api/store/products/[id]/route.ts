import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import EpisodeModel from "@/lib/db/models/Episode";
import ProductModel from "@/lib/db/models/Product";
import {
  serializeProduct,
  serializeEpisode,
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

interface LeanEpisodeWithItems {
  id?: string;
  roomType?: string;
  budgetPhrase?: string;
  roomImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  items: unknown[];
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const product = await ProductModel.findOne({ id });

    if (!product) {
      const allEpisodes = (await EpisodeModel.find({})
        .sort({ createdAt: -1 })
        .lean()) as LeanEpisodeWithItems[];

      const matchingEpisodes = allEpisodes.filter((episode) =>
        Array.isArray(episode.items) &&
        episode.items.some(
          (item: unknown) =>
            isEmbeddedItem(item) &&
            (String(item.id || "") === id)
        )
      );

      if (matchingEpisodes.length === 0) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      const primaryEpisode = matchingEpisodes[0];
      const primaryItem = primaryEpisode.items.find(
        (item: unknown) => isEmbeddedItem(item) && String(item.id || "") === id
      );

      if (!isEmbeddedItem(primaryItem)) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      const affiliateLink = String(primaryItem.affiliateLink || "").trim();
      const bundles = matchingEpisodes
        .filter((episode) =>
          Array.isArray(episode.items) &&
          episode.items.some(
            (item: unknown) =>
              isEmbeddedItem(item) &&
              String(item.affiliateLink || "").trim() === affiliateLink
          )
        )
        .map((episode) => toBundleSummary(episode));

      return NextResponse.json({
        id: String(primaryItem.id || id),
        title: String(primaryItem.title || ""),
        description: String(primaryItem.description || ""),
        amount: Number(primaryItem.amount || 0),
        affiliateLink,
        imageUrl: String(primaryItem.imageUrl || ""),
        tags: Array.isArray(primaryItem.tags)
          ? primaryItem.tags.map((tag) => String(tag))
          : [],
        createdAt: String(primaryEpisode.createdAt || ""),
        updatedAt: String(primaryEpisode.updatedAt || primaryEpisode.createdAt || ""),
        bundles,
        episodeId: bundles[0]?.id || "",
        episodeRoomType: bundles[0]?.roomType || "",
        episode: serializeEpisode(primaryEpisode),
      });
    }

    const episodes = await EpisodeModel.find({ items: product._id })
      .sort({ createdAt: -1 })
      .populate("items");

    if (episodes.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const bundles = episodes.map((episode) => toBundleSummary(episode.toObject()));

    return NextResponse.json(
      serializeProduct(product, bundles, episodes[0])
    );
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
