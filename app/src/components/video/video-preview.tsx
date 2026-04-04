/**
 * VideoPreview — Remotion Player wrapper (9:16 portrait) with Save Video.
 *
 * "Save Video" uses the browser MediaRecorder API to capture the video
 * element's stream while it plays, then downloads the result as .webm.
 * Quality is equivalent to screen recording — fast and no server needed.
 */
"use client";

import { useRef, useState } from "react";
import { Player, PlayerRef } from "@remotion/player";
import { ReelComposition } from "./reel-composition";
import { Item } from "@/lib/types";
import {
  VIDEO_WIDTH,
  VIDEO_HEIGHT,
  VIDEO_FPS,
  calculateDuration,
} from "@/lib/video-config";
import { AudioTimingMapping } from "@/lib/audio-alignment";

interface VideoPreviewProps {
  items: Item[];
  roomType: string;
  budgetPhrase: string;
  roomImageUrl?: string;
  audioUrl?: string;
  timings?: AudioTimingMapping | null;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [recording, setRecording] = useState(false);
  const [recordDone, setRecordDone] = useState(false);

  if (items.length === 0) return null;

  let durationInFrames = calculateDuration(items.length);
  if (timings) {
    const totalSecs = timings.introSeconds + timings.itemSeconds.reduce((a, b) => a + b, 0) + timings.ctaSeconds;
    durationInFrames = Math.round(totalSecs * VIDEO_FPS);
  }
  
  const durationMs = (durationInFrames / VIDEO_FPS) * 1000;

  async function handleSaveVideo() {
    if (recording) return;
    setRecording(true);
    setRecordDone(false);

    try {
      const res = await fetch("/api/render-mp4", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          roomType,
          budgetPhrase,
          roomImageUrl,
          audioUrl,
          timings,
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Get filename from header or fallback
      let filename = `${roomType.toLowerCase().replace(/\s+/g, "-")}-hq.mp4`;
      const disposition = res.headers.get("Content-Disposition");
      if (disposition && disposition.indexOf("filename=") !== -1) {
        filename = disposition.split("filename=")[1].replace(/"/g, "");
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setRecordDone(true);
    } catch (err: any) {
      console.error(err);
      alert("Failed to render video on the server.");
    } finally {
      setRecording(false);
    }
  }


  return (
    <div className="space-y-3" ref={containerRef}>
      <div className="rounded-xl overflow-hidden border border-zinc-200 bg-black">
        <Player
          ref={playerRef}
          component={ReelComposition}
          inputProps={{ items, roomType, budgetPhrase, roomImageUrl, audioUrl, timings }}
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
            Rendering MP4 Server-Side (~20s)
          </>
        ) : recordDone ? (
          "✅ Saved Directly! Click to render again"
        ) : (
          "⬇ Render Direct HQ MP4"
        )}
      </button>
      {!recording && !recordDone && (
        <p className="text-[11px] text-zinc-400 text-center">
          Downloads a clean H.264 MP4 file directly from the backend.
        </p>
      )}
    </div>
  );
}

