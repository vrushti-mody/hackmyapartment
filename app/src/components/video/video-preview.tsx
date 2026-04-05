/**
 * VideoPreview — Remotion Player wrapper (9:16 portrait) with Download Video.
 *
 * Hosted environments like Netlify are not a reliable place to run a full
 * Remotion server render, so we render in the browser first using Remotion's
 * web renderer and only fall back to the legacy API route if needed.
 */
"use client";

import { useRef, useState } from "react";
import { Player, PlayerRef } from "@remotion/player";
import { ReelComposition, type ReelCompositionProps } from "./reel-composition";
import { Item } from "@/lib/types";
import {
  VIDEO_WIDTH,
  VIDEO_HEIGHT,
  VIDEO_FPS,
  calculateDuration,
} from "@/lib/video-config";
import { AudioTimingMapping } from "@/lib/audio-alignment";
import { downloadBlob } from "@/lib/export";

interface VideoPreviewProps {
  items: Item[];
  roomType: string;
  budgetPhrase: string;
  roomImageUrl?: string;
  audioUrl?: string;
  timings?: AudioTimingMapping | null;
}

function toRenderSafeAssetUrl(url: string): string {
  if (
    url.startsWith("data:") ||
    url.startsWith("blob:") ||
    url.startsWith("/") ||
    url.includes("/api/proxy-image?")
  ) {
    return url;
  }

  if (/^https?:\/\//i.test(url) && typeof window !== "undefined") {
    return `${window.location.origin}/api/proxy-image?url=${encodeURIComponent(url)}`;
  }

  return url;
}

export function VideoPreview({
  items,
  roomType,
  budgetPhrase,
  roomImageUrl,
  audioUrl,
  timings,
}: VideoPreviewProps) {
  const playerRef = useRef<PlayerRef>(null);
  const [recording, setRecording] = useState(false);
  const [recordDone, setRecordDone] = useState(false);
  const [renderProgress, setRenderProgress] = useState<number | null>(null);

  if (items.length === 0) return null;

  let durationInFrames = calculateDuration(items.length);
  if (timings) {
    const totalSecs = timings.introSeconds + timings.itemSeconds.reduce((a, b) => a + b, 0) + timings.ctaSeconds;
    durationInFrames = Math.round(totalSecs * VIDEO_FPS);
  }

  const previewProps: ReelCompositionProps = {
    items,
    roomType,
    budgetPhrase,
    roomImageUrl,
    audioUrl,
    timings,
  };

  const renderInputProps: ReelCompositionProps = {
    ...previewProps,
    roomImageUrl: roomImageUrl ? toRenderSafeAssetUrl(roomImageUrl) : undefined,
    items: items.map((item) => ({
      ...item,
      imageUrl: toRenderSafeAssetUrl(item.imageUrl),
    })),
  };

  const safeSlug = roomType.toLowerCase().replace(/\s+/g, "-");

  async function requestServerRender() {
    const res = await fetch("/api/render-mp4", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(previewProps),
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    const blob = await res.blob();
    let filename = `${safeSlug}-hq.mp4`;
    const disposition = res.headers.get("Content-Disposition");
    if (disposition && disposition.includes("filename=")) {
      filename = disposition.split("filename=")[1].replace(/"/g, "");
    }

    downloadBlob(blob, filename);
  }

  async function handleSaveVideo() {
    if (recording) return;
    setRecording(true);
    setRecordDone(false);
    setRenderProgress(0);

    try {
      const { canRenderMediaOnWeb, renderMediaOnWeb } = await import(
        "@remotion/web-renderer"
      );

      const composition = {
        id: "Reel",
        component: ReelComposition,
        width: VIDEO_WIDTH,
        height: VIDEO_HEIGHT,
        fps: VIDEO_FPS,
        durationInFrames,
        defaultProps: renderInputProps,
      };

      const mp4Support = await canRenderMediaOnWeb({
        container: "mp4",
        videoCodec: "h264",
        audioCodec: audioUrl ? "aac" : null,
        width: VIDEO_WIDTH,
        height: VIDEO_HEIGHT,
        muted: !audioUrl,
        outputTarget: "arraybuffer",
      });

      const webmSupport = !mp4Support.canRender
        ? await canRenderMediaOnWeb({
            container: "webm",
            videoCodec: "vp9",
            audioCodec: audioUrl ? "opus" : null,
            width: VIDEO_WIDTH,
            height: VIDEO_HEIGHT,
            muted: !audioUrl,
            outputTarget: "arraybuffer",
          })
        : null;

      if (!mp4Support.canRender && !webmSupport?.canRender) {
        await requestServerRender();
        setRecordDone(true);
        return;
      }

      const format = mp4Support.canRender
        ? {
            container: "mp4" as const,
            videoCodec: mp4Support.resolvedVideoCodec ?? "h264",
            audioCodec: audioUrl
              ? (mp4Support.resolvedAudioCodec ?? "aac")
              : undefined,
            filename: `${safeSlug}-hq.mp4`,
          }
        : {
            container: "webm" as const,
            videoCodec: webmSupport?.resolvedVideoCodec ?? "vp9",
            audioCodec: audioUrl
              ? (webmSupport?.resolvedAudioCodec ?? "opus")
              : undefined,
            filename: `${safeSlug}-hq.webm`,
          };

      const { getBlob } = await renderMediaOnWeb({
        composition,
        inputProps: renderInputProps,
        container: format.container,
        videoCodec: format.videoCodec,
        audioCodec: format.audioCodec,
        muted: !audioUrl,
        outputTarget: "arraybuffer",
        audioBitrate: "medium",
        videoBitrate: "medium",
        scale: 1,
        logLevel: "error",
        onProgress: (progress) => {
          setRenderProgress(progress.progress);
        },
      });

      const blob = await getBlob();
      downloadBlob(blob, format.filename);
      setRecordDone(true);
    } catch (browserRenderError) {
      try {
        await requestServerRender();
        setRecordDone(true);
      } catch (serverRenderError) {
        console.error(browserRenderError);
        console.error(serverRenderError);
        alert("Failed to render video. Try the latest Chrome or Safari and try again.");
      }
    } finally {
      setRenderProgress(null);
      setRecording(false);
    }
  }


  return (
    <div className="space-y-3">
      <div className="rounded-xl overflow-hidden border border-zinc-200 bg-black">
        <Player
          ref={playerRef}
          component={ReelComposition}
          inputProps={previewProps}
          durationInFrames={durationInFrames}
          compositionWidth={VIDEO_WIDTH}
          compositionHeight={VIDEO_HEIGHT}
          fps={VIDEO_FPS}
          style={{
            width: "100%",
            aspectRatio: "9/16",
            maxHeight: 560,
          }}
          controls
          autoPlay={false}
        />
      </div>

      {/* Save Video */}
      <button
        onClick={handleSaveVideo}
        disabled={recording}
        className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition"
      >
        {recording ? (
          <>
            <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Rendering {renderProgress !== null ? `${Math.round(renderProgress * 100)}%` : "video..."}
          </>
        ) : recordDone ? (
          "Saved! Click to render again"
        ) : (
          "Download Video"
        )}
      </button>
      {!recording && !recordDone && (
        <p className="text-[11px] text-zinc-400 text-center">
          Renders in your browser first for hosted compatibility, then downloads automatically.
        </p>
      )}
    </div>
  );
}
