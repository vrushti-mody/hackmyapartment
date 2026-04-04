/**
 * Bundle Detail Page (/shop/bundles/[id])
 * Hero AI image (or gradient), then product list with View Details + 🛒 buttons.
 */
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ShopHeader } from "@/components/shop/shop-header";
import { getEpisodeById, getRoomGradient } from "@/lib/store-service";
import { Episode, Item } from "@/lib/types";

function ProductRow({ item }: { item: Item }) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-zinc-100 last:border-b-0">
      {/* Thumbnail */}
      <Link href={`/shop/products/${item.id}`} className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-zinc-50 border border-zinc-200">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl opacity-20">📦</div>
        )}
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link href={`/shop/products/${item.id}`} className="font-semibold text-sm text-zinc-800 hover:text-zinc-600 transition line-clamp-1">
          {item.title}
        </Link>
        <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{item.description}</p>
        <p className="font-bold text-sm text-zinc-900 mt-1">${item.amount.toFixed(2)}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 shrink-0">
        <Link
          href={`/shop/products/${item.id}`}
          className="text-xs font-semibold text-zinc-600 border border-zinc-200 px-3 py-1.5 rounded-lg hover:bg-zinc-50 transition"
        >
          Details
        </Link>
        {item.affiliateLink && (
          <a
            href={item.affiliateLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-zinc-600 border border-zinc-200 px-3 py-1.5 rounded-lg hover:bg-zinc-50 hover:border-zinc-300 transition flex items-center gap-1"
          >
            🛒 Buy
          </a>
        )}
      </div>
    </div>
  );
}

export default function BundleDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadData() {
      const ep = await getEpisodeById(id);
      setEpisode(ep || null);
      setLoaded(true);
    }
    loadData();
  }, [id]);

  if (!loaded) return (<div className="min-h-screen bg-zinc-50 flex items-center justify-center"><div className="text-sm text-zinc-400 animate-pulse">Loading…</div></div>);

  if (!episode) {
    return (
      <div className="min-h-screen bg-white text-zinc-900">
        <ShopHeader />
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <p className="text-zinc-400 text-lg">Bundle not found.</p>
          <Link href="/shop/bundles" className="text-sm text-zinc-500 hover:text-zinc-700 underline mt-4 inline-block">
            ← Back to bundles
          </Link>
        </div>
      </div>
    );
  }

  const total = episode.items.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <ShopHeader />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Breadcrumb */}
        <div className="text-sm text-zinc-400">
          <Link href="/shop" className="hover:text-zinc-600 transition">Home</Link>
          <span className="mx-1.5">/</span>
          <Link href="/shop/bundles" className="hover:text-zinc-600 transition">Bundles</Link>
          <span className="mx-1.5">/</span>
          <span className="text-zinc-700 font-medium">{episode.roomType}</span>
        </div>

        {/* Hero image */}
        <div className="rounded-2xl overflow-hidden border border-zinc-200 h-48 sm:h-64">
          {episode.roomImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={episode.roomImageUrl} alt={episode.roomType} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" style={{ background: getRoomGradient(episode.roomType) }} />
          )}
        </div>

        {/* Bundle info */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">{episode.roomType} Bundle</h1>
            {episode.theme?.trim() && (
              <p className="text-sm text-zinc-500 mt-1">
                Theme: {episode.theme.trim()}
              </p>
            )}
            <p className="text-sm text-zinc-400 mt-1">{episode.items.length} products · {episode.budgetPhrase}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-zinc-900">${total.toFixed(2)}</p>
            <p className="text-xs text-zinc-400">total for all items</p>
          </div>
        </div>

        {/* Product list */}
        <div className="bg-white border border-zinc-200 rounded-2xl divide-y-0 px-4">
          {episode.items.map((item) => (
            <ProductRow key={item.id} item={item} />
          ))}
        </div>

        {/* Back */}
        <Link href="/shop/bundles" className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-600 transition">
          ← Back to all bundles
        </Link>
      </main>
    </div>
  );
}
