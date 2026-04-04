/**
 * POST /api/generate-tags
 *
 * Server-side proxy for Google Gemini Flash text generation.
 * Receives { title, description, roomType, apiKey } and returns { tags: string[] }.
 * Generates 5–8 short, relevant tags for use in storefront filtering.
 */
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { title, description, roomType, apiKey } = await req.json();

    if (!title || !apiKey) {
      return NextResponse.json(
        { error: "title and apiKey are required" },
        { status: 400 }
      );
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const prompt = `Generate 5 to 8 short, specific product tags for a home decor / apartment item.
Product title: "${title}"
Product description: "${description || "N/A"}"
Room type: "${roomType || "home"}"

Rules:
- Each tag is 1-3 words, lowercase
- Tags describe category, style, use case, or price tier
- Include the room type as one tag
- Return ONLY a JSON array of strings, no explanation. Example: ["cozy", "under $20", "bedroom", "lighting", "minimalist"]`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
          maxOutputTokens: 800, // Raised from 200 to allow room for Gemini 2.5's internal "thinking" protocol
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Gemini API error: ${response.status} ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";
    console.log("[generate-tags] RAW RESPONSE TEXT:\n", text); // Debug payload format

    let tags: string[] = [];

    // Gemini 1.5+ constantly hallucinates markdown codeblocks even when responseMimeType is set.
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    try {
      tags = JSON.parse(text);
      if (!Array.isArray(tags)) tags = [];
    } catch {
      // Fallback: extract quoted words
      console.log("[generate-tags] JSON PARSE FAILED. Falling back to regex...");
      const matches = text.match(/"([^"]+)"/g);
      tags = matches ? matches.map((m: string) => m.replace(/"/g, "")) : [];
    }

    console.log("[generate-tags] FINAL EXTRACTED TAGS:", tags);

    return NextResponse.json({ tags: tags.slice(0, 8) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
