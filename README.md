# HackMyApartment

Reel Generator + Affiliate Storefront for Instagram home decor content.

Takes a room theme + product list and generates: marketing script, AI room image prompt, TTS voiceover, Instagram Reel with product pop-ups, captions with hashtags, and a public storefront.

## Quick Start

```bash
cd app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — Dashboard
Open [http://localhost:3000/shop](http://localhost:3000/shop) — Storefront

## Features

**Dashboard (`/`)**
- Room type selector (Kitchen, Bedroom, Living Room, Bathroom, Outdoor, custom)
- Dynamic product form (title, description, price, image URL, affiliate link, tags)
- Budget Guard — auto-rounds total to nearest $50 for marketing hooks
- Script Generator — creator-voice marketing script with hero item positioning
- AI Room Image Prompt — copy-paste prompt for Stable Diffusion / DALL-E
- ElevenLabs TTS — generate voiceover audio from script
- Remotion Video Preview — animated Reel with Ken Burns background, product pop-ups, price tags, CTA
- Caption & Hashtag Generator — ready-to-paste Instagram caption
- Affiliate Link Export — download links.txt for Linktree/Stories
- LocalStorage persistence — drafts auto-save, episodes save permanently
- Publish toggle — control which episodes appear on the storefront

**Storefront (`/shop`)**
- Theme bundle cards with room type, budget phrase, item count
- Product cards with images, prices, descriptions, tags, and "Buy on Amazon" buttons
- Tag-based filtering across all products
- Reads from same LocalStorage as dashboard

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS** + **shadcn/ui**
- **Remotion** — programmatic video rendering in React
- **ElevenLabs** — TTS voiceover (free tier: 10k chars/month)
- **MongoDB** — persistent episode and product storage

## Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/dragon-assistant/hackmyapartment.git
   cd hackmyapartment/app
   npm install
   ```

2. (Optional) Set your ElevenLabs API key:
   - Click "Settings" in the dashboard
   - Paste your API key from [elevenlabs.io](https://elevenlabs.io)
   - Audio generation works without it — everything else is fully local

3. Run the dev server:
   ```bash
   npm run dev
   ```

## Project Structure

```
app/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main dashboard
│   │   └── shop/page.tsx         # Public storefront
│   ├── components/
│   │   ├── product-form.tsx      # Dynamic product input form
│   │   ├── live-preview.tsx      # Real-time preview panel
│   │   ├── audio-panel.tsx       # ElevenLabs TTS integration
│   │   ├── image-prompt-panel.tsx # AI image prompt generator
│   │   ├── settings-panel.tsx    # API key settings
│   │   ├── video/
│   │   │   ├── reel-composition.tsx  # Remotion video composition
│   │   │   └── video-preview.tsx     # In-browser video player
│   │   └── storefront/
│   │       ├── bundle-card.tsx   # Theme bundle display
│   │       └── product-card.tsx  # Product with affiliate link
│   └── lib/
│       ├── types.ts              # Item & Episode interfaces
│       ├── budget.ts             # Budget Guard rounding logic
│       ├── script.ts             # Marketing script generator
│       ├── caption.ts            # Instagram caption + hashtags
│       ├── prompt.ts             # AI room image prompt generator
│       ├── elevenlabs.ts         # ElevenLabs API client
│       ├── export.ts             # Links export + file download
│       ├── storage.ts            # LocalStorage persistence
│       └── video-config.ts       # Video dimensions + timing
docs/
├── PROPOSAL.md                   # Original strategic proposal
├── ARCHITECTURE_DIAGRAM.md       # Workflow diagrams
├── HUMAN_VS_AUTOMATION.md        # Human vs automation split
└── revised-guidance-doc.md       # Vrush's implementation spec
```

## Component Architecture

Each piece is modular and can be swapped/upgraded independently:

| Component | Current | Future Options |
|-----------|---------|----------------|
| TTS | ElevenLabs API | Local TTS, other APIs |
| Video | Remotion (local render) | Cloud render, ffmpeg |
| Storage | LocalStorage | Supabase, Firebase |
| Image Gen | Prompt copy (manual) | DALL-E API, Stable Diffusion API |
| Hosting | Local dev server | Netlify + GitHub auto deploys |

## Deploy To Netlify

Use Netlify with the GitHub repo connected as the deploy source. That gives you
automatic redeploys on every push to the connected branch.

1. Push this repo to GitHub.
2. In Netlify, choose **Add new project** and import the GitHub repository.
3. Let Netlify use the root-level `netlify.toml`, which points the build at `app/`.
4. Add the required environment variable in Netlify:
   - `MONGODB_URI`
5. Deploy the site.

This project now builds with `next build --webpack`, which avoids the
Turbopack build issue we hit locally while still producing a valid production
build for Netlify.

## Docs

See `docs/` for the full proposal, architecture diagrams, human vs automation breakdown, and Vrush's revised implementation spec.
