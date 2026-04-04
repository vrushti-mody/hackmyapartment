"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PasswordGate } from "@/components/password-gate";
import { getEpisodeById, updateEpisode } from "@/lib/store-service";
import { Episode, Item } from "@/lib/types";
import { transcodeGoogleDriveUrl } from "@/lib/utils";
import { LivePreview } from "@/components/live-preview";
import { loadSettings, AppSettings } from "@/components/settings-panel";

function EditDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get("id");

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Editable form state
  const [roomType, setRoomType] = useState("");
  const [theme, setTheme] = useState("");
  const [reelType, setReelType] = useState<"create" | "upgrade">("upgrade");
  const [items, setItems] = useState<Item[]>([]);
  const [roomImageUrl, setRoomImageUrl] = useState("");

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  useEffect(() => {
    if (!editId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const ep = await getEpisodeById(editId);
        if (ep) {
          setEpisode(ep);
          setRoomType(ep.roomType);
          setTheme(ep.theme || "");
          setReelType(ep.reelType || "upgrade");
          setItems(ep.items);
          setRoomImageUrl(ep.roomImageUrl || "");
        }
      } catch (e) {
        console.error("Failed to load episode:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [editId]);

  function updateItem(index: number, field: keyof Item, value: any) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!editId || !episode) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const rawTotal = items.reduce((s, i) => s + i.amount, 0);
      await updateEpisode(editId, {
        roomType,
        theme: reelType === "create" ? theme : undefined,
        reelType,
        items,
        rawTotal,
        roundedTotal: Math.ceil(rawTotal / 10) * 10,
        roomImageUrl: roomImageUrl || undefined,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-sm text-zinc-400 animate-pulse">Loading bundle…</div>
      </div>
    );
  }

  if (!editId || !episode) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center gap-3">
        <p className="text-zinc-500 font-semibold">Bundle not found</p>
        <a href="/admin" className="text-sm text-indigo-600 font-semibold hover:underline">
          ← Back to Admin
        </a>
      </div>
    );
  }

  const rawTotal = items.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-200">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/shop" className="text-sm font-semibold text-zinc-500 hover:text-zinc-800 transition hidden sm:block">Storefront</a>
            <a href="/generator" className="text-sm font-semibold text-zinc-500 hover:text-zinc-800 transition">Studio</a>
            <a href="/admin" className="text-sm font-semibold text-zinc-500 hover:text-zinc-800 transition">
              ← Admin
            </a>
            <span className="text-xs bg-amber-500 text-white px-2.5 py-1 rounded-lg font-semibold shadow-sm">
              Editing
            </span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-sm font-bold bg-zinc-900 text-white px-5 py-2 rounded-xl transition hover:bg-zinc-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "💾 Save Changes"}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-8 space-y-6">
        {/* Success banner */}
        {saveSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-sm px-4 py-3 rounded-xl text-center animate-in fade-in slide-in-from-top-2 duration-200">
            ✅ Changes saved successfully!
          </div>
        )}

        {/* Bundle info */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-bold text-lg text-zinc-800">Bundle Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1">Room Type</label>
              <input
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1">Reel Type</label>
              <select
                value={reelType}
                onChange={(e) => setReelType(e.target.value as "create" | "upgrade")}
                className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
              >
                <option value="upgrade">Upgrade</option>
                <option value="create">Create</option>
              </select>
            </div>
          </div>

          {reelType === "create" && (
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1">Theme</label>
              <input
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g. cozy zen, modern minimalist"
                className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide block mb-1">Room Image URL</label>
            <input
              value={roomImageUrl}
              onChange={(e) => setRoomImageUrl(transcodeGoogleDriveUrl(e.target.value))}
              placeholder="Google Drive or direct URL"
              className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3 text-center pt-2">
            <div className="bg-zinc-50 rounded-xl py-2">
              <div className="text-lg font-bold text-zinc-800">{items.length}</div>
              <div className="text-[10px] text-zinc-400 font-medium uppercase">Items</div>
            </div>
            <div className="bg-zinc-50 rounded-xl py-2">
              <div className="text-lg font-bold text-zinc-800">${rawTotal.toFixed(2)}</div>
              <div className="text-[10px] text-zinc-400 font-medium uppercase">Total</div>
            </div>
            <div className="bg-zinc-50 rounded-xl py-2">
              <div className="text-lg font-bold text-zinc-800">{episode.id.slice(0, 8)}</div>
              <div className="text-[10px] text-zinc-400 font-medium uppercase">ID</div>
            </div>
          </div>
        </div>

        {/* Reel Generator Preview */}
        {settings && items.length > 0 && !!roomType && (
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="font-bold text-lg text-zinc-800 flex items-center justify-between">
               Generate Reel
               <span className="text-xs font-semibold bg-violet-100 text-violet-700 px-2 py-1 rounded-full">Live Built-in</span>
            </h2>
            <div className="border border-zinc-100 bg-zinc-50/50 rounded-xl overflow-hidden mt-2 p-1">
              <LivePreview
                items={items}
                roomType={roomType}
                theme={theme}
                reelType={reelType}
                settings={settings}
                roomImageUrl={roomImageUrl}
              />
            </div>
          </div>
        )}

        {/* Items */}
        <div className="space-y-3">
          <h2 className="font-bold text-lg text-zinc-800">Products ({items.length})</h2>

          {items.map((item, idx) => (
            <div key={item.id} className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide block mb-0.5">Title</label>
                    <input
                      value={item.title}
                      onChange={(e) => updateItem(idx, "title", e.target.value)}
                      className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide block mb-0.5">Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.amount}
                        onChange={(e) => updateItem(idx, "amount", parseFloat(e.target.value) || 0)}
                        className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide block mb-0.5">Affiliate Link</label>
                      <input
                        value={item.affiliateLink}
                        onChange={(e) => updateItem(idx, "affiliateLink", e.target.value)}
                        className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide block mb-0.5">Description</label>
                    <textarea
                      value={item.description}
                      onChange={(e) => updateItem(idx, "description", e.target.value)}
                      rows={2}
                      className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide block mb-0.5">Image URL</label>
                    <input
                      value={item.imageUrl}
                      onChange={(e) => updateItem(idx, "imageUrl", transcodeGoogleDriveUrl(e.target.value))}
                      className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeItem(idx)}
                  className="text-red-400 hover:text-red-600 text-lg transition mt-1 shrink-0"
                  title="Remove item"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-zinc-900 hover:bg-zinc-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-base transition"
        >
          {saving ? "Saving…" : "💾 Save Changes"}
        </button>
      </main>
    </div>
  );
}

export default function EditPage() {
  return (
    <PasswordGate>
      <Suspense fallback={<div className="min-h-screen bg-zinc-50 flex items-center justify-center"><div className="text-sm text-zinc-400 animate-pulse">Loading…</div></div>}>
        <EditDashboard />
      </Suspense>
    </PasswordGate>
  );
}
