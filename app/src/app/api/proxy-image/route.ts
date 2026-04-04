/**
 * /api/proxy-image — Server-side image proxy.
 *
 * Remotion's iframe sandbox blocks cross-origin image requests from Google Drive
 * and other external hosts. This route fetches the image on the server and
 * streams it back with permissive CORS headers so Remotion can render it.
 *
 * Usage: /api/proxy-image?url=<encoded-image-url>
 */
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  let decodedUrl: string;
  try {
    decodedUrl = decodeURIComponent(url);
  } catch {
    return new NextResponse("Invalid url parameter", { status: 400 });
  }

  try {
    const response = await fetch(decodedUrl, {
      headers: {
        // Mimic a browser request to avoid service blocks
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        Accept: "image/*,*/*;q=0.8",
      },
      // Follow redirects (Google Drive thumbnails redirect once)
      redirect: "follow",
    });

    if (!response.ok) {
      return new NextResponse(`Upstream error: ${response.status}`, {
        status: 502,
      });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new NextResponse(
      `Failed to fetch image: ${err instanceof Error ? err.message : "Unknown error"}`,
      { status: 500 }
    );
  }
}
