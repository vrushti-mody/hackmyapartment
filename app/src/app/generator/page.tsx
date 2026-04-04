/**
 * Generator Page (/generator) — Mobile-first, password-gated creator studio.
 *
 * Layout:
 *   - Mobile: single vertical column (form → generate → results)
 *   - Desktop (lg:): two-column grid (form | preview)
 *
 * API keys are always accessible via the inline <ApiKeySetup> panel at top.
 */
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { Item } from "@/lib/types";
import { getRoundedTotal, getBudgetPhrase } from "@/lib/budget";
import { saveDraft, loadDraft, clearDraft } from "@/lib/storage";
import { ProductForm } from "@/components/product-form";
import { LivePreview } from "@/components/live-preview";
import { ApiKeySetup } from "@/components/api-key-setup";
import { PasswordGate } from "@/components/password-gate";
import { AppSettings } from "@/components/settings-panel";
import { transcodeGoogleDriveUrl } from "@/lib/utils";
import { DEFAULT_ELEVENLABS_VOICE_ID } from "@/lib/voice";

const ROOM_TYPES = ["Kitchen", "Bedroom", "Living Room", "Bathroom", "Office", "Outdoor"];

function GeneratorDashboard() {
  const [reelType, setReelType] = useState<"create" | "upgrade">("upgrade");
  const [theme, setTheme] = useState("");
  const [roomType, setRoomType] = useState("");
  const [customRoom, setCustomRoom] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    elevenLabsApiKey: "",
    elevenLabsVoiceId: DEFAULT_ELEVENLABS_VOICE_ID,
    togetherApiKey: "",
    geminiApiKey: "",
  });
  const [roomImageUrl, setRoomImageUrl] = useState<string>("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [previewResetKey, setPreviewResetKey] = useState(0);

  const effectiveRoom = showCustom ? customRoom : roomType;
  const hasStudioContent =
    reelType !== "upgrade" ||
    !!theme.trim() ||
    !!effectiveRoom.trim() ||
    items.length > 0 ||
    !!roomImageUrl.trim();

  // Hydrate from localStorage draft
  useEffect(() => {
    const draft = loadDraft();
    if (draft?.roomType) {
      if (ROOM_TYPES.includes(draft.roomType)) {
        setRoomType(draft.roomType);
      } else {
        setShowCustom(true);
        setCustomRoom(draft.roomType);
      }
    }
    if (draft?.items) setItems(draft.items);
    setLoaded(true);
  }, []);

  const autosave = useCallback(() => {
    if (!loaded) return;
    if (!effectiveRoom.trim() && items.length === 0) {
      clearDraft();
      return;
    }
    saveDraft({ roomType: effectiveRoom, items });
  }, [effectiveRoom, items, loaded]);

  useEffect(() => { autosave(); }, [autosave]);

  function selectRoom(room: string) {
    if (room === "_custom") {
      setShowCustom(true);
      setRoomType("");
    } else {
      setShowCustom(false);
      setCustomRoom("");
      setRoomType(room);
    }
  }

  function resetStudio() {
    if (!hasStudioContent) return;
    if (!confirm("Clear all current Creator Studio contents and start a new bundle?")) return;

    setReelType("upgrade");
    setTheme("");
    setRoomType("");
    setCustomRoom("");
    setShowCustom(false);
    setItems([]);
    setRoomImageUrl("");
    setPublishSuccess(false);
    clearDraft();
    setPreviewResetKey((prev) => prev + 1);
  }

  async function publishToStorefront() {
    if (!effectiveRoom || items.length === 0) return;
    setIsPublishing(true);
    setPublishSuccess(false);

    try {
      const rawTotal = items.reduce((s, i) => s + i.amount, 0);
      const roundedTotal = getRoundedTotal(rawTotal);

      const payload = {
        id: crypto.randomUUID(),
        reelType,
        theme: reelType === "create" ? theme : undefined,
        roomType: effectiveRoom,
        items,
        rawTotal,
        roundedTotal,
        budgetPhrase: getBudgetPhrase(rawTotal),
        roomImageUrl: roomImageUrl || undefined,
      };

      const res = await fetch("/api/store/episodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to publish");

      setPublishSuccess(true);
      setTimeout(() => setPublishSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      alert("Error publishing bundle.");
    } finally {
      setIsPublishing(false);
    }
  }

  if (!loaded) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-sm text-zinc-400 animate-pulse">Loading Creator Studio…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/shop" className="font-bold text-lg tracking-tight">
            HackMyApartment
          </a>
          <div className="flex items-center gap-4">
            <a href="/shop" className="text-sm font-semibold text-zinc-500 hover:text-zinc-800 transition hidden sm:block">Storefront</a>
            <a href="/admin" className="text-sm font-semibold text-zinc-500 hover:text-zinc-800 transition">Admin</a>
            <span className="text-xs bg-zinc-900 text-white px-2.5 py-1 rounded-lg font-semibold shadow-sm">
              Creator Studio
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-5 items-start">

          {/* ══ LEFT: Form Column ══ */}
          <div className="space-y-4">

            {/* API Keys — always visible */}
            <ApiKeySetup onSettingsChange={setSettings} />

            {/* Reel Type */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-3">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Reel Type
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setReelType("upgrade")}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${reelType === "upgrade"
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-zinc-400"
                    }`}
                >
                  Upgrade
                </button>
                <button
                  onClick={() => setReelType("create")}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${reelType === "create"
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-zinc-400"
                    }`}
                >
                  Create
                </button>
              </div>
              {reelType === "create" && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                  <input
                    placeholder="Theme (e.g. beige and wood)"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="w-full text-sm border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition"
                  />
                </div>
              )}
            </div>

            {/* Room Type */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-3">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Room Type
              </label>
              <div className="flex flex-wrap gap-2">
                {ROOM_TYPES.map((room) => (
                  <button
                    key={room}
                    onClick={() => selectRoom(room)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${effectiveRoom === room && !showCustom
                      ? "bg-zinc-900 text-white border-zinc-900"
                      : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-zinc-400"
                      }`}
                  >
                    {room}
                  </button>
                ))}
                <button
                  onClick={() => selectRoom("_custom")}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${showCustom
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-zinc-400"
                    }`}
                >
                  Other…
                </button>
              </div>
              {showCustom && (
                <input
                  autoFocus
                  placeholder="e.g. Home Office, Nursery…"
                  value={customRoom}
                  onChange={(e) => setCustomRoom(e.target.value)}
                  className="w-full text-sm border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition"
                />
              )}
            </div>

            {/* Products */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
              <ProductForm
                items={items}
                onChange={setItems}
                geminiApiKey={settings.geminiApiKey}
                roomType={effectiveRoom}
              />
            </div>

            {/* Custom AI Image URL */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-3">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Custom AI Image URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/file/d/…"
                value={roomImageUrl || ""}
                onChange={(e) => setRoomImageUrl(e.target.value)}
                onBlur={(e) => setRoomImageUrl(transcodeGoogleDriveUrl(e.target.value))}
                className="w-full text-sm border border-zinc-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition"
              />
              <p className="text-[11px] text-zinc-500">
                Will be used in the Reel video and as the storefront cover. Leave blank to fallback to a beautiful gradient!
              </p>
            </div>

            {/* Live Preview — shown on mobile below the form, before the desktop right column */}
            <div className="lg:hidden">
              <LivePreview
                key={`mobile-${previewResetKey}`}
                items={items}
                roomType={effectiveRoom}
                settings={settings}
                roomImageUrl={roomImageUrl}
                reelType={reelType}
                theme={theme}
              />
            </div>

            {/* Publish to Storefront */}
            {publishSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-sm px-4 py-3 rounded-xl text-center animate-in fade-in slide-in-from-top-2 duration-200">
                ✅ Successfully published to storefront!
              </div>
            )}
            <button
              onClick={publishToStorefront}
              disabled={!effectiveRoom || items.length === 0 || isPublishing}
              className="w-full bg-zinc-900 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl text-sm transition"
            >
              {isPublishing ? "Publishing..." : "🌎 Publish to Storefront"}
            </button>
            <button
              onClick={resetStudio}
              disabled={!hasStudioContent || isPublishing}
              className="w-full bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-700 font-semibold py-3 rounded-2xl text-sm transition border border-zinc-200"
            >
              Empty All + Start New
            </button>
          </div>

          {/* ══ RIGHT: Live Preview (desktop only) ══ */}
          <div className="hidden lg:block sticky top-20">
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm max-h-[calc(100vh-6rem)] overflow-y-auto">
              <div className="mb-4">
                <h2 className="font-bold text-zinc-800">Preview & Generate</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Fills in real-time as you type</p>
              </div>
              <LivePreview
                key={`desktop-${previewResetKey}`}
                items={items}
                roomType={effectiveRoom}
                settings={settings}
                roomImageUrl={roomImageUrl}
                reelType={reelType}
                theme={theme}
              />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default function GeneratorPage() {
  return (
    <PasswordGate>
      <Suspense fallback={<div className="p-8 text-center text-zinc-400">Loading UI bindings...</div>}>
        <GeneratorDashboard />
      </Suspense>
    </PasswordGate>
  );
}
