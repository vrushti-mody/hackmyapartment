/**
 * Product Detail Page (/shop/products/[id])
 * Large image, full title + description, price, tags, "Shop on Amazon" CTA.
 */
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ShopHeader } from "@/components/shop/shop-header";
import { getProductById, type ProductWithEpisode } from "@/lib/store-service";
import { Episode } from "@/lib/types";

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<(ProductWithEpisode & { episode: Episode }) | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadData() {
      const p = await getProductById(id);
      setProduct(p || null);
      setLoaded(true);
    }
    loadData();
  }, [id]);

  if (!loaded) return (<div className="min-h-screen bg-zinc-50 flex items-center justify-center"><div className="text-sm text-zinc-400 animate-pulse">Loading…</div></div>);

  if (!product) {
    return (
      <div className="min-h-screen bg-white text-zinc-900">
        <ShopHeader />
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <p className="text-zinc-400 text-lg">Product not found.</p>
          <Link href="/shop/products" className="text-sm text-zinc-500 hover:text-zinc-700 underline mt-4 inline-block">
            ← Back to products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <ShopHeader />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Breadcrumb */}
        <div className="text-sm text-zinc-400">
          <Link href="/shop" className="hover:text-zinc-600 transition">Home</Link>
          <span className="mx-1.5">/</span>
          <Link href="/shop/products" className="hover:text-zinc-600 transition">Products</Link>
          <span className="mx-1.5">/</span>
          <span className="text-zinc-700 font-medium line-clamp-1">{product.title}</span>
        </div>

        {/* Layout: image + details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Image */}
          <div className="rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-50 aspect-square">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl opacity-20">📦</div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <p className="text-xs text-zinc-400 font-medium">
                From{" "}
                <Link href={`/shop/bundles/${product.episodeId}`} className="text-zinc-500 hover:text-zinc-700 underline">
                  {product.episodeRoomType} Bundle
                </Link>
              </p>
              {product.bundles.length > 1 && (
                <p className="text-xs text-zinc-400 mt-1">
                  Also featured in {product.bundles.length - 1} more bundle{product.bundles.length > 2 ? "s" : ""}.
                </p>
              )}
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 mt-1">{product.title}</h1>
            </div>

            <p className="text-2xl font-bold text-zinc-900">${product.amount.toFixed(2)}</p>

            {product.description && (
              <div>
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">Description</h2>
                <p className="text-sm text-zinc-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            {product.tags.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">Tags</h2>
                <div className="flex flex-wrap gap-1.5">
                  {product.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            {product.affiliateLink && (
              <a
                href={product.affiliateLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-zinc-900 hover:bg-zinc-700 text-white font-bold py-3.5 rounded-xl text-sm transition"
              >
                Shop on Amazon →
              </a>
            )}

            {/* Back to bundle */}
            <Link
              href={`/shop/bundles/${product.episodeId}`}
              className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-600 transition"
            >
              ← View full {product.episodeRoomType} bundle
            </Link>
          </div>
        </div>

        {/* Other items in same bundle */}
        {product.episode.items.filter((i) => i.id !== product.id).length > 0 && (
          <div className="pt-6 border-t border-zinc-100 space-y-4">
            <h2 className="font-semibold text-zinc-800">Also in this bundle</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {product.episode.items
                .filter((i) => i.id !== product.id)
                .map((item) => (
                  <Link
                    key={item.id}
                    href={`/shop/products/${item.id}`}
                    className="group bg-white border border-zinc-200 rounded-xl overflow-hidden hover:border-zinc-300 transition"
                  >
                    <div className="h-28 bg-zinc-50 overflow-hidden">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl opacity-20">📦</div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-semibold text-zinc-700 line-clamp-1">{item.title}</p>
                      <p className="text-xs font-bold text-zinc-900 mt-0.5">${item.amount.toFixed(2)}</p>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        )}

        {product.bundles.length > 1 && (
          <div className="pt-6 border-t border-zinc-100 space-y-3">
            <h2 className="font-semibold text-zinc-800">Also featured in</h2>
            <div className="flex flex-wrap gap-2">
              {product.bundles
                .filter((bundle) => bundle.id !== product.episodeId)
                .map((bundle) => (
                  <Link
                    key={bundle.id}
                    href={`/shop/bundles/${bundle.id}`}
                    className="text-xs font-semibold text-zinc-600 border border-zinc-200 px-3 py-1.5 rounded-lg hover:bg-zinc-50 transition"
                  >
                    {bundle.roomType} Bundle
                  </Link>
                ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
