/**
 * All Bundles Page (/shop/bundles) — Grid view with search, category filter, and sort.
 * Entire card is clickable → /shop/bundles/[id].
 */
"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { ShopHeader } from "@/components/shop/shop-header";
import { getEpisodes, getCategories } from "@/lib/store-service";
import { Episode } from "@/lib/types";
import {
  BundleKind,
  getBundleKind,
  getBundlePriceLabel,
  getBundlePriceValue,
  getBundleTheme,
  getBundleTitle,
} from "@/lib/bundle-meta";
import { getRoomFallbackImage } from "@/lib/room-images";

type SortOption = "recommended" | "newest" | "price_asc" | "price_desc";
type BundleTypeFilter = "all" | BundleKind;

function BundleGridCard({ episode }: { episode: Episode }) {
  const theme = getBundleTheme(episode);
  const bundleKind = getBundleKind(episode.reelType);
  const heroImage = episode.roomImageUrl || getRoomFallbackImage(episode.roomType, episode.id);
  return (
    <Link
      href={`/shop/bundles/${episode.id}`}
      className="group bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:border-zinc-300 hover:shadow-md transition-all duration-200 flex flex-col"
    >
      <div className="h-44 sm:h-52 overflow-hidden relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroImage} alt={episode.roomType} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <span className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-sm text-zinc-700 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-white/20">
          {bundleKind === "design" ? "Design Bundle" : "Upgrade Bundle"}
        </span>
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-[15px] text-zinc-800">{getBundleTitle(episode)}</h3>
          {theme && (
            <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
              Theme: {theme}
            </p>
          )}
          <p className="text-xs text-zinc-400 mt-1">
            {episode.items.length} items
          </p>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="font-bold text-base text-zinc-900">{getBundlePriceLabel(episode)}</span>
          <span className="text-xs text-zinc-400 group-hover:text-zinc-600 transition">View bundle →</span>
        </div>
      </div>
    </Link>
  );
}

export default function BundlesPage() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [category, setCategory] = useState("All");
  const [bundleType, setBundleType] = useState<BundleTypeFilter>("all");
  const [sort, setSort] = useState<SortOption>("recommended");
  const [query, setQuery] = useState("");
  const [loaded, setLoaded] = useState(false);

  const [catList, setCatList] = useState<string[]>([]);

  useEffect(() => {
    async function loadData() {
      const [eps, cats] = await Promise.all([getEpisodes(), getCategories()]);
      setEpisodes(eps);
      setCatList(cats);
      setLoaded(true);
    }
    loadData();
  }, []);

  const categories = useMemo(() => ["All", ...catList], [catList]);

  const filtered = useMemo(() => {
    let results = episodes;

    // Category filter
    if (category !== "All") results = results.filter((e) => e.roomType === category);

    if (bundleType !== "all") {
      results = results.filter((episode) => getBundleKind(episode.reelType) === bundleType);
    }

    // Search
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      results = results.filter(
        (e) =>
          getBundleTitle(e).toLowerCase().includes(q) ||
          getBundleKind(e.reelType).includes(q) ||
          e.roomType.toLowerCase().includes(q) ||
          getBundleTheme(e).toLowerCase().includes(q) ||
          e.items.some(
            (i) =>
              i.title.toLowerCase().includes(q) ||
              i.tags.some((t) => t.toLowerCase().includes(q))
          )
      );
    }

    // Sort
    if (sort === "newest") results = [...results].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else if (sort === "price_asc") results = [...results].sort((a, b) => getBundlePriceValue(a) - getBundlePriceValue(b));
    else if (sort === "price_desc") results = [...results].sort((a, b) => getBundlePriceValue(b) - getBundlePriceValue(a));
    // "recommended" keeps original order (will be click-based once DB is hooked)

    return results;
  }, [episodes, category, bundleType, query, sort]);

  if (!loaded) return (<div className="min-h-screen bg-zinc-50 flex items-center justify-center"><div className="text-sm text-zinc-400 animate-pulse">Loading…</div></div>);

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <ShopHeader />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Breadcrumb */}
        <div className="text-sm text-zinc-400">
          <Link href="/shop" className="hover:text-zinc-600 transition">Home</Link>
          <span className="mx-1.5">/</span>
          <span className="text-zinc-700 font-medium">Bundles</span>
        </div>

        {/* Title + search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">All Bundles</h1>
            <p className="text-sm text-zinc-400 mt-1">{filtered.length} curated design and upgrade bundles</p>
          </div>
          <div className="relative w-full sm:w-72">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search bundles…"
              className="w-full text-sm bg-zinc-50 border border-zinc-200 rounded-full pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                ×
              </button>
            )}
          </div>
        </div>

        {/* Filters + Sort */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex flex-wrap gap-2">
            {([
              ["all", "All Types"],
              ["design", "Design"],
              ["upgrade", "Upgrade"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setBundleType(value)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition ${
                  bundleType === value
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="hidden sm:block h-6 w-px bg-zinc-200" />

          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition ${
                  category === cat
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="hidden sm:block h-6 w-px bg-zinc-200" />

          {/* Sort */}
          <div className="flex gap-1.5 items-center">
            <span className="text-xs text-zinc-400 font-medium">Sort:</span>
            {(["recommended", "newest", "price_asc", "price_desc"] as SortOption[]).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                  sort === s ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {s === "recommended" ? "Recommended" : s === "newest" ? "Newest" : s === "price_asc" ? "Price ↑" : "Price ↓"}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((ep) => (
              <BundleGridCard key={ep.id} episode={ep} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-zinc-400">No bundles match your search.</p>
            <button onClick={() => { setQuery(""); setCategory("All"); setBundleType("all"); }} className="text-sm text-zinc-500 hover:text-zinc-700 underline mt-2">
              Clear filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
