import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "./app/.env.local" }); // Ensure we pick up the NextJS env file

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("No MONGODB_URI found.");
  process.exit(1);
}

// Flat definition to parse existing ones without strict validation blocks breaking
const EpisodeSchema = new mongoose.Schema({
  id: String,
  roomType: String,
  items: [mongoose.Schema.Types.Mixed] // Allow reading both ObjectIds or raw objects
}, { strict: false });

const ProductSchema = new mongoose.Schema({
  id: String,
  title: String,
  description: String,
  amount: Number,
  affiliateLink: { type: String, unique: true },
  imageUrl: String,
  tags: [String],
  createdAt: String,
  updatedAt: String,
}, { strict: false });

const Episode = mongoose.models.Episode || mongoose.model("Episode", EpisodeSchema);
const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);

async function migrate() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB...");

  const episodes = await Episode.find({});
  console.log(`Found ${episodes.length} episodes to evaluate.`);

  for (const ep of episodes) {
    console.log(`\nProcessing Episode: ${ep.id}`);
    const newObjectIds = [];
    const seenLinks = new Set();

    // The items array might contain a mix of raw objects or existing ObjectIds
    for (const item of ep.items) {
      if (typeof item === 'object' && item.affiliateLink) {
        const affiliateLink = String(item.affiliateLink).trim();
        if (!affiliateLink || seenLinks.has(affiliateLink)) {
          console.log(` - Skipping duplicate affiliate link: ${affiliateLink}`);
          continue;
        }
        seenLinks.add(affiliateLink);

        // It's a raw embed item, we need to map it!
        // Upsert into Product Collection natively matching on affiliateLink
        const updatedProd = await Product.findOneAndUpdate(
          { affiliateLink },
          {
            $set: {
              title: item.title,
              description: item.description,
              amount: item.amount,
              affiliateLink,
              imageUrl: item.imageUrl,
              tags: item.tags || [],
              updatedAt: new Date().toISOString()
            },
            $setOnInsert: {
              id: item.id,
              createdAt: ep.createdAt || new Date().toISOString(),
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        console.log(` - Upserted Product: ${updatedProd.title.slice(0, 25)}... -> ID: ${updatedProd._id}`);
        newObjectIds.push(updatedProd._id);

      } else {
        // Assume it's an ObjectId or an object holding reference if already migrated!
        console.log(` - Skipping reference or invalid entry:`, item);
        newObjectIds.push(item);
      }
    }

    // Rewrite the Episode natively referencing our new ObjectIds
    await Episode.updateOne(
      { _id: ep._id },
      { $set: { items: newObjectIds } }
    );
    console.log(`[✔] Re-linked Episode ${ep.id} with ${newObjectIds.length} ObjectIds`);
  }

  console.log("\n✅ Migration complete!");
  process.exit(0);
}

migrate().catch(console.error);
