import mongoose from "mongoose";


const EpisodeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  reelType: { type: String, enum: ["create", "upgrade"], default: "upgrade" },
  theme: { type: String },
  roomType: { type: String, required: true },
  budgetPhrase: { type: String, required: true },
  rawTotal: { type: Number, required: true },
  roundedTotal: { type: Number, required: true },
  publishedToStorefront: { type: Boolean, default: false },
  roomImageUrl: { type: String, required: false },
  
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true },
  
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
}, {
  // Disables the default _v property.
  versionKey: false,
});

// Since Next.js API routes are stateless and might be called multiple times,
// check if the model is already compiled to avoid overwriting error.
export default mongoose.models.Episode || mongoose.model("Episode", EpisodeSchema);
