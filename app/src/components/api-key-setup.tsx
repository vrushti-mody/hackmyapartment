/**
 * ApiKeySetup — Compact settings section.
 * Small gear trigger, expands to show key inputs.
 * Only ElevenLabs + Gemini now (no Together AI needed).
 */
"use client";

import { useState, useEffect } from "react";
import { AppSettings, loadSettings } from "@/components/settings-panel";
import { DEFAULT_ELEVENLABS_VOICE_ID } from "@/lib/voice";

const SETTINGS_KEY = "hackmyapartment_settings";

function saveToStorage(s: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

// Safe fallback premades just in case (Foundational extremely basic core voices)
const FALLBACK_VOICES = [
  { id: DEFAULT_ELEVENLABS_VOICE_ID, name: "Default VoiceLab ID" },
  { id: "9BWtsMINqrJLrRacOk9x", name: "Aria (Female, Calm)" },
  { id: "CwhCGdfEU4eev7gA42i0", name: "Roger (Male, Trustworthy)" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah (Female, Soft)" },
];

interface ApiKeySetupProps {
  onSettingsChange: (settings: AppSettings) => void;
}

export function ApiKeySetup({ onSettingsChange }: ApiKeySetupProps) {
  const [settings, setSettings] = useState<AppSettings>({
    elevenLabsApiKey: "",
    elevenLabsVoiceId: DEFAULT_ELEVENLABS_VOICE_ID,
    togetherApiKey: "",
    geminiApiKey: "",
  });
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Visibility toggles
  const [showElKey, setShowElKey] = useState(false);
  const [showGemKey, setShowGemKey] = useState(false);
  
  // Safe voices state
  const [safeVoices, setSafeVoices] = useState(FALLBACK_VOICES);

  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    onSettingsChange(loaded);
    setMounted(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Deprecated: UI Force-Snap logic was removed. Since users must uniquely generate and paste 
  // Custom VoiceLab ID strings, we can no longer actively sanitize their Voice ID against the 
  // 'premade' ElevenLabs array since Custom IDs natively do not exist inside that classification.

  if (!mounted) return null;

  function update(key: keyof AppSettings, value: string) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveToStorage(next);
    onSettingsChange(next);
  }

  const hasKeys = !!(settings.elevenLabsApiKey || settings.geminiApiKey);

  return (
    <>
      {/* Trigger — small inline button */}
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 transition"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Settings
        {hasKeys && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3 mt-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-700">API Keys</span>
            <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-600 text-sm">×</button>
          </div>

          <div className="grid gap-2.5">
            {/* ElevenLabs */}
            <div>
              <label className="text-[11px] font-medium text-zinc-500 mb-1 block">ElevenLabs (voiceover)</label>
              <div className="relative">
                <input
                  type={showElKey ? "text" : "password"}
                  value={settings.elevenLabsApiKey}
                  onChange={(e) => update("elevenLabsApiKey", e.target.value)}
                  placeholder="ElevenLabs API key…"
                  className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 pr-9 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition placeholder-zinc-400"
                />
                <button
                  type="button"
                  onClick={() => setShowElKey(!showElKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition p-0.5"
                >
                  {showElKey ? "🫣" : "👁️"}
                </button>
              </div>
            </div>

            {/* Voice ID */}
            <div>
              <label className="text-[11px] font-medium text-zinc-500 mb-1 block">Voice ID</label>
              <input
                type="text"
                value={settings.elevenLabsVoiceId}
                onChange={(e) => update("elevenLabsVoiceId", e.target.value)}
                placeholder="Paste VoiceLab ID..."
                className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition placeholder-zinc-400"
              />
            </div>

            {/* Gemini */}
            <div>
              <label className="text-[11px] font-medium text-zinc-500 mb-1 block">
                Gemini (AI tags) <span className="text-zinc-400 font-normal">optional</span>
              </label>
              <div className="relative">
                <input
                  type={showGemKey ? "text" : "password"}
                  value={settings.geminiApiKey}
                  onChange={(e) => update("geminiApiKey", e.target.value)}
                  placeholder="AIza… for ✨ AI Tags"
                  className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 pr-9 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition placeholder-zinc-400"
                />
                <button
                  type="button"
                  onClick={() => setShowGemKey(!showGemKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition p-0.5"
                >
                  {showGemKey ? "🫣" : "👁️"}
                </button>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-zinc-400">🔒 Saved locally in your browser only.</p>
        </div>
      )}
    </>
  );
}
