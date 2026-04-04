import { randomUUID } from "crypto";
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
    createdAt: String,
    updatedAt: String,
    items: [mongoose.Schema.Types.Mixed],
  },
  { strict: false, versionKey: false }
);

const ProductSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true },
    title: String,
    description: String,
    amount: Number,
    affiliateLink: { type: String, unique: true },
    imageUrl: String,
    tags: [String],
    createdAt: String,
    updatedAt: String,
  },
  { strict: false, versionKey: false }
);

const Episode =
  mongoose.models.EpisodeBackfill ||
  mongoose.model("EpisodeBackfill", EpisodeSchema, "episodes");
const Product =
  mongoose.models.ProductBackfill ||
  mongoose.model("ProductBackfill", ProductSchema, "products");

function isEmbeddedItem(value) {
  return !!value && typeof value === "object" && "affiliateLink" in value;
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const episodes = await Episode.find({});
  console.log(`Found ${episodes.length} episodes`);

  let createdOrUpdated = 0;
  let relinkedEpisodes = 0;

  for (const episode of episodes) {
    const nextItems = [];
    const seenLinks = new Set();

    for (const rawItem of episode.items || []) {
      if (isEmbeddedItem(rawItem)) {
        const affiliateLink = String(rawItem.affiliateLink || "").trim();
        if (!affiliateLink || seenLinks.has(affiliateLink)) continue;

        seenLinks.add(affiliateLink);

        const product = await Product.findOneAndUpdate(
          { affiliateLink },
          {
            $set: {
              title: String(rawItem.title || ""),
              description: String(rawItem.description || ""),
              amount: Number(rawItem.amount || 0),
              affiliateLink,
              imageUrl: String(rawItem.imageUrl || ""),
              tags: Array.isArray(rawItem.tags)
                ? rawItem.tags.map((tag) => String(tag))
                : [],
              updatedAt: new Date().toISOString(),
            },
            $setOnInsert: {
              id: String(rawItem.id || randomUUID()),
              createdAt: String(
                episode.createdAt || episode.updatedAt || new Date().toISOString()
              ),
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        nextItems.push(product._id);
        createdOrUpdated += 1;
        continue;
      }

      const objectId = String(rawItem || "");
      if (!objectId) continue;
      if (seenLinks.has(objectId)) continue;
      seenLinks.add(objectId);
      nextItems.push(rawItem);
    }

    const changed =
      JSON.stringify((episode.items || []).map((item) => String(item))) !==
      JSON.stringify(nextItems.map((item) => String(item)));

    if (changed) {
      await Episode.updateOne({ _id: episode._id }, { $set: { items: nextItems } });
      relinkedEpisodes += 1;
    }
  }

  const productCount = await Product.countDocuments();

  console.log(`Products upserted: ${createdOrUpdated}`);
  console.log(`Episodes relinked: ${relinkedEpisodes}`);
  console.log(`Products collection count: ${productCount}`);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
