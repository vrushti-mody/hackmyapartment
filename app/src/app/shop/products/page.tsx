/**
 * All Products Page (/shop/products) — Filterable/searchable grid.
 * Supports ?q= query param from the header search bar.
 * Card click → /shop/products/[id].
 */
"use client";

import Link from "next/link";
import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ShopHeader } from "@/components/shop/shop-header";
import {
  getAllProducts,
  getCategories,
  type ProductWithEpisode,
} from "@/lib/store-service";

type SortOption = "recommended" | "newest" | "price_asc" | "price_desc";

function ProductGridCard({ product }: { product: ProductWithEpisode }) {
  return (
    <Link
      href={`/shop/products/${product.id}`}
      className="group bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:border-zinc-300 hover:shadow-sm transition-all duration-200 flex flex-col"
    >
      <div className="h-40 sm:h-48 bg-zinc-50 overflow-hidden">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">📦</div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <h4 className="font-semibold text-[13px] text-zinc-800 leading-tight line-clamp-2">{product.title}</h4>
        <p className="text-[12px] text-zinc-400 line-clamp-1">
          {product.bundles.length > 1
            ? `${product.bundles.length} bundles`
            : `${product.episodeRoomType} Bundle`}
        </p>
        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {product.tags.slice(0, 2).map((t) => (
              <span key={t} className="text-[10px] bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        )}
        <p className="font-bold text-sm text-zinc-900 mt-auto pt-2">${product.amount.toFixed(2)}</p>
      </div>
    </Link>
  );
}

function ProductsContent({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState<SortOption>("recommended");
  const [loaded, setLoaded] = useState(false);
  const [allProducts, setAllProducts] = useState<ProductWithEpisode[]>([]);
  const [catList, setCatList] = useState<string[]>([]);

  useEffect(() => {
    async function loadData() {
      const [prods, cats] = await Promise.all([getAllProducts(), getCategories()]);
      setAllProducts(prods);
      setCatList(cats);
      setLoaded(true);
    }
    loadData();
  }, []);

  const categories = useMemo(() => ["All", ...catList], [catList]);
  const filtered = useMemo(() => {
    let results = allProducts;
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      results = results.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    
    if (category !== "All") results = results.filter((p) => p.episodeRoomType === category);
    if (sort === "newest") { /* will sort by createdAt once DB is hooked */ }
    else if (sort === "price_asc") results = [...results].sort((a, b) => a.amount - b.amount);
    else if (sort === "price_desc") results = [...results].sort((a, b) => b.amount - a.amount);
    // "recommended" keeps original order (click-based ranking once DB is hooked)
    return results;
  }, [allProducts, query, category, sort]);

  if (!loaded) return (<div className="min-h-screen bg-zinc-50 flex items-center justify-center"><div className="text-sm text-zinc-400 animate-pulse">Loading…</div></div>);

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <ShopHeader />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Breadcrumb */}
        <div className="text-sm text-zinc-400">
          <Link href="/shop" className="hover:text-zinc-600 transition">Home</Link>
          <span className="mx-1.5">/</span>
          <span className="text-zinc-700 font-medium">Products</span>
        </div>

        {/* Title + inline search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">All Products</h1>
            <p className="text-sm text-zinc-400 mt-1">{filtered.length} products</p>
          </div>
          <div className="relative w-full sm:w-72">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, description, or tag…"
              className="w-full text-sm bg-zinc-50 border border-zinc-200 rounded-full pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                ×
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition ${category === cat
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="hidden sm:block h-6 w-px bg-zinc-200" />

          {/* Sort */}
          <div className="flex gap-1.5 items-center">
            <span className="text-xs text-zinc-400 font-medium">Sort:</span>
            {(["recommended", "newest", "price_asc", "price_desc"] as SortOption[]).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${sort === s ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
              >
                {s === "recommended" ? "Recommended" : s === "newest" ? "Newest" : s === "price_asc" ? "Price ↑" : "Price ↓"}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map((p) => (
              <ProductGridCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-zinc-400">No products match your search.</p>
            <button onClick={() => { setQuery(""); setCategory("All"); }} className="text-sm text-zinc-500 hover:text-zinc-700 underline mt-2">
              Clear filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function ProductsPageInner() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  return <ProductsContent key={initialQuery} initialQuery={initialQuery} />;
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ProductsPageInner />
    </Suspense>
  );
}
