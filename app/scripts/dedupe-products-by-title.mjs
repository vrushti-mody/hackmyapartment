import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ path: "./.env.local" });

const MONGODB_URI = String(process.env.MONGODB_URI || "")
  .trim()
  .replace(/^['"]|['"]$/g, "")
  .replace(
    /\$\{MONGODB_PASSWORD\}/g,
    String(process.env.MONGODB_PASSWORD || "").trim()
  );

if (!MONGODB_URI) {
  console.error("No MONGODB_URI found in app/.env.local");
  process.exit(1);
}

const EpisodeSchema = new mongoose.Schema(
  {
    items: [mongoose.Schema.Types.Mixed],
    updatedAt: String,
  },
  { strict: false, versionKey: false }
);

const ProductSchema = new mongoose.Schema(
  {
    id: String,
    title: String,
    normalizedTitle: String,
    affiliateLink: String,
    createdAt: String,
    updatedAt: String,
  },
  { strict: false, versionKey: false }
);

const Episode =
  mongoose.models.EpisodeTitleDedupe ||
  mongoose.model("EpisodeTitleDedupe", EpisodeSchema, "episodes");
const Product =
  mongoose.models.ProductTitleDedupe ||
  mongoose.model("ProductTitleDedupe", ProductSchema, "products");

function normalizeProductTitle(value) {
  const title = typeof value === "string" ? value.trim().toLowerCase() : "";

  return title
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function identityKeyForEmbeddedItem(item) {
  const normalizedTitle = normalizeProductTitle(item?.title);
  if (normalizedTitle) return `title:${normalizedTitle}`;

  const affiliateLink =
    typeof item?.affiliateLink === "string" ? item.affiliateLink.trim() : "";
  if (affiliateLink) return `link:${affiliateLink}`;

  const id = typeof item?.id === "string" ? item.id.trim() : "";
  return id ? `id:${id}` : "";
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const products = await Product.find({}).sort({ createdAt: 1, _id: 1 });
  const canonicalByTitle = new Map();
  const duplicateIdMap = new Map();
  let normalizedUpdates = 0;
  let duplicateProducts = 0;

  for (const product of products) {
    const normalizedTitle = normalizeProductTitle(product.title);

    if (product.normalizedTitle !== normalizedTitle) {
      product.normalizedTitle = normalizedTitle;
      product.updatedAt = new Date().toISOString();
      await product.save();
      normalizedUpdates += 1;
    }

    if (!normalizedTitle) continue;

    const canonical = canonicalByTitle.get(normalizedTitle);
    if (!canonical) {
      canonicalByTitle.set(normalizedTitle, product);
      continue;
    }

    duplicateIdMap.set(String(product._id), String(canonical._id));
    duplicateProducts += 1;
  }

  const episodes = await Episode.find({});
  let relinkedEpisodes = 0;

  for (const episode of episodes) {
    const nextItems = [];
    const seen = new Set();

    for (const rawItem of episode.items || []) {
      if (rawItem && typeof rawItem === "object" && "affiliateLink" in rawItem) {
        const key = identityKeyForEmbeddedItem(rawItem);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        nextItems.push(rawItem);
        continue;
      }

      const objectId = String(rawItem || "");
      if (!objectId) continue;

      const canonicalId = duplicateIdMap.get(objectId) || objectId;
      const key = `ref:${canonicalId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      nextItems.push(new mongoose.Types.ObjectId(canonicalId));
    }

    const currentItems = JSON.stringify((episode.items || []).map((item) => String(item)));
    const updatedItems = JSON.stringify(nextItems.map((item) => String(item)));

    if (currentItems !== updatedItems) {
      episode.items = nextItems;
      episode.updatedAt = new Date().toISOString();
      await episode.save();
      relinkedEpisodes += 1;
    }
  }

  if (duplicateIdMap.size > 0) {
    await Product.deleteMany({
      _id: { $in: Array.from(duplicateIdMap.keys()) },
    });
  }

  console.log(`Normalized products updated: ${normalizedUpdates}`);
  console.log(`Duplicate products merged: ${duplicateProducts}`);
  console.log(`Episodes relinked: ${relinkedEpisodes}`);
  console.log(`Products remaining: ${await Product.countDocuments()}`);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
