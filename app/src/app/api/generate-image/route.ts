/**
 * POST /api/generate-image
 *
 * Server-side proxy for Together AI FLUX.1-schnell-Free image generation.
 * Receives { prompt, apiKey } and returns { imageUrl } as a base64 data URI.
 * Free tier: 6 requests/minute via https://api.together.xyz
 */
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt, apiKey } = await req.json();

    if (!prompt || !apiKey) {
      return NextResponse.json(
        { error: "prompt and apiKey are required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://api.together.xyz/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "black-forest-labs/FLUX.1-schnell-Free",
          prompt: prompt,
          width: 576,   // 9:16 portrait for Instagram Reels
          height: 1024,
          steps: 4,     // Schnell is optimised for 1-4 steps
          n: 1,
          response_format: "b64_json",
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Together AI error: ${response.status} — ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const b64 = data?.data?.[0]?.b64_json;

    if (!b64) {
      return NextResponse.json(
        { error: "No image returned from Together AI" },
        { status: 500 }
      );
    }

    return NextResponse.json({ imageUrl: `data:image/jpeg;base64,${b64}` });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
