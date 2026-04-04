/**
 * ProductForm — Mobile-first product input cards with AI tag generation.
 */
"use client";

import { useState } from "react";
import { Item } from "@/lib/types";
import { transcodeGoogleDriveUrl } from "@/lib/utils";

interface ProductFormProps {
  items: Item[];
  onChange: (items: Item[]) => void;
  geminiApiKey: string;
  roomType: string;
}

function newItem(): Item {
  return {
    id: crypto.randomUUID(),
    title: "",
    description: "",
    amount: 0,
    imageUrl: "",
    affiliateLink: "",
    tags: [],
  };
}

export function ProductForm({ items, onChange, geminiApiKey, roomType }: ProductFormProps) {
  const [tagLoading, setTagLoading] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function addItem() {
    const item = newItem();
    onChange([...items, item]);
    setExpanded((prev) => ({ ...prev, [item.id]: true }));
  }

  function removeItem(id: string) {
    onChange(items.filter((i) => i.id !== id));
  }

  function update(id: string, field: keyof Item, value: string | number | string[]) {
    onChange(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  }

  function removeTag(itemId: string, tag: string) {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    update(itemId, "tags", item.tags.filter((t) => t !== tag));
  }

  function addTagsFromString(itemId: string, raw: string) {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    const newTags = raw
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t && !item.tags.includes(t));
    if (newTags.length) update(itemId, "tags", [...item.tags, ...newTags]);
  }

  async function generateTags(item: Item) {
    if (!geminiApiKey || !item.title) return;
    setTagLoading((prev) => ({ ...prev, [item.id]: true }));
    try {
      const res = await fetch("/api/generate-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          description: item.description,
          roomType,
          apiKey: geminiApiKey,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("Google Gemini Rate Limit Exceeded (15 requests per minute). Please wait 60 seconds and try again!");
        }
        throw new Error(data.error || "Failed to generate tags");
      }
      if (data.tags) update(item.id, "tags", data.tags);
    } catch (err: any) {
      alert(err.message || "AI tag generation failed.");
    } finally {
      setTagLoading((prev) => ({ ...prev, [item.id]: false }));
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
          Products <span className="text-zinc-400 font-normal">({items.length})</span>
        </span>
        <button
          onClick={addItem}
          className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition flex items-center gap-1"
        >
          <span className="text-lg leading-none">+</span> Add Product
        </button>
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 text-sm text-zinc-400 border-2 border-dashed border-zinc-200 rounded-xl">
          No products yet — tap <strong>+ Add Product</strong> to start
        </div>
      )}

      {items.map((item, index) => {
        const isExpanded = expanded[item.id] !== false; // default open

        return (
          <div key={item.id} className="border border-zinc-200 rounded-xl overflow-hidden">
            {/* Card Header */}
            <div
              className="flex items-center justify-between px-4 py-3 bg-zinc-50 cursor-pointer"
              onClick={() => setExpanded((prev) => ({ ...prev, [item.id]: !isExpanded }))}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-zinc-400 shrink-0">#{index + 1}</span>
                <span className="text-sm font-semibold text-zinc-700 truncate">
                  {item.title || "Untitled product"}
                </span>
                {item.amount > 0 && (
                  <span className="text-xs font-bold text-zinc-600 shrink-0">
                    ${item.amount.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                  className="text-zinc-300 hover:text-red-400 text-xl leading-none transition"
                >
                  ×
                </button>
                <svg
                  className={`w-4 h-4 text-zinc-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Card Body */}
            {isExpanded && (
              <div className="px-4 py-4 space-y-3 bg-white">
                <div className="grid grid-cols-[1fr_90px] gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-1 block">Title</label>
                    <input
                      value={item.title}
                      onChange={(e) => update(item.id, "title", e.target.value)}
                      placeholder="Olive oil mister, LED strip…"
                      className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition placeholder-zinc-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-1 block">Price $</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.amount || ""}
                      onChange={(e) => update(item.id, "amount", parseFloat(e.target.value) || 0)}
                      placeholder="9.99"
                      className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition placeholder-zinc-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-1 block">
                    Short Description
                  </label>
                  <input
                    value={item.description}
                    onChange={(e) => update(item.id, "description", e.target.value)}
                    placeholder="great for air fryers, salads, grilling…"
                    className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition placeholder-zinc-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-1 block">
                    Affiliate Link
                  </label>
                  <input
                    value={item.affiliateLink}
                    onChange={(e) => update(item.id, "affiliateLink", e.target.value)}
                    placeholder="https://amazon.com/dp/…"
                    className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition placeholder-zinc-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-1 block">
                    Product Image URL
                  </label>
                  <input
                    value={item.imageUrl}
                    onChange={(e) => update(item.id, "imageUrl", e.target.value)}
                    onBlur={(e) => update(item.id, "imageUrl", transcodeGoogleDriveUrl(e.target.value))}
                    placeholder="https://drive.google.com/file/d/…"
                    className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition placeholder-zinc-400"
                  />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Tags</label>
                    <button
                      onClick={() => generateTags(item)}
                      disabled={tagLoading[item.id] || !geminiApiKey || !item.title}
                      className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      {tagLoading[item.id] ? "Generating…" : "✨ AI Tags"}
                    </button>
                  </div>
                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 text-xs bg-zinc-100 text-zinc-700 px-2.5 py-1 rounded-full font-medium"
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(item.id, tag)}
                            className="hover:text-red-500 transition leading-none"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <input
                    placeholder="Add tags manually (comma-separated)…"
                    className="w-full text-xs border border-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition placeholder-zinc-400"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addTagsFromString(item.id, e.currentTarget.value);
                        e.currentTarget.value = "";
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value) { addTagsFromString(item.id, e.target.value); e.target.value = ""; }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
