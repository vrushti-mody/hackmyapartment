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

function getGoogleDriveFileId(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl);
    if (!parsed.hostname.includes("drive.google.com")) return null;

    const idFromQuery = parsed.searchParams.get("id");
    if (idFromQuery) return idFromQuery;

    const match = parsed.pathname.match(/\/file\/d\/([^/]+)/);
    if (match?.[1]) return match[1];

    return null;
  } catch {
    return null;
  }
}

function buildFetchCandidates(rawUrl: string): string[] {
  const fileId = getGoogleDriveFileId(rawUrl);
  if (!fileId) return [rawUrl];

  return [
    // Direct blob route
    `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`,
    // Direct image-friendly route
    `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w2048`,
    rawUrl,
  ];
}

async function fetchImageCandidate(url: string): Promise<Response> {
  return fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      Accept: "image/*,*/*;q=0.8",
    },
    redirect: "follow",
    cache: "no-store",
  });
}

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
    const candidates = buildFetchCandidates(decodedUrl);

    let response: Response | null = null;
    let contentType = "";
    for (const candidate of candidates) {
      const attempt = await fetchImageCandidate(candidate);
      if (!attempt.ok) {
        continue;
      }

      const candidateType = (attempt.headers.get("content-type") || "").toLowerCase();
      if (candidateType.includes("text/html")) {
        continue;
      }

      response = attempt;
      contentType = candidateType || "image/jpeg";
      break;
    }

    if (!response) {
      return new NextResponse(
        `The image URL returned HTML or failed upstream. If this is Google Drive, ensure the file is shared as "Anyone with the link".`,
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
