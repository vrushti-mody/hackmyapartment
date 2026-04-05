import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  normalizedTitle: { type: String },
  description: { type: String }, // optional, depending on how lean we want it
  amount: { type: Number, required: true },
  affiliateLink: { type: String, required: true, unique: true }, // The global deduplication key
  imageUrl: { type: String },
  tags: [{ type: String }],

  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true },
}, {
  versionKey: false,
});

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
