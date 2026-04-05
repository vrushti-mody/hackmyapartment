import { ShopHeader } from "@/components/shop/shop-header";
import { ShopFooter } from "@/components/shop/shop-footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col">
      <ShopHeader />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-16 w-full">
        <h1 className="text-3xl font-bold text-zinc-900 mb-8">Terms & Conditions</h1>
        
        <div className="space-y-8 text-zinc-600 leading-relaxed text-sm sm:text-base">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-zinc-900">1. Affiliate Disclosure</h2>
            <p>
              HackMyApartment is a participant in various affiliate marketing programs. 
              This means we may earn a commission when you click on or make purchases via our links. 
              This comes at no additional cost to you and helps support the content we create.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-zinc-900">2. Pricing & Availability</h2>
            <p>
              We strive to keep our curations as accurate as possible, but please note that prices 
              on this site might be different from prices on Amazon (or other retailers) on any given day. 
              This is because of dynamic price fluctuations, temporary sales, or stock changes that we have no control over.
            </p>
            <p>
              Always verify the final price and availability on the retailer's official website before completing your purchase.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-zinc-900">3. Product Recommendations</h2>
            <p>
              The products displayed in our bundles and on our reels are carefully selected based on aesthetics, 
              community feedback, and perceived quality. However, HackMyApartment does not manufacture, ship, or warranty 
              any of the physical products listed. All purchases are bound by the terms and policies of the respective retailer (such as Amazon).
            </p>
          </section>
        </div>
      </main>

      <ShopFooter />
    </div>
  );
}
