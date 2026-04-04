import { NextRequest, NextResponse } from "next/server";
import { bundle } from "@remotion/bundler";
import { getCompositions, renderMedia } from "@remotion/renderer";
import path from "path";
import fs from "fs";
import os from "os";

// We cache the bundle path in memory because bundling takes a few seconds.
// This makes subsequent renders MUCH faster.
let cachedBundleUrl: string | null = null;

export const maxDuration = 60; // Next.js serverless timeout for API routes (60s limit is typical on Hobby, but local isn't affected)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, roomType, budgetPhrase, roomImageUrl, audioUrl, timings } = body;

    // Determine the duration dynamically based on timings or fallback logic
    let durationInFrames = 600; // default 20s
    if (timings) {
      const totalSecs = timings.introSeconds + timings.itemSeconds.reduce((a: number, b: number) => a + b, 0) + timings.ctaSeconds;
      durationInFrames = Math.round(totalSecs * 30); // VIDEO_FPS = 30
    } else if (items?.length) {
      // 3.5s intro, 5s per item, 4s hook, 1.5s padding
      const secs = 3.5 + items.length * 5 + 4 + 1.5;
      durationInFrames = Math.round(secs * 30);
    }

    // Ensure we have a valid bundle
    // We override cachedBundleUrl intentionally to flush the old proxy bug out of memory
    console.log("Bundling Remotion composition...");
    const entryPoint = path.join(process.cwd(), "src/remotion/index.ts");
    cachedBundleUrl = await bundle({
      entryPoint,
      webpackOverride: (config) => {
        return {
          ...config,
          resolve: {
            ...config.resolve,
            alias: {
              ...(config.resolve?.alias ?? {}),
              "@": path.resolve(process.cwd(), "src"),
            },
          },
        };
      },
    });

    // Map all images through the secure Next.js interceptor with ABSOLUTE urls.
    // This solves Amazon Bot-blocks AND stops Remotion trying to fetch from Port 3001.
    const mappedItems = items.map((item: any) => ({
      ...item,
      imageUrl: item.imageUrl
        ? `${req.nextUrl.origin}/api/proxy-image?url=${encodeURIComponent(item.imageUrl)}`
        : item.imageUrl,
    }));

    // Strip local browser blob URLs from the backend render payload!
    // Headless Chrome on the server cannot access the local browser's memory tab.
    const safeBody = {
      ...body,
      items: mappedItems,
    };

    // Verify composition exists
    const compositions = await getCompositions(cachedBundleUrl, { inputProps: safeBody });
    const video = compositions.find((c) => c.id === "Reel");
    if (!video) throw new Error("No composition 'Reel' found");

    // Start rendering using Headless Chrome
    console.log("Rendering MP4...");
    const outputLocation = path.join(os.tmpdir(), `reel-${Date.now()}.mp4`);
    
    await renderMedia({
      composition: video,
      serveUrl: cachedBundleUrl,
      outputLocation,
      inputProps: {
        ...safeBody,
      },
      codec: "h264",
      imageFormat: "jpeg",
      audioCodec: audioUrl ? "aac" : undefined, 
      jpegQuality: 75,
    });
    console.log("Finished rendering:", outputLocation);

    // Read the MP4 buffer and delete the temp file
    const fileBuffer = fs.readFileSync(outputLocation);
    fs.unlinkSync(outputLocation);

    // Stream download directly
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${roomType.toLowerCase().replace(/\s+/g, "-")}-hq.mp4"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    });

  } catch (err: any) {
    console.error("Renderer error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
