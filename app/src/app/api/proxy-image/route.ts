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

export const dynamic = "force-dynamic";

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
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        Accept: "image/*,*/*;q=0.8",
      },
      redirect: "follow",
      cache: "no-store", // Crucial: tell Next.js NOT to reuse the fetch buffer across requests
    });

    if (!response.ok) {
      return new NextResponse(`Upstream error: ${response.status}`, {
        status: 502,
      });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";

    if (contentType.includes("text/html")) {
      return new NextResponse(
        `The image URL returned an HTML page instead of an image. If this is a Google Drive link, make sure it is explicitly shared as "Anyone with the link".`,
        { status: 403 }
      );
    }

    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Crucial: Prevent Netlify Edge from treating /api/proxy-image as a static
        // path and serving the very first requested image for every subsequent request!
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
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
