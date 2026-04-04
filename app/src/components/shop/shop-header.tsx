/**
 * ShopHeader — Shared sticky header for all shop pages.
 * Clean minimal style: logo left, nav + search right.
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ShopHeader() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/shop/products?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-zinc-100">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <a href="/shop" className="font-bold text-lg tracking-tight shrink-0">
          HackMyApartment
        </a>

        {/* Search — grows to fill space */}
        <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              className="w-full text-sm bg-zinc-50 border border-zinc-200 rounded-full pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition"
            />
          </div>
        </form>

        {/* Nav */}
        <nav className="flex items-center gap-4 shrink-0">
          <a href="/shop/bundles" className="text-sm text-zinc-600 hover:text-zinc-900 transition font-medium hidden sm:block">
            Bundles
          </a>
          <a href="/shop/products" className="text-sm text-zinc-600 hover:text-zinc-900 transition font-medium hidden sm:block">
            Products
          </a>
        </nav>
      </div>

      {/* Mobile search */}
      <div className="sm:hidden px-4 pb-3">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              className="w-full text-sm bg-zinc-50 border border-zinc-200 rounded-full pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition"
            />
          </div>
        </form>
      </div>
    </header>
  );
}
