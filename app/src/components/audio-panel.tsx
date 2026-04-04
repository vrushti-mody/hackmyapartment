/**
 * AudioPanel — Generate and preview a voiceover MP3 via the ElevenLabs
 * text-to-speech API.
 *
 * `onAudioGenerated` is called with the blob object URL when audio succeeds,
 * so LivePreview can feed it into the Remotion reel player.
 */
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { generateAudio } from "@/lib/elevenlabs";
import { downloadBlob } from "@/lib/export";

interface AudioPanelProps {
  script: string;
  apiKey: string;
  voiceId: string;
  onAudioGenerated?: (url: string) => void;
}

export function AudioPanel({
  script,
  apiKey,
  voiceId,
  onAudioGenerated,
}: AudioPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const blobRef = useRef<Blob | null>(null);

  async function handleGenerate() {
    if (!script || !apiKey) return;
    setLoading(true);
    setError("");
    try {
      const blob = await generateAudio(script, apiKey, voiceId);
      blobRef.current = blob;
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      onAudioGenerated?.(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Audio generation failed");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (blobRef.current) {
      downloadBlob(blobRef.current, "voiceover.mp3");
    }
  }

  return (
    <div className="space-y-2">
      <Button
        size="sm"
        variant="outline"
        onClick={handleGenerate}
        disabled={loading || !script || !apiKey}
      >
        {loading ? "Generating..." : "Generate Voiceover"}
      </Button>

      {!apiKey && (
        <p className="text-xs text-muted-foreground">
          Set your ElevenLabs API key in Settings to enable audio.
        </p>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {audioUrl && (
        <div className="space-y-2">
          <audio ref={audioRef} controls src={audioUrl} className="w-full" />
          <Button size="sm" variant="outline" onClick={handleDownload}>
            Download MP3
          </Button>
        </div>
      )}
    </div>
  );
}
