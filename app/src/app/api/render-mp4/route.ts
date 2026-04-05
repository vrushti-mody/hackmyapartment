import { NextRequest, NextResponse } from "next/server";
import { bundle } from "@remotion/bundler";
import { getCompositions, renderMedia } from "@remotion/renderer";
import path from "path";
import fs from "fs";
import os from "os";

// We cache the bundle path in memory because bundling takes a few seconds.
// This makes subsequent renders MUCH faster.
let cachedBundleUrl: string | null = null;
let cachedBrowserExecutable: string | null | undefined;
const remotionTempRoot = path.join(os.tmpdir(), "hackmyapartment-remotion");
const remotionBundleDir = path.join(remotionTempRoot, "bundle");

interface RenderItemPayload {
  imageUrl?: string;
  [key: string]: unknown;
}

interface RenderRequestBody {
  items?: RenderItemPayload[];
  roomType?: string;
  roomImageUrl?: string;
  audioUrl?: string;
}

function toProxyUrl(origin: string, url?: string) {
  if (!url) return url;
  if (
    url.startsWith("data:") ||
    url.startsWith("blob:") ||
    url.startsWith("/api/proxy-image?")
  ) {
    return url;
  }

  if (/^https?:\/\//i.test(url)) {
    return `${origin}/api/proxy-image?url=${encodeURIComponent(url)}`;
  }

  return url;
}

async function ensureWritableRemotionPaths() {
  await fs.promises.mkdir(remotionTempRoot, { recursive: true });
  await fs.promises.mkdir(remotionBundleDir, { recursive: true });
}

async function withWritableRemotionCwd<T>(fn: () => Promise<T>) {
  const previousCwd = process.cwd();
  process.chdir(remotionTempRoot);

  try {
    return await fn();
  } finally {
    process.chdir(previousCwd);
  }
}

async function getHostedBrowserExecutable() {
  if (cachedBrowserExecutable !== undefined) {
    return cachedBrowserExecutable;
  }

  if (process.platform !== "linux") {
    cachedBrowserExecutable = null;
    return cachedBrowserExecutable;
  }

  try {
    const chromiumModule = await import("@sparticuz/chromium");
    const Chromium = chromiumModule.default;
    Chromium.setGraphicsMode = false;
    cachedBrowserExecutable = await Chromium.executablePath();
    return cachedBrowserExecutable;
  } catch (error) {
    console.warn("Falling back to Remotion-managed browser", error);
    cachedBrowserExecutable = null;
    return cachedBrowserExecutable;
  }
}

export const maxDuration = 60; // Next.js serverless timeout for API routes (60s limit is typical on Hobby, but local isn't affected)

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RenderRequestBody;
    const { items = [], roomType = "room", roomImageUrl, audioUrl } = body;

    await ensureWritableRemotionPaths();
    const browserExecutable = await getHostedBrowserExecutable();
    const chromiumOptions =
      process.platform === "linux"
        ? { enableMultiProcessOnLinux: false }
        : undefined;

    // Ensure we have a valid bundle
    if (!cachedBundleUrl || !fs.existsSync(cachedBundleUrl)) {
      console.log("Bundling Remotion composition...");
      const entryPoint = path.join(process.cwd(), "src/remotion/index.ts");
      cachedBundleUrl = await bundle({
        entryPoint,
        outDir: remotionBundleDir,
        enableCaching: false,
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
    }

    // Map all images through the secure Next.js interceptor with ABSOLUTE urls.
    // This solves Amazon Bot-blocks AND stops Remotion trying to fetch from Port 3001.
    const mappedItems = items.map((item) => ({
      ...item,
      imageUrl: toProxyUrl(req.nextUrl.origin, item.imageUrl),
    }));

    // Strip local browser blob URLs from the backend render payload!
    // Headless Chrome on the server cannot access the local browser's memory tab.
    const safeBody = {
      ...body,
      items: mappedItems,
      roomImageUrl: toProxyUrl(req.nextUrl.origin, roomImageUrl),
    };

    // Verify composition exists
    const compositions = await withWritableRemotionCwd(() =>
      getCompositions(cachedBundleUrl!, {
        inputProps: safeBody,
        chromeMode: "headless-shell",
        browserExecutable,
        chromiumOptions,
        onBrowserDownload: ({ chromeMode }) => ({
          version: null,
          onProgress: ({ percent }) => {
            console.log(
              `Downloading ${chromeMode} for Remotion: ${Math.round(percent)}%`
            );
          },
        }),
      })
    );
    const video = compositions.find((c) => c.id === "Reel");
    if (!video) throw new Error("No composition 'Reel' found");

    // Start rendering using Headless Chrome
    console.log("Rendering MP4...");
    const outputLocation = path.join(os.tmpdir(), `reel-${Date.now()}.mp4`);
    
    await withWritableRemotionCwd(() =>
      renderMedia({
        composition: video,
        serveUrl: cachedBundleUrl!,
        outputLocation,
        inputProps: {
          ...safeBody,
        },
        codec: "h264",
        imageFormat: "jpeg",
        audioCodec: audioUrl ? "aac" : undefined,
        jpegQuality: 75,
        chromeMode: "headless-shell",
        browserExecutable,
        chromiumOptions,
        onBrowserDownload: ({ chromeMode }) => ({
          version: null,
          onProgress: ({ percent }) => {
            console.log(
              `Downloading ${chromeMode} for Remotion: ${Math.round(percent)}%`
            );
          },
        }),
      })
    );
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

  } catch (err: unknown) {
    console.error("Renderer error:", err);
    const message =
      err instanceof Error ? err.message : "Unknown video rendering error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
