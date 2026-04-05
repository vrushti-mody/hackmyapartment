/**
 * LivePreview — Results panel for the generator.
 *
 * Layout:
 *  1. Stats bar (items · total · budget hook)
 *  2. Prompts slider — tab card that flips between:
 *       • Voiceover Prompt  → copy → paste into ChatGPT/Claude → paste script back below
 *       • Image Prompt      → copy → paste into DALL·E / Midjourney / Gemini
 *  3. Script textarea — editable, starts with template default;
 *     paste the ChatGPT-refined version back here to compile.
 *  4. Caption toggle
 *  5. Compile Reel button + Video Preview
 */
"use client";

import { useState, useRef } from "react";
import { Item } from "@/lib/types";
import { AppSettings } from "@/components/settings-panel";
import { getRoundedTotal, getBudgetPhrase } from "@/lib/budget";
import { generateScript, estimateScriptSeconds } from "@/lib/script";
import { generateCaption, generateHashtags } from "@/lib/caption";
import { generateLinksExport, downloadTextFile, downloadBlob } from "@/lib/export";
import { generateAudioWithTimestamps, generateAudio } from "@/lib/elevenlabs";
import { generateRoomPrompt, generateVoiceoverPrompt } from "@/lib/prompt";
import { VideoPreview } from "@/components/video/video-preview";
import { calculateSegmentTimings, AudioTimingMapping } from "@/lib/audio-alignment";

type StepStatus = "idle" | "running" | "done" | "error";
type PromptTab = "voiceover" | "image";

interface ElevenLabsVoiceResponse {
  voices?: Array<{
    voice_id: string;
    name: string;
    category?: string;
  }>;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Failed to generate audio";
}

interface LivePreviewProps {
  items: Item[];
  roomType: string;
  settings: AppSettings;
  roomImageUrl?: string;
  reelType: "upgrade" | "create";
  theme: string;
}

export function LivePreview({
  items,
  roomType,
  settings,
  roomImageUrl,
  reelType,
  theme,
}: LivePreviewProps) {
  const [showCaption, setShowCaption] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [userScript, setUserScript] = useState("");
  const [promptTab, setPromptTab] = useState<PromptTab>("voiceover");
  const [audioTimings, setAudioTimings] = useState<AudioTimingMapping | null>(null);
  const [audioStatus, setAudioStatus] = useState<StepStatus>("idle");
  const [audioUrl, setAudioUrl] = useState<string | undefined>();
  const [audioError, setAudioError] = useState<string | undefined>();
  const audioBlobRef = useRef<Blob | null>(null);

  const rawTotal = items.reduce((s, i) => s + i.amount, 0);
  const roundedTotal = getRoundedTotal(rawTotal);
  const budgetPhrase = getBudgetPhrase(rawTotal);

  const defaultScript = generateScript(items, roomType, roundedTotal, reelType, theme);
  const script = userScript || defaultScript;

  const voiceoverPrompt = generateVoiceoverPrompt(roomType, items, roundedTotal, reelType, theme);
  const imagePrompt = generateRoomPrompt(roomType, items, theme);

  const caption = generateCaption(items, roomType, roundedTotal);
  const hashtags = generateHashtags(roomType);
  const estSecs = estimateScriptSeconds(script);
  const fullCaption = caption ? `${caption}\n\n${hashtags.join(" ")}` : "";
  const canGenerate = !!roomType && items.length > 0;

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  }

  async function handleCompileReel() {
    if (!canGenerate || !settings.elevenLabsApiKey || !script) return;
    setAudioStatus("running");
    setAudioError(undefined);
    try {
      const execGeneration = async (vId: string) => {
        const data = await generateAudioWithTimestamps(script, settings.elevenLabsApiKey, vId);
        const binaryString = atob(data.audio_base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        // Revoke the old blob URL if one exists to prevent memory leaks
        if (audioUrl && audioUrl.startsWith("blob:")) {
          URL.revokeObjectURL(audioUrl);
        }
        
        audioBlobRef.current = new Blob([bytes], { type: "audio/mpeg" });
        setAudioUrl(URL.createObjectURL(audioBlobRef.current));
        setAudioTimings(calculateSegmentTimings(data.alignment, items.length));
        setAudioStatus("done");
      };

      try {
        await execGeneration(settings.elevenLabsVoiceId);
      } catch (err) {
        const errorMessage = getErrorMessage(err);

        if (errorMessage.includes("402")) {
          console.warn("402 Advanced API Error. Auto-downgrading to Standard Basic Audio API!");

          let debugVoicesCount = 0;
          let debugSafeId = settings.elevenLabsVoiceId;

          try {
            const apiRes = await fetch("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": settings.elevenLabsApiKey } });
            const schema = (await apiRes.json()) as ElevenLabsVoiceResponse;
            debugVoicesCount = schema?.voices?.length || 0;
            const safeId = settings.elevenLabsVoiceId;
            debugSafeId = safeId;

            const basicBlob = await generateAudio(script, settings.elevenLabsApiKey, safeId);
            
            // Revoke the old blob URL if one exists
            if (audioUrl && audioUrl.startsWith("blob:")) {
              URL.revokeObjectURL(audioUrl);
            }

            audioBlobRef.current = basicBlob;
            setAudioUrl(URL.createObjectURL(basicBlob));
            
            // Fakes the alignment mapping mathematically since standard TTS has no timestamp data
            setAudioTimings(calculateSegmentTimings(null, items.length));
            setAudioStatus("done");
          } catch (fallbackErr) {
            throw new Error(`Critical API Block: Standard Audio endpoint also failed. Tried Voice ID: ${debugSafeId}. Debug Voices Length: ${debugVoicesCount}. ElevenLabs Error: ${getErrorMessage(fallbackErr)}`);
          }
        } else {
          throw err;
        }
      }
    } catch (err) {
      setAudioError(getErrorMessage(err));
      setAudioStatus("error");
    }
  }



  if (!canGenerate) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-6 space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center text-3xl">🎬</div>
        <p className="font-semibold text-zinc-700">Ready to build</p>
        <p className="text-sm text-zinc-400 max-w-xs">
          Select a room type and add products to start generating content.
        </p>
      </div>
    );
  }

  const activePrompt = promptTab === "voiceover" ? voiceoverPrompt : imagePrompt;
  const activePromptKey = promptTab === "voiceover" ? "vp" : "ip";

  return (
    <div className="space-y-5">

      {/* ── STATS ── */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-white border border-zinc-200 rounded-2xl py-3 px-2 shadow-sm">
          <div className="text-2xl font-bold text-zinc-800">{items.length}</div>
          <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide mt-0.5">Items</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl py-3 px-2 shadow-sm">
          <div className="text-2xl font-bold text-zinc-800">${rawTotal.toFixed(0)}</div>
          <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide mt-0.5">Total</div>
        </div>
        <div className="bg-zinc-100 border border-zinc-200 rounded-2xl py-3 px-2 shadow-sm">
          <div className="text-lg font-extrabold text-zinc-800 leading-tight">{budgetPhrase || "—"}</div>
          <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide mt-0.5">Hook</div>
        </div>
      </div>

      {/* ── PROMPTS SLIDER ── */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Tab pills */}
        <div className="flex border-b border-zinc-100">
          <button
            onClick={() => setPromptTab("voiceover")}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${promptTab === "voiceover"
              ? "bg-zinc-900 text-white"
              : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
              }`}
          >
            🎙 Voiceover Prompt
          </button>
          <button
            onClick={() => setPromptTab("image")}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${promptTab === "image"
              ? "bg-zinc-900 text-white"
              : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
              }`}
          >
            🖼 Image Prompt
          </button>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-[10px] text-zinc-400 leading-relaxed">
            {promptTab === "voiceover"
              ? "1️⃣ Copy  →  2️⃣ Paste into ChatGPT or Claude  →  3️⃣ Paste the result into the Script below"
              : "Copy  →  Paste into DALL·E, Midjourney, or Gemini Imagen to generate your room backdrop"}
          </p>
          <textarea
            key={promptTab}
            readOnly
            value={activePrompt}
            rows={promptTab === "voiceover" ? 8 : 4}
            className="w-full text-sm text-zinc-700 p-3 border border-zinc-100 rounded-xl bg-zinc-50 leading-relaxed resize-none cursor-text"
            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
          />
          <button
            onClick={() => copy(activePrompt, activePromptKey)}
            className="w-full text-sm font-bold py-2.5 rounded-xl bg-zinc-900 text-white hover:bg-zinc-700 transition"
          >
            {copiedKey === activePromptKey ? "✓ Copied!" : "Copy Prompt"}
          </button>
        </div>
      </div>

      {/* ── SCRIPT (editable) ── */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">🎬 Script</span>
          <div className="flex items-center gap-3">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${estSecs > 60 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
              ~{estSecs}s
            </span>
            <button onClick={() => copy(script, "script")} className="text-xs font-semibold text-zinc-600 hover:underline">
              {copiedKey === "script" ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
        <textarea
          value={script}
          onChange={(e) => setUserScript(e.target.value)}
          placeholder="Default script pre-filled. Paste your ChatGPT-refined script here to use it for the reel instead."
          className="w-full min-h-[150px] text-sm text-zinc-700 p-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:outline-none transition leading-relaxed resize-y bg-zinc-50"
        />
        <div className="flex justify-between items-center">
          <p className="text-[10px] text-zinc-400">Double newlines = segment breaks for audio sync</p>
          {userScript && (
            <button onClick={() => setUserScript("")} className="text-[10px] text-zinc-400 hover:text-zinc-700 transition">
              Reset to default
            </button>
          )}
        </div>
      </div>

      {/* ── CAPTION ── */}
      <button
        onClick={() => setShowCaption(!showCaption)}
        className="w-full bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 font-semibold text-zinc-700 py-3 rounded-xl text-sm transition"
      >
        {showCaption ? "Hide Caption" : "💬 Generate Reel Caption"}
      </button>

      {showCaption && fullCaption && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Caption & Hashtags</span>
            <button onClick={() => copy(fullCaption, "caption")} className="text-xs font-semibold text-zinc-600 hover:underline">
              {copiedKey === "caption" ? "Copied!" : "Copy all"}
            </button>
          </div>
          <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line">{fullCaption}</p>
        </div>
      )}

      {/* ── COMPILE ── */}
      <button
        onClick={handleCompileReel}
        disabled={!settings.elevenLabsApiKey || audioStatus === "running"}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2"
      >
        {audioStatus === "running" ? "🎙 Generating Voiceover..." : "🎬 Create Reel Video"}
      </button>

      {!settings.elevenLabsApiKey && (
        <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg text-center">
          ⚠ Add ElevenLabs key above to create reel.
        </p>
      )}
      {audioError && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{audioError}</p>
      )}

      {/* ── VIDEO PREVIEW ── */}
      {audioUrl && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Reel Preview</span>
              <span className="text-[11px] text-zinc-400">9:16 · ≤60s</span>
            </div>
            <div className="p-3 bg-zinc-50">
              <VideoPreview
                items={items}
                roomType={roomType}
                budgetPhrase={budgetPhrase}
                roomImageUrl={roomImageUrl}
                audioUrl={audioUrl}
                timings={audioTimings}
                theme={theme}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { const c = generateLinksExport(items, roomType); downloadTextFile(c, `${roomType.toLowerCase().replace(/\s+/g, "-")}-links.txt`); }}
              className="flex-1 text-sm font-semibold border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 py-3 rounded-xl transition"
            >
              Links (.txt)
            </button>
            <button
              onClick={() => audioBlobRef.current && downloadBlob(audioBlobRef.current, "voiceover.mp3")}
              className="flex-1 text-sm font-semibold border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 py-3 rounded-xl transition"
            >
              MP3 Audio
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
