import { NextRequest, NextResponse } from "next/server";

interface ScriptRequestItem {
  amount: number;
  title: string;
}

interface ScriptResponseCandidate {
  finishReason?: string;
  content?: {
    parts?: Array<{
      text?: string;
    }>;
  };
}

export async function POST(req: NextRequest) {
  try {
    const { items, roomType, apiKey } = (await req.json()) as {
      items: ScriptRequestItem[];
      roomType: string;
      apiKey: string;
    };

    if (!items || !items.length || !apiKey) {
      return NextResponse.json(
        { error: "items and apiKey are required" },
        { status: 400 }
      );
    }

    // gemini-2.0-flash: no internal thinking overhead, fast creative writing,
    // won't starve the output token budget like 2.5-flash does.
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const capped = items.slice(0, 5);

    // Strip or replace characters that confuse Gemini's output or break JSON parsing:
    // - inch/foot symbols (", ') → words  
    // - em/en dashes → comma
    // - other non-ASCII special chars → stripped
    function sanitizeForPrompt(text: string): string {
      return text
        .replace(/(\d+)"/g, "$1 inch")   // 79" → 79 inch
        .replace(/(\d+)'/g, "$1 foot")   // 6' → 6 foot
        .replace(/["]/g, "")             // remove remaining stray quotes
        .replace(/[\u2018\u2019]/g, "'") // curly single quotes → straight
        .replace(/[\u201C\u201D]/g, "")  // curly double quotes → removed
        .replace(/[\u2013\u2014]/g, ", ") // en/em dash → comma
        .replace(/\s+/g, " ")
        .trim();
    }

    // Build one block per product with only the name and price.
    const introChunk = `CHUNK 1 (Opening hook):
Write ONE short, punchy sentence (max 12 words) that hooks viewers. Do NOT name any product yet.`;

    const productChunks = capped.map((item, idx: number) => {
      const title = sanitizeForPrompt(item.title);
      return `CHUNK ${idx + 2} (Product ${idx + 1}):
Product name: ${title}
Price: ${Math.floor(item.amount)} dollars
Write ONE complete sentence (8-14 words) naming this product and its price only.
Do NOT mention descriptions, features, benefits, materials, style, or reasons to buy.`;
    });

    const ctaChunk = `CHUNK ${capped.length + 2} (Closing CTA):
Write exactly this: "Total upgrade for under ${Math.ceil(items.reduce((sum, item) => sum + item.amount, 0))} dollars! Comment ${roomType.toUpperCase()} for product links or check bio. Follow for more."`;

    const allChunks = [introChunk, ...productChunks, ctaChunk].join("\n\n---\n\n");

    const prompt = `You are writing a fast-paced 60-second Instagram Reel voiceover script.
The script must have ${capped.length + 2} chunks separated by exactly one blank line (double newline).
Total word count: 55 to 85 words.

${allChunks}

GLOBAL RULES (strictly follow every one):
- Output ONLY the script text. No labels, no "CHUNK" headers, no markdown, no asterisks, no dashes or em-dashes.
- Separate every chunk with exactly one blank line (double newline) and nothing else.
- NEVER use dashes (hyphen, en-dash, em-dash). Use commas or periods instead.
- Write dollar amounts as the number followed by the word "dollars" (e.g. "79 dollars").
- Every sentence must be grammatically complete. Never end a chunk mid-sentence.
- Keep every chunk SHORT. One sentence each. Punchy and energetic.
- Tone: fast, excited, conversational, like a popular content creator.
`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 1024, // plenty for this short script with no thinking overhead
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

    const data = (await response.json()) as {
      candidates?: ScriptResponseCandidate[];
    };
    const candidate = data?.candidates?.[0];

    // Surface truncation errors clearly instead of returning broken text
    const finishReason = candidate?.finishReason;
    if (finishReason && finishReason !== "STOP") {
      return NextResponse.json(
        { error: `Script generation stopped early (reason: ${finishReason}). Try again or shorten product names.` },
        { status: 500 }
      );
    }

    let text = candidate?.content?.parts?.[0]?.text || "";

    // Clean up markdown artifacts and stray quote chars left by the model
    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .replace(/"/g, "")  // remove any stray inch-mark quotes the model output
      .trim();

    return NextResponse.json({ script: text });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
