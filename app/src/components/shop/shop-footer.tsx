import Link from "next/link";

const INSTAGRAM_URL = "https://www.instagram.com/hackmyapartment/";

export function ShopFooter() {
  return (
    <footer className="border-t border-zinc-100 py-10 mt-12 text-center text-sm text-zinc-400 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div>
          <p className="mb-1">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-zinc-600 hover:text-zinc-900 transition"
            >
              @hackmyapartment
            </a>
          </p>
          <p>Affordable home upgrades, one reel at a time.</p>
        </div>

        <div className="pt-4 space-y-2 text-xs text-zinc-400/80">
          <p>
            I may earn a commission if you buy products through links on this site.
          </p>
          <p>
            <Link href="/shop/terms" className="underline hover:text-zinc-600 transition">
              Terms & Conditions
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
