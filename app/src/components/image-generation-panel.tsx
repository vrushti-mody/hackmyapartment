/**
 * ImageGenerationPanel — Generates an AI room image using Google Gemini Imagen
 * via the /api/generate-image server route.
 *
 * Shows the editable prompt (auto-generated from roomType) and a "Generate Image"
 * button.  On success, displays the generated image and calls onImageGenerated
 * so LivePreview can pass the URL to the Remotion reel player.
 */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateRoomPrompt } from "@/lib/prompt";
import { Item } from "@/lib/types";

interface ImageGenerationPanelProps {
  roomType: string;
  items?: Item[];
  theme?: string;
  geminiApiKey: string;
  onImageGenerated?: (url: string) => void;
}

export function ImageGenerationPanel({
  roomType,
  items,
  theme,
  geminiApiKey,
  onImageGenerated,
}: ImageGenerationPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (roomType) {
      setPrompt(generateRoomPrompt(roomType, items, theme));
      setImageUrl(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomType, items, theme]);

  async function handleGenerate() {
    if (!prompt || !geminiApiKey) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, apiKey: geminiApiKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Image generation failed");
      setImageUrl(data.imageUrl);
      onImageGenerated?.(data.imageUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Image generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Textarea
        value={roomType ? prompt : ""}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Select a room type to auto-generate a prompt…"
        rows={3}
        className="text-sm"
        disabled={!roomType}
      />

      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          onClick={handleGenerate}
          disabled={loading || !roomType || !geminiApiKey}
        >
          {loading ? "Generating…" : "Generate Image"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setPrompt(generateRoomPrompt(roomType, items, theme))}
          disabled={!roomType}
        >
          Reset Prompt
        </Button>
      </div>

      {!geminiApiKey && (
        <p className="text-xs text-muted-foreground">
          Add your Gemini API key in Settings to enable image generation.
        </p>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {imageUrl && (
        <div className="rounded-lg overflow-hidden border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={`AI-generated ${roomType} image`}
            className="w-full object-cover"
            style={{ maxHeight: 280 }}
          />
        </div>
      )}
    </div>
  );
}
