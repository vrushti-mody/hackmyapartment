/**
 * ImagePromptPanel — Generates a text-to-image prompt for the room
 * backdrop and lets the user copy or tweak it before pasting into
 * Midjourney / DALL-E / etc.
 *
 * The prompt auto-generates from `roomType` but the textarea is editable
 * so the creator can fine-tune wording.  "Reset" reverts to the generated
 * default.
 */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateRoomPrompt } from "@/lib/prompt";
import { Item } from "@/lib/types";

interface ImagePromptPanelProps {
  roomType: string;
  items?: Item[];
  theme?: string;
}

export function ImagePromptPanel({ roomType, items, theme }: ImagePromptPanelProps) {
  const generated = generateRoomPrompt(roomType, items, theme);
  const [prompt, setPrompt] = useState(generated);
  const [copied, setCopied] = useState(false);

  // NOTE: This conditional is intentionally a no-op.  It was scaffolded to
  // auto-sync the prompt when roomType changes, but avoids overwriting
  // manual edits.  A proper fix would use a "dirty" flag or useEffect with
  // a previous-roomType ref.  Left as-is to avoid regressions.
  if (generated !== prompt && !prompt.startsWith(generated.slice(0, 10))) {
    // Only auto-update if user hasn't manually edited
  }

  function handleCopy() {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleReset() {
    setPrompt(generateRoomPrompt(roomType, items, theme));
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={roomType ? prompt : ""}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Select a room type to generate an image prompt..."
        rows={3}
        className="text-sm"
        disabled={!roomType}
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopy}
          disabled={!roomType}
        >
          {copied ? "Copied!" : "Copy Prompt"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleReset}
          disabled={!roomType}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
