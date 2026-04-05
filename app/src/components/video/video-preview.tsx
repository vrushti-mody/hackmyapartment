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

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

const remotionPublicLicenseKey =
  process.env.NEXT_PUBLIC_REMOTION_LICENSE_KEY?.trim() || "free-license";

type FFmpegProgressListener = (progress: number) => void;

let ffmpegPromise: Promise<{
  ffmpeg: import("@ffmpeg/ffmpeg").FFmpeg;
  fetchFile: typeof import("@ffmpeg/util").fetchFile;
}> | null = null;

async function getBrowserFfmpeg() {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const [{ FFmpeg }, { fetchFile }] = await Promise.all([
        import("@ffmpeg/ffmpeg"),
        import("@ffmpeg/util"),
      ]);

      const ffmpeg = new FFmpeg();
      await ffmpeg.load();

      return { ffmpeg, fetchFile };
    })().catch((error) => {
      ffmpegPromise = null;
      throw error;
    });
  }

  return ffmpegPromise;
}

async function transcodeWebmToMp4(
  inputBlob: Blob,
  hasAudio: boolean,
  onProgress?: FFmpegProgressListener
) {
  const { ffmpeg, fetchFile } = await getBrowserFfmpeg();
  const inputName = `input-${Date.now()}.webm`;
  const outputName = `output-${Date.now()}.mp4`;

  const progressHandler = ({ progress }: { progress: number }) => {
    onProgress?.(progress);
  };

  ffmpeg.on("progress", progressHandler);

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(inputBlob));

    const args = [
      "-i",
      inputName,
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      outputName,
    ];

    if (hasAudio) {
      args.splice(args.length - 1, 0, "-c:a", "aac");
    } else {
      args.splice(args.length - 1, 0, "-an");
    }

    const exitCode = await ffmpeg.exec(args);
    if (exitCode !== 0) {
      throw new Error(`FFmpeg exited with code ${exitCode}`);
    }

    const output = await ffmpeg.readFile(outputName);
    const bytes =
      output instanceof Uint8Array
        ? output
        : new TextEncoder().encode(String(output));
    const buffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    ) as ArrayBuffer;

    return new Blob([buffer], { type: "video/mp4" });
  } finally {
    ffmpeg.off("progress", progressHandler);

    try {
      await ffmpeg.deleteFile(inputName);
    } catch {}

    try {
      await ffmpeg.deleteFile(outputName);
    } catch {}
  }
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
  const [renderMessage, setRenderMessage] = useState("Rendering video...");

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
    setRenderMessage("Rendering video...");

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
            videoCodec: mp4Support?.resolvedVideoCodec ?? "h264",
            audioCodec: audioUrl
              ? (mp4Support?.resolvedAudioCodec ?? "aac")
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
        licenseKey: remotionPublicLicenseKey,
        onProgress: (progress) => {
          setRenderProgress(format.container === "webm" ? progress.progress * 0.65 : progress.progress);
        },
      });

      const renderedBlob = await getBlob();

      if (format.container === "webm") {
        try {
          setRenderMessage("Converting to MP4...");
          const mp4Blob = await transcodeWebmToMp4(
            renderedBlob,
            Boolean(audioUrl),
            (progress) => {
              setRenderProgress(0.65 + progress * 0.35);
            }
          );
          downloadBlob(mp4Blob, `${safeSlug}-hq.mp4`);
        } catch (transcodeError) {
          try {
            await requestServerRender();
          } catch (serverRenderError) {
            console.error(transcodeError);
            console.error(serverRenderError);
            downloadBlob(renderedBlob, format.filename);
            alert(
              "MP4 conversion failed, so a WebM video was downloaded instead."
            );
          }
        }
      } else {
        downloadBlob(renderedBlob, format.filename);
      }

      setRecordDone(true);
    } catch (browserRenderError) {
      try {
        setRenderMessage("Trying server render...");
        await requestServerRender();
        setRecordDone(true);
      } catch (serverRenderError) {
        console.error("Browser render error:", browserRenderError);
        console.error("Server render error:", serverRenderError);
        alert(
          `Browser render failed: ${getErrorMessage(browserRenderError)}\n\nServer fallback failed: ${getErrorMessage(serverRenderError)}`
        );
      }
    } finally {
      setRenderProgress(null);
      setRecordMessageAndCleanup();
    }
  }

  function setRecordMessageAndCleanup() {
    setRenderMessage("Rendering video...");
    setRecording(false);
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
          acknowledgeRemotionLicense
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
            {renderMessage} {renderProgress !== null ? `${Math.round(renderProgress * 100)}%` : ""}
          </>
        ) : recordDone ? (
          "Saved! Click to render again"
        ) : (
          "Download MP4"
        )}
      </button>
      {!recording && !recordDone && (
        <p className="text-[11px] text-zinc-400 text-center">
          Tries browser render first, then converts to MP4 in-browser for a hosted-safe download.
        </p>
      )}
    </div>
  );
}
