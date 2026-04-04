# 🚀 HackMyApartment — Reel Generator Web App (v1.0)

## 1. Project Overview

A centralized dashboard to automate the creation of high-conversion Instagram Reels. The app takes a **theme/room type**, a **list of products** (with title, description, amount, and image), then generates:

1. A **budget-optimized hook** (rounded total)
2. A **marketing script** in a high-energy creator voice
3. An **AI room image** matching the theme
4. **Voiceover audio** via text-to-speech
5. A **final Instagram Reel video** with product pop-ups, captions, and hashtags

**Primary Goal:** Reduce production time from 4 hours → 15 minutes.
**Cost Target:** $0 (local rendering + free-tier APIs).

---

## 2. Technical Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Framework | **Next.js 14** (App Router) | Best-in-class React framework; free hosting on Vercel |
| State Management | **React Hook Form + Zod** | Handles dynamic item lists (add/remove products) with validation |
| Voice (TTS) | **ElevenLabs API** (Free Tier) | 10k chars/mo ≈ ~10 high-quality Reels for $0 |
| Video Engine | **Remotion** | Programmatic video in React; renders locally, no cloud fees |
| Styling | **Tailwind CSS + shadcn/ui** | Fast, clean dashboard aesthetic |
| Persistence | **LocalStorage** | Save draft episodes; no backend required |

---

## 3. App Flow & Features

### 3.1 The Input Form

A dynamic form with two sections:

**Room Theme Selector:**

| Option | Value |
|--------|-------|
| 🛏️ Bedroom | `bedroom` |
| 🍳 Kitchen | `kitchen` |
| 🛋️ Living Room | `living room` |
| 🚿 Bathroom | `bathroom` |
| 🌿 Outdoor | `outdoor` |
| ✏️ Other | Free-text input |

**Product List (dynamic — add/remove items):**

Each item has:

| Field | Type | Required | Example |
|-------|------|----------|---------|
| Title | text | ✅ | `2-in-1 peach-toned olive oil sprayer` |
| Description | text | ✅ | `perfect for air frying, salads, or grilling` |
| Amount | number | ✅ | `7.54` |
| Image URL | URL | ✅ | `https://m.media-amazon.com/images/...` |
| Affiliate Link | URL | ✅ | `https://amzn.to/...` |
| Tags | text (comma-separated) | ❌ | `kitchen, cookware, nonstick` |

### 3.2 The "Budget Guard" — Auto-Rounded Total

The app **automatically** calculates and rounds the total to the nearest $50 ceiling for the marketing hook.

**Rounding Logic:**

```typescript
// Round UP to the nearest 50
const getRoundedTotal = (total: number): number => {
  return Math.ceil(total / 50) * 50;
};

// Generate the hook phrase
const getBudgetPhrase = (total: number): string => {
  const rounded = getRoundedTotal(total);
  // If total is very close to the boundary, label changes
  if (total <= rounded - 25) {
    return `under $${rounded}`;   // 813 → "under $850"
  }
  return `under $${rounded}`;     // 878 → "under $900"
};
```

| Raw Total | Rounded | Hook Text |
|-----------|---------|-----------|
| $111.50 | $150 | "under $150" |
| $813.00 | $850 | "under $850" |
| $878.00 | $900 | "under $900" |
| $250.00 | $250 | "under $250" |

### 3.3 Script Generator

Generates a creator-voice marketing script in real time as you fill out the form.

**Template Rules:**

1. **Intro/Hook:** `"Upgrade your {roomType} on a budget with these smart and stylish finds."`
2. **First item:** `"First up, this {title} for just ${amount}—{description}."`
3. **Middle items:** `"Next, this {title} for just ${amount}—{description}."` (or varied connectors like "Then," "For," etc.)
4. **Hero item** (highest price → placed second-to-last): `"The real star? This gorgeous {title} for only ${amount}—{description}."`
5. **Last item** (if different from hero): standard connector
6. **CTA:** `"Total upgrade for under ${roundedTotal}! Check my stories or the link in bio for all the product links—or comment "{roomType}" and I'll send them your way! Don't forget to follow @hackmyapartment for more affordable {roomType} hacks and finds!"`

**Algorithm:**

```typescript
const generateScript = (items: Item[], roomType: string, roundedTotal: number): string => {
  // Sort: move highest-priced item to second-to-last position
  const sorted = [...items];
  const heroIndex = sorted.reduce((maxIdx, item, idx, arr) =>
    item.amount > arr[maxIdx].amount ? idx : maxIdx, 0);
  const heroItem = sorted.splice(heroIndex, 1)[0];
  sorted.splice(sorted.length - 1, 0, heroItem); // insert before last

  const intro = `Upgrade your ${roomType} on a budget with these smart and stylish finds.`;

  const lines = sorted.map((item, i) => {
    if (item === heroItem) {
      return `The real star? This gorgeous ${item.title} for only $${item.amount}—${item.description}.`;
    }
    const connector = i === 0 ? "First up" : ["Next", "Then", "And"][i % 3];
    return `${connector}, this ${item.title} for just $${item.amount}—${item.description}.`;
  });

  const cta = [
    `Total upgrade for under $${roundedTotal}!`,
    `Check my stories or the link in bio for all the product links—or comment "${roomType}" and I'll send them your way!`,
    `Don't forget to follow @hackmyapartment for more affordable ${roomType} hacks and finds!`
  ].join(" ");

  return `${intro} ${lines.join(" ")} ${cta}`;
};
```

**Example Output (Kitchen, 5 items):**

> Upgrade your kitchen on a budget with these smart and stylish finds. First up, this 2-in-1 peach-toned olive oil sprayer for just $7.54—perfect for air frying, salads, or grilling. Then, add extra storage with a magnetic silicone stove shelf for $16.99—it fits right behind your stove and keeps your spices within easy reach. For mess-free microwaving, grab this 10-inch collapsible food cover for $9.99—it doubles as a mat and colander too. The real star? This gorgeous sage green 15-piece nonstick cookware set with detachable handles for only $59.99—oven-safe and RV-friendly. And for easy clean-up, this cordless electric spin scrubber is a steal at $16.99. Total upgrade for under $115! Check my stories or the link in bio for all the product links—or comment "kitchen" and I'll send them your way! Don't forget to follow @hackmyapartment for more affordable kitchen hacks and finds!

### 3.4 AI Room Image Generation

Generate a styled room background image that matches the theme.

- **Prompt Generator:** Auto-builds a Stable Diffusion / DALL-E prompt based on room type and product aesthetic
- **Example:** `"A cozy modern kitchen interior, clean countertops, warm lighting, sage green accents, Instagram aesthetic, photorealistic, 9:16 aspect ratio"`
- **Options:** Copy prompt to clipboard (for external tools) or generate directly via API

### 3.5 Audio Generation (TTS)

- Pass the generated script to **ElevenLabs API**
- Select voice (upbeat female creator voice recommended)
- Preview audio in the browser
- Download `.mp3` for use in the video

### 3.6 Video Weaver — Instagram Reel Assembly

Combine all assets into a final 9:16 Instagram Reel using **Remotion**:

| Layer | Content | Timing |
|-------|---------|--------|
| Background | AI room image (subtle Ken Burns zoom) | Full duration |
| Product Pop-ups | Product images slide in/out synced to audio | Per-item segments |
| Text Overlays | Auto-generated captions from script | Synced to audio |
| Price Tags | Animated price badges per product | Per-item segments |
| CTA Overlay | "Comment {roomType} for links!" | Final 3 seconds |

**Output:** `.mp4` file at 1080×1920 (9:16), ready for Instagram upload.

### 3.7 Caption & Hashtag Generator

Auto-generate an Instagram caption and hashtag set:

```
🏠 Upgrade your kitchen for under $115! 🍳

Here's everything you need:
1. 2-in-1 olive oil sprayer — $7.54
2. Magnetic stove shelf — $16.99
3. Collapsible food cover — $9.99
4. 15-piece nonstick cookware set — $59.99
5. Cordless spin scrubber — $16.99

💬 Comment "kitchen" and I'll send you the links!
🔗 Or check the link in bio

#hackmyapartment #kitchenhacks #amazonfinds #budgetkitchen
#apartmentliving #homehacks #amazonmusthaves #kitchenorganization
#affordablehome #reelsinstagram
```

---

## 4. Feature Roadmap

### Phase 1: The Input Dashboard (Week 1)

- [ ] Build the room type selector (dropdown with "Other" free-text option)
- [ ] Build the dynamic product form (add/remove items with title, description, amount, image URL, affiliate link)
- [ ] Implement the "Budget Guard" — live-updating rounded total
- [ ] Create the "Live Preview" sidebar showing running total and rounded budget phrase
- [ ] Implement the Script Generator that updates in real time as you type
- [ ] Add LocalStorage persistence for draft episodes
- [ ] Add a "Copy Script" button

### Phase 2: AI & Asset Integration (Week 2)

- [ ] **ElevenLabs hookup:** Connect the "Generate Audio" button to the ElevenLabs API
- [ ] **Audio preview:** Play/pause generated audio in the browser
- [ ] **Image handling:** Create a preview gallery for product images
- [ ] **Prompt Generator:** Auto-build + copy an AI room image prompt
- [ ] **Caption Generator:** Auto-generate Instagram caption + hashtags
- [ ] **Affiliate export:** Output a `links.txt` file for Linktree/Stories

### Phase 3: The Video Weaver (Week 3)

- [ ] Integrate Remotion into the project
- [ ] Add a video preview player before export
- [ ] Create a Video Template that:
  - Uses the AI room image as the background
  - Triggers product pop-ups based on audio timestamps
  - Overlays automated captions synced to voiceover
  - Adds animated price tags
  - Ends with a CTA overlay
- [ ] Add the "Render Reel" button to export the final `.mp4`

### Phase 4: The Storefront (Week 4)

- [ ] Build the static storefront page with theme bundle sections
- [ ] Create product cards with affiliate link "Buy on Amazon" buttons
- [ ] Add tag-based filtering across all products
- [ ] Auto-publish episodes as theme bundles to the storefront
- [ ] Add a bundle hero card with room type, budget phrase, and item count
- [ ] Configure static export for free hosting (Vercel / GitHub Pages)
- [ ] Set up custom domain (e.g., `shop.hackmyapartment.com`)

---

## 5. Page Layout (Single Page Dashboard)

```
┌──────────────────────────────────────────────────────┐
│  🏠 HackMyApartment — Reel Generator                │
├────────────────────────┬─────────────────────────────┤
│                        │                             │
│  ROOM TYPE: [Kitchen▼] │   📊 LIVE PREVIEW           │
│                        │                             │
│  ── PRODUCTS ────────  │   Items: 5                  │
│  [+ Add Item]          │   Raw Total: $111.50        │
│                        │   Budget Hook: "Under $150" │
│  1. Olive Oil Sprayer  │                             │
│     $7.54  [🗑]        │   ── GENERATED SCRIPT ──    │
│  2. Stove Shelf        │   "Upgrade your kitchen..." │
│     $16.99 [🗑]        │                             │
│  3. Food Cover         │   [📋 Copy Script]          │
│     $9.99  [🗑]        │   [🎙 Generate Audio]       │
│  4. Cookware Set       │   [🖼 Generate Room Image]  │
│     $59.99 [🗑]        │   [🎬 Render Reel]          │
│  5. Spin Scrubber      │   [📱 Copy Caption]         │
│     $16.99 [🗑]        │                             │
│                        │                             │
├────────────────────────┴─────────────────────────────┤
│  📱 CAPTION & HASHTAGS                               │
│  🏠 Upgrade your kitchen for under $115! ...         │
│  #hackmyapartment #kitchenhacks #amazonfinds ...     │
└──────────────────────────────────────────────────────┘
```

---

## 6. Data Model

```typescript
interface Item {
  id: string;           // uuid
  title: string;        // "2-in-1 olive oil sprayer"
  description: string;  // "perfect for air frying, salads, or grilling"
  amount: number;       // 7.54
  imageUrl: string;     // product image URL
  affiliateLink: string;    // REQUIRED — Amazon affiliate URL
  tags: string[];           // e.g., ["kitchen", "cookware", "under $20"]
}

interface Episode {
  id: string;
  roomType: string;             // "kitchen" | "bedroom" | custom
  items: Item[];
  rawTotal: number;             // sum of all item amounts
  roundedTotal: number;         // Math.ceil(rawTotal / 50) * 50
  budgetPhrase: string;         // "under $150"
  generatedScript: string;
  generatedCaption: string;
  hashtags: string[];
  audioUrl?: string;            // generated TTS audio
  roomImageUrl?: string;        // AI-generated room image
  videoUrl?: string;            // final rendered .mp4
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 7. Static Storefront / Marketplace Page

In addition to the Reel generator dashboard, the app includes a **public-facing static storefront** — a simple marketplace-style webpage where followers can browse and shop all recommended products.

### 7.1 Purpose

When a viewer sees your Reel and visits your link-in-bio, they land on **your website** (not a generic Linktree). The storefront:

- Acts as a **branded affiliate marketplace** — every product card links out to Amazon via your affiliate link
- Organizes products into **themed bundles** ("Kitchen Under $150", "Cozy Bedroom Under $200", etc.)
- Lets visitors **browse all products** or filter by room/theme/tag
- Gives you full control over presentation, SEO, and tracking

### 7.2 Page Structure

```
┌──────────────────────────────────────────────────────────┐
│  🏠 HackMyApartment — Shop My Finds                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  🔥 THEME BUNDLES                                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │ 🍳 Kitchen  │ │ 🛏️ Bedroom │ │ 🛋️ Living  │        │
│  │ Under $150  │ │ Under $200  │ │ Under $300  │        │
│  │ 5 items     │ │ 6 items     │ │ 4 items     │        │
│  │ [Shop Now →]│ │ [Shop Now →]│ │ [Shop Now →]│        │
│  └─────────────┘ └─────────────┘ └─────────────┘        │
│                                                          │
│  ── Kitchen Under $150 Bundle ──────────────────         │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │
│  │ 🖼️    │ │ 🖼️    │ │ 🖼️    │ │ 🖼️    │            │
│  │ Olive  │ │ Stove  │ │ Food   │ │Cookware│            │
│  │ Sprayer│ │ Shelf  │ │ Cover  │ │ Set    │            │
│  │ $7.54  │ │ $16.99 │ │ $9.99  │ │ $59.99 │            │
│  │[Buy →] │ │[Buy →] │ │[Buy →] │ │[Buy →] │            │
│  └────────┘ └────────┘ └────────┘ └────────┘            │
│                                                          │
│  🏷️ ALL PRODUCTS                    [Filter by tag ▼]   │
│  Grid of all products across all bundles...              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 7.3 How It Works

1. Every product you add in the Reel generator dashboard (with its affiliate link, image, tags) **automatically** gets published to the storefront
2. Each **Episode/Reel** becomes a **Theme Bundle** on the storefront (e.g., "Kitchen Under $150")
3. Clicking **"Buy →"** on any product card redirects to Amazon via **your affiliate link**
4. The **"All Products"** section shows every product across all bundles, filterable by tags (e.g., `kitchen`, `cookware`, `under $20`, `cleaning`)

### 7.4 Product Card

Each product card displays:

| Element | Source |
|---------|--------|
| Product image | `imageUrl` from the form |
| Title | `title` from the form |
| Price | `amount` from the form |
| Short description | `description` from the form |
| Tags | `tags` from the form (displayed as pills) |
| "Buy on Amazon" button | Links to `affiliateLink` — **opens in new tab** |

### 7.5 Theme Bundle Card

Each bundle card displays:

| Element | Source |
|---------|--------|
| Room type icon + name | `roomType` from the episode |
| Budget phrase | `budgetPhrase` (e.g., "Under $150") |
| Item count | Number of products in the bundle |
| "Shop Now" button | Scrolls/navigates to the bundle section |

### 7.6 Static Site Generation

- The storefront is a **statically generated page** (Next.js `generateStaticParams` or exported HTML)
- No backend or database needed — all product data comes from the same LocalStorage/JSON used by the dashboard
- For production: export as a static site and host on **Vercel**, **GitHub Pages**, or **Netlify** for free
- Add your custom domain (e.g., `shop.hackmyapartment.com`) to point to the storefront

> [!IMPORTANT]
> The **affiliate link field is required** for every product. Without it, the "Buy" button has nowhere to redirect. Always use your Amazon Associates affiliate links so you earn commission on every purchase made through your storefront.

---

## 8. Updated Data Model

```typescript
interface Item {
  id: string;
  title: string;
  description: string;
  amount: number;
  imageUrl: string;
  affiliateLink: string;    // REQUIRED — Amazon affiliate URL
  tags: string[];           // e.g., ["kitchen", "cookware", "under $20"]
}

interface Episode {
  id: string;
  roomType: string;
  items: Item[];
  rawTotal: number;
  roundedTotal: number;
  budgetPhrase: string;
  generatedScript: string;
  generatedCaption: string;
  hashtags: string[];
  audioUrl?: string;
  roomImageUrl?: string;
  videoUrl?: string;
  publishedToStorefront: boolean;  // whether this bundle is live on the shop page
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 9. Maintenance & Scalability

- **Data Persistence:** LocalStorage initially — no backend needed. Migrate to Supabase/Firebase if multi-device sync is desired later.
- **Affiliate Management:** Every product has a **required** affiliate link. The storefront serves as the central hub for all affiliate traffic. The app can also export a `links.txt` for Linktree/Stories.
- **Template Variety:** Script connector words and CTA text can be randomized or user-customizable in a future version.
- **Batch Mode:** Future v2 could support generating multiple Reels from a spreadsheet/CSV import.
- **Analytics:** Add UTM parameters to affiliate links automatically (e.g., `?tag=hackmyapt-20&utm_source=storefront&utm_medium=bundle`) for tracking which bundles/products convert best.
