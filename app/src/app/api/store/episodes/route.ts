import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import EpisodeModel from "@/lib/db/models/Episode";
import {
  serializeEpisode,
  upsertProducts,
} from "@/lib/db/store-utils";

export async function GET() {
  try {
    await dbConnect();
    const episodes = await EpisodeModel.find({})
      .sort({ createdAt: -1 })
      .populate("items");

    return NextResponse.json(
      episodes.map((episode) => serializeEpisode(episode))
    );
  } catch (error) {
    console.error("Error fetching episodes:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const updatedAt = new Date().toISOString();
    const createdAt = body.createdAt || updatedAt;

    // Explicitly set publishedToStorefront = true
    body.publishedToStorefront = true;
    body.updatedAt = updatedAt;
    body.createdAt = createdAt;

    body.items = await upsertProducts(
      Array.isArray(body.items) ? body.items : [],
      createdAt,
      updatedAt
    );

    const newEpisode = await EpisodeModel.create(body);
    const populatedEpisode = await EpisodeModel.findById(newEpisode._id).populate("items");

    return NextResponse.json(serializeEpisode(populatedEpisode), { status: 201 });
  } catch (error) {
    console.error("Error creating episode:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create episode",
      },
      { status: 500 }
    );
  }
}
