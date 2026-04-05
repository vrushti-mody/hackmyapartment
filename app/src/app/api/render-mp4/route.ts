import { NextResponse } from "next/server";

/**
 * Server-side Remotion rendering is disabled for Netlify deployments.
 *
 * The required packages (@remotion/renderer, @sparticuz/chromium) exceed
 * Netlify's 250 MB serverless function size limit. Video rendering is handled
 * entirely in the browser via @remotion/web-renderer + @ffmpeg/ffmpeg WASM.
 *
 * This stub endpoint returns a helpful error so the client can surface the
 * right message if the browser render path somehow fails.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Server-side video rendering is not available in this deployment. " +
        "Please use the in-browser renderer (the default). " +
        "If the browser render failed, try using Chrome or Edge for best compatibility.",
    },
    { status: 501 }
  );
}
