/**
 * HorizontalCarousel — Generic scrollable row with ← → arrows.
 * Used on the shop home page for both bundle and product carousels.
 */
"use client";

import { useRef, useState, useEffect } from "react";

interface HorizontalCarouselProps {
  title: string;
  viewAllHref: string;
  children: React.ReactNode;
}

export function HorizontalCarousel({ title, viewAllHref, children }: HorizontalCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  function updateArrows() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }

  useEffect(() => {
    updateArrows();
    const el = scrollRef.current;
    el?.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el?.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, []);

  function scroll(dir: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  }

  return (
    <section className="space-y-3">
      {/* Heading */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-zinc-800 text-lg">{title}</h2>
        <a
          href={viewAllHref}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition"
        >
          View all →
        </a>
      </div>

      {/* Scroll container */}
      <div className="relative group">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-zinc-200 shadow-md flex items-center justify-center text-zinc-600 hover:bg-zinc-50 transition opacity-0 group-hover:opacity-100"
            aria-label="Scroll left"
          >
            ‹
          </button>
        )}

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-zinc-200 shadow-md flex items-center justify-center text-zinc-600 hover:bg-zinc-50 transition opacity-0 group-hover:opacity-100"
            aria-label="Scroll right"
          >
            ›
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
