/**
 * Shop Home Page — clean hero + horizontal carousels for bundles & products.
 */
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ShopHeader } from "@/components/shop/shop-header";
import { ShopFooter } from "@/components/shop/shop-footer";
import { HorizontalCarousel } from "@/components/shop/horizontal-carousel";
import { getEpisodes, getAllProducts, type ProductWithEpisode } from "@/lib/store-service";
import { Episode } from "@/lib/types";
import {
  getBundleKind,
  getBundlePriceLabel,
  getBundleTheme,
  getBundleTitle,
} from "@/lib/bundle-meta";
import { getRoomFallbackImage } from "@/lib/room-images";

const INSTAGRAM_URL = "https://www.instagram.com/hackmyapartment/";

function BundleCarouselCard({ episode }: { episode: Episode }) {
  const theme = getBundleTheme(episode);
  const bundleKind = getBundleKind(episode.reelType);
  const heroImage = episode.roomImageUrl || getRoomFallbackImage(episode.roomType, episode.id);
  return (
    <Link
      href={`/shop/bundles/${episode.id}`}
      className="shrink-0 w-56 snap-start group"
    >
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:border-zinc-300 hover:shadow-md transition-all duration-200">
        <div className="h-36 overflow-hidden relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImage} alt={episode.roomType} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-zinc-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
            {bundleKind === "design" ? "Design" : "Upgrade"}
          </span>
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-sm text-zinc-800">{getBundleTitle(episode)}</h3>
          {theme && (
            <p className="text-[11px] text-zinc-500 mt-1 line-clamp-1">
              Theme: {theme}
            </p>
          )}
          <p className="text-xs text-zinc-400 mt-0.5">
            {episode.items.length} items · {getBundlePriceLabel(episode)}
          </p>
        </div>
      </div>
    </Link>
  );
}

function ProductCarouselCard({ product }: { product: ProductWithEpisode }) {
  return (
    <Link
      href={`/shop/products/${product.id}`}
      className="shrink-0 w-44 snap-start group flex flex-col"
    >
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:border-zinc-300 hover:shadow-sm transition-all duration-200 flex flex-col h-full">
        <div className="h-32 bg-zinc-50 overflow-hidden shrink-0">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl opacity-20">📦</div>
          )}
        </div>
        <div className="p-2.5 flex flex-col flex-1">
          <h4 className="font-semibold text-[13px] text-zinc-800 leading-tight line-clamp-2">{product.title}</h4>
          <p className="font-bold text-sm text-zinc-900 mt-auto pt-2">${product.amount.toFixed(2)}</p>
        </div>
      </div>
    </Link>
  );
}

export default function ShopHomePage() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [products, setProducts] = useState<ProductWithEpisode[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [eps, prods] = await Promise.all([getEpisodes(), getAllProducts()]);
      setEpisodes(eps);
      setProducts(prods);
      setLoaded(true);
    }
    loadData();
  }, []);

  if (!loaded) return (<div className="min-h-screen bg-zinc-50 flex items-center justify-center"><div className="text-sm text-zinc-400 animate-pulse">Loading…</div></div>);

  const designBundles = episodes.filter((episode) => episode.reelType === "create");
  const upgradeBundles = episodes.filter((episode) => episode.reelType !== "create");

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <ShopHeader />

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 pt-12 pb-10 text-center">
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3 hover:text-zinc-600 transition"
        >
          @hackmyapartment
        </a>
        <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 leading-tight mb-3">
          Apartment upgrades on a budget
        </h1>
        <p className="text-zinc-500 text-base max-w-md mx-auto">
          Curated design bundles and upgrade bundles from our reels, with every item linked and ready to shop.
        </p>
      </div>

      <main className="max-w-6xl mx-auto px-4 pb-16 space-y-12">
        {designBundles.length > 0 && (
          <HorizontalCarousel title="Design Bundles" viewAllHref="/shop/bundles">
            {designBundles.map((ep) => (
              <BundleCarouselCard key={ep.id} episode={ep} />
            ))}
          </HorizontalCarousel>
        )}

        {upgradeBundles.length > 0 && (
          <HorizontalCarousel title="Upgrade Bundles" viewAllHref="/shop/bundles">
            {upgradeBundles.map((ep) => (
              <BundleCarouselCard key={ep.id} episode={ep} />
            ))}
          </HorizontalCarousel>
        )}

        {/* Product Carousel */}
        <HorizontalCarousel title="Featured Products" viewAllHref="/shop/products">
          {products.map((p) => (
            <ProductCarouselCard key={p.id} product={p} />
          ))}
        </HorizontalCarousel>

        {/* Mobile nav shortcuts */}
        <div className="sm:hidden flex gap-3">
          <Link href="/shop/bundles" className="flex-1 text-center text-sm font-semibold border border-zinc-200 py-3 rounded-xl hover:bg-zinc-50 transition">
            All Bundles
          </Link>
          <Link href="/shop/products" className="flex-1 text-center text-sm font-semibold border border-zinc-200 py-3 rounded-xl hover:bg-zinc-50 transition">
            All Products
          </Link>
        </div>
      </main>

      {/* Footer */}
      <ShopFooter />
    </div>
  );
}
