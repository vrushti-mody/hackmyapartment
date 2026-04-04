import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ path: "./.env.local" });

const MONGODB_URI = String(process.env.MONGODB_URI || "").replace(
  /\$\{MONGODB_PASSWORD\}/g,
  String(process.env.MONGODB_PASSWORD || "")
);

if (!MONGODB_URI) {
  console.error("No MONGODB_URI found in app/.env.local");
  process.exit(1);
}

const EpisodeSchema = new mongoose.Schema(
  {
    id: String,
    roomType: String,
    theme: String,
    items: [mongoose.Schema.Types.Mixed],
    createdAt: String,
    updatedAt: String,
  },
  { strict: false, versionKey: false }
);

const ProductSchema = new mongoose.Schema(
  {
    id: String,
    title: String,
    affiliateLink: String,
    createdAt: String,
    updatedAt: String,
  },
  { strict: false, versionKey: false }
);

const Episode =
  mongoose.models.EpisodeInspect ||
  mongoose.model("EpisodeInspect", EpisodeSchema, "episodes");
const Product =
  mongoose.models.ProductInspect ||
  mongoose.model("ProductInspect", ProductSchema, "products");

function summarizeItem(item) {
  if (!item) return null;
  if (typeof item === "object" && "affiliateLink" in item) {
    return {
      kind: "embedded",
      id: String(item.id || ""),
      title: String(item.title || ""),
      affiliateLink: String(item.affiliateLink || ""),
    };
  }

  return {
    kind: "ref",
    value: String(item),
  };
}

async function main() {
  await mongoose.connect(MONGODB_URI);

  const [episodeCount, productCount, episodes, products] = await Promise.all([
    Episode.countDocuments(),
    Product.countDocuments(),
    Episode.find({}).limit(5).lean(),
    Product.find({}).limit(10).lean(),
  ]);

  console.log(JSON.stringify({
    episodeCount,
    productCount,
    episodes: episodes.map((episode) => ({
      _id: String(episode._id),
      id: episode.id,
      roomType: episode.roomType,
      theme: episode.theme || null,
      itemsCount: Array.isArray(episode.items) ? episode.items.length : 0,
      sampleItems: Array.isArray(episode.items)
        ? episode.items.slice(0, 5).map(summarizeItem)
        : [],
    })),
    products: products.map((product) => ({
      _id: String(product._id),
      id: product.id,
      title: product.title,
      affiliateLink: product.affiliateLink,
    })),
  }, null, 2));

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
