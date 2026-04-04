import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import EpisodeModel from "@/lib/db/models/Episode";
import {
  deleteOrphanProducts,
  serializeEpisode,
  upsertProducts,
} from "@/lib/db/store-utils";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const updatedAt = new Date().toISOString();
    const updatePayload = {
      ...body,
      updatedAt,
    };

    if (Array.isArray(body.items)) {
      updatePayload.items = await upsertProducts(
        body.items,
        body.createdAt || updatedAt,
        updatedAt
      );
    }

    const updated = await EpisodeModel.findOneAndUpdate(
      { id },
      { $set: updatePayload },
      { new: true, runValidators: true }
    ).populate("items");

    if (!updated) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 });
    }

    await deleteOrphanProducts();

    return NextResponse.json({
      success: true,
      episode: serializeEpisode(updated),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;

    const deleted = await EpisodeModel.findOneAndDelete({ id });

    if (!deleted) {
      return NextResponse.json({ error: "Episode not found for deletion" }, { status: 404 });
    }

    await deleteOrphanProducts();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
