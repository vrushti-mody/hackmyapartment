/**
 * SettingsPanel — Modal for persisting API credentials in localStorage.
 */
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DEFAULT_ELEVENLABS_VOICE_ID } from "@/lib/voice";

const SETTINGS_KEY = "hackmyapartment_settings";

export interface AppSettings {
  elevenLabsApiKey: string;
  elevenLabsVoiceId: string;
  togetherApiKey: string;
  geminiApiKey: string;
}

const DEFAULTS: AppSettings = {
  elevenLabsApiKey: "",
  elevenLabsVoiceId: DEFAULT_ELEVENLABS_VOICE_ID,
  togetherApiKey: "",
  geminiApiKey: "",
};

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULTS;
  const data = localStorage.getItem(SETTINGS_KEY);
  if (!data) return DEFAULTS;

  const parsed = JSON.parse(data);
  // Force-migrate absolutely ALL ancient legacy Voice IDs or global defaults to the Personal Whitelisted VoiceLab ID
  const forbiddenLegacyIDs = [
    "MEruxS3crYdFDiIwpMmP",
    "pNInz6obpgDQGcFmaJgB", // Adam
    "21m00Tcm4TlvDq8ikWAM", // Rachel
    "Xb7hH8MSALEjdAapzH3W", // Alice
    "9BWtsMINqrJLrRacOk9x", // Aria
    "2EiwWnXFnvU5JabPnv8n", // Clyde (The culprit behind the persistent ghost lock)
    "AZnzlk1XvdvUeBnXmlld", // Domi
    "EXAVITQu4vr4xnSDxMaL", // Bella
    "pqHfZKP75CvOlQylNhV4", // Bill
    "nPczCjzI2devNBz1zQzb", // Brian
    "IKne3meq5aSn9XLyUdCD", // Charlie
    "CwhCGdfEU4eev7gA42i0", // Roger
    "FGY2WhTYpPnrIDTdsK5H"  // Laura
  ];
  
  if (forbiddenLegacyIDs.includes(parsed.elevenLabsVoiceId)) {
    parsed.elevenLabsVoiceId = DEFAULT_ELEVENLABS_VOICE_ID;
  }

  return { ...DEFAULTS, ...parsed };
}

function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  onSave: (settings: AppSettings) => void;
}

export function SettingsPanel({ open, onClose, onSave }: SettingsPanelProps) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);

  useEffect(() => {
    setSettings(loadSettings());
  }, [open]);

  function handleSave() {
    saveSettings(settings);
    onSave(settings);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md p-6 space-y-5">
        <h2 className="text-lg font-semibold">API Settings</h2>

        {/* Together AI */}
        <div className="space-y-1.5">
          <Label htmlFor="together-key" className="text-sm font-medium">
            Together AI API Key{" "}
            <span className="text-xs font-normal text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              FREE — Flux Schnell
            </span>
          </Label>
          <Input
            id="together-key"
            type="password"
            placeholder="your-together-key..."
            value={settings.togetherApiKey}
            onChange={(e) =>
              setSettings({ ...settings, togetherApiKey: e.target.value })
            }
          />
          <p className="text-xs text-muted-foreground">
            For AI room image generation. Free at{" "}
            <a
              href="https://api.together.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              api.together.xyz
            </a>{" "}
            — 6 req/min limit.
          </p>
        </div>

        {/* ElevenLabs */}
        <div className="space-y-1.5 border-t pt-4">
          <Label htmlFor="elevenlabs-key" className="text-sm font-medium">
            ElevenLabs API Key{" "}
            <span className="text-xs text-muted-foreground font-normal">
              (voiceover)
            </span>
          </Label>
          <Input
            id="elevenlabs-key"
            type="password"
            placeholder="Enter your API key..."
            value={settings.elevenLabsApiKey}
            onChange={(e) =>
              setSettings({ ...settings, elevenLabsApiKey: e.target.value })
            }
          />
          <Input
            id="voice-id"
            placeholder="Voice ID (default: Rachel)"
            value={settings.elevenLabsVoiceId}
            onChange={(e) =>
              setSettings({ ...settings, elevenLabsVoiceId: e.target.value })
            }
            className="mt-1.5"
          />
          <p className="text-xs text-muted-foreground">
            Free tier: 10,000 chars/month at{" "}
            <a
              href="https://elevenlabs.io"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              elevenlabs.io
            </a>
          </p>
        </div>

        {/* Gemini (for AI tags) */}
        <div className="space-y-1.5 border-t pt-4">
          <Label htmlFor="gemini-key" className="text-sm font-medium">
            Gemini API Key{" "}
            <span className="text-xs text-muted-foreground font-normal">
              (AI tags only — optional)
            </span>
          </Label>
          <Input
            id="gemini-key"
            type="password"
            placeholder="AIza..."
            value={settings.geminiApiKey}
            onChange={(e) =>
              setSettings({ ...settings, geminiApiKey: e.target.value })
            }
          />
          <p className="text-xs text-muted-foreground">
            Only needed for ✨ AI Tags feature. Free at{" "}
            <a
              href="https://aistudio.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              aistudio.google.com
            </a>
          </p>
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </Card>
    </div>
  );
}
