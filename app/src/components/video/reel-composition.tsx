/**
 * ReelComposition — Remotion composition that renders a full Instagram
 * Reel as a sequence of animated slides.
 *
 * Sequence:
 *   1. IntroSlide  — room type + budget hook on the AI room image
 *   2. ProductSlide (per item) — product image, name, short description, price
 *   3. CTASlide   — follow @hackmyapartment + comment for links
 *
 * Audio: if `audioUrl` is provided it plays the ElevenLabs voiceover
 * across the full duration using Remotion's <Audio> component.
 */
"use client";

import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
  Img,
} from "remotion";
import { Audio } from "@remotion/media";
import { Item } from "../../lib/types";
import {
  AUDIO_PLAYBACK_RATE,
  getIntroDurationInFrames,
  getProductDurationInFrames,
  getCtaDurationInFrames,
} from "../../lib/video-config";
import { AudioTimingMapping } from "../../lib/audio-alignment";
import { getUpgradeHookPrice } from "../../lib/budget";

export interface ReelCompositionProps extends Record<string, unknown> {
  items: Item[];
  roomType: string;
  budgetPhrase: string;
  reelType?: "create" | "upgrade";
  roomImageUrl?: string;
  audioUrl?: string;
  timings?: AudioTimingMapping | null;
  theme?: string;
  paletteIndex?: number;
}

export interface ReelPalette {
  primary: string;   // Main accent (titles, price badges)
  secondary: string; // Sub accent (budget pill, theme badge)
  tertiary: string;  // CTA bubble / comment box
  text: string;      // Text on primary
  textSecondary: string; // Text on secondary
}

export const PALETTES: ReelPalette[] = [
  // 0 — Original: Yellow + Pink + Mint
  { primary: "#fbbf24", secondary: "#ec4899", tertiary: "#34d399", text: "#000", textSecondary: "#fff" },
  // 1 — Electric Blue + Orange + Lime
  { primary: "#3b82f6", secondary: "#f97316", tertiary: "#a3e635", text: "#fff", textSecondary: "#000" },
  // 2 — Hot Purple + Cyan + Yellow
  { primary: "#a855f7", secondary: "#06b6d4", tertiary: "#facc15", text: "#fff", textSecondary: "#000" },
  // 3 — Coral Red + Teal + White
  { primary: "#ef4444", secondary: "#14b8a6", tertiary: "#f8fafc", text: "#fff", textSecondary: "#000" },
  // 4 — Emerald + Indigo + Amber
  { primary: "#10b981", secondary: "#6366f1", tertiary: "#f59e0b", text: "#000", textSecondary: "#fff" },
  // 5 — Rose + Sky + Lime
  { primary: "#f43f5e", secondary: "#0ea5e9", tertiary: "#84cc16", text: "#fff", textSecondary: "#000" },
  // 6 — Neon Green + Hot Pink + White
  { primary: "#22c55e", secondary: "#ec4899", tertiary: "#ffffff", text: "#000", textSecondary: "#000" },
  // 7 — Violet + Tangerine + Aqua
  { primary: "#7c3aed", secondary: "#fb923c", tertiary: "#22d3ee", text: "#fff", textSecondary: "#000" },
];

const ROOM_FALLBACKS: Record<string, string[]> = {
  "living room": [
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1080&auto=format&fit=crop", // Stylish neutral sofa
    "https://images.unsplash.com/photo-1583847268964-b28ce8faba0f?q=80&w=1080&auto=format&fit=crop", // Warm modern living room
    "https://images.unsplash.com/photo-1593696140826-c58b021acf8b?q=80&w=1080&auto=format&fit=crop", // Clean light living space
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1080&auto=format&fit=crop", // Aesthetic beige boho
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1080&auto=format&fit=crop", // Modern minimalist interior
  ],
  "bedroom": [
    "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=1080&auto=format&fit=crop", // Moody minimalist bedroom
    "https://images.unsplash.com/photo-1505693314120-0d443867891c?q=80&w=1080&auto=format&fit=crop", // Cozy warm bed
    "https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=1080&auto=format&fit=crop", // Bright airy bedroom
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1080&auto=format&fit=crop", // Chic bedroom interior
  ],
  "kitchen": [
    "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=1080&auto=format&fit=crop", // Clean white kitchen
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1080&auto=format&fit=crop", // Modern dark kitchen
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1080&auto=format&fit=crop", // Minimalist scandinavian kitchen
  ],
  "bathroom": [
    "https://images.unsplash.com/photo-1620626011761-996317b8d101?q=80&w=1080&auto=format&fit=crop", // Modern spa bathroom
    "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?q=80&w=1080&auto=format&fit=crop", // Aesthetic neutral bath
    "https://images.unsplash.com/photo-1604709177595-ee9c2580e9a3?q=80&w=1080&auto=format&fit=crop", // Luxury marble bathroom
  ],
  "office": [
    "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=1080&auto=format&fit=crop", // Aesthetic desk setup
    "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1080&auto=format&fit=crop", // Bright clean office workspace
  ]
};

const DEFAULT_FALLBACKS = ROOM_FALLBACKS["living room"];

function KenBurnsBackground({ roomImageUrl, seed, roomType }: { roomImageUrl?: string; seed: number; roomType: string }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const scale = interpolate(frame, [0, durationInFrames], [1, 1.15], {
    extrapolateRight: "clamp",
  });

  const normalizedType = roomType.toLowerCase().trim();
  const pool = Object.entries(ROOM_FALLBACKS).find(([key]) => normalizedType.includes(key))?.[1] || DEFAULT_FALLBACKS;

  const resolvedUrl = roomImageUrl || pool[seed % pool.length];

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={resolvedUrl}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.85) 100%)",
        }}
      />
    </AbsoluteFill>
  );
}

function IntroSlide({
  items,
  roomType,
  budgetPhrase,
  reelType = "upgrade",
  theme,
  palette,
}: {
  items: Item[];
  roomType: string;
  budgetPhrase: string;
  reelType?: "create" | "upgrade";
  theme?: string;
  palette: ReelPalette;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isCreateReel = reelType === "create";
  const upgradeHookPrice = getUpgradeHookPrice(items);

  const titleSpring = spring({ frame, fps, config: { damping: 10, mass: 1, stiffness: 200 } });
  const themeSpring = spring({ frame: frame - 4, fps, config: { damping: 10, mass: 1, stiffness: 200 } });
  const subtitleSpring = spring({
    frame: frame - 10,
    fps,
    config: { damping: 10, mass: 1, stiffness: 200 },
  });

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", padding: 60 }}
    >
      <div
        style={{
          transform: `scale(${titleSpring})`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: isCreateReel ? 88 : 66,
            fontWeight: 900,
            textTransform: isCreateReel ? "uppercase" : undefined,
            color: palette.primary,
            textShadow: "6px 6px 0px #000",
            lineHeight: 1.1,
            letterSpacing: "-0.02em"
          }}
        >
          {isCreateReel
            ? <>{`Let's Build a`}{"\n"}{roomType}</>
            : <>Upgrade your{"\n"}{roomType.toLowerCase()}{"\n"}with these finds</>}
        </div>
      </div>

      {isCreateReel && theme && (
        <div
          style={{
            transform: `scale(${themeSpring}) rotate(2deg)`,
            marginTop: 20,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: 900,
              textTransform: "uppercase",
              color: palette.textSecondary,
              background: palette.tertiary,
              padding: "10px 32px",
              borderRadius: 100,
              border: "6px solid black",
              boxShadow: "6px 6px 0px #000",
              letterSpacing: "-0.02em"
            }}
          >
            {theme} Vibe
          </div>
        </div>
      )}

      <div
        style={{
          transform: `scale(${subtitleSpring}) rotate(-2deg)`,
          marginTop: 40,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 58,
            fontWeight: 900,
            textTransform: isCreateReel ? "uppercase" : undefined,
            color: palette.textSecondary,
            background: palette.secondary,
            padding: "16px 48px",
            borderRadius: 16,
            border: "6px solid black",
            boxShadow: "8px 8px 0px #000",
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
          }}
        >
          {isCreateReel
            ? budgetPhrase
            : <>that cost ${upgradeHookPrice}{"\n"}and under</>}
        </div>
      </div>
    </AbsoluteFill>
  );
}



function ProductSlide({ item, palette }: { item: Item; index: number; palette: ReelPalette }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideIn = spring({ frame, fps, config: { damping: 10, mass: 1, stiffness: 220 } });
  const priceSpring = spring({
    frame: frame - 10,
    fps,
    config: { damping: 10, mass: 1, stiffness: 250 },
  });

  const src = item.imageUrl || null;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {src && (
        <div
          style={{
            position: "relative",
            transform: `scale(${slideIn}) rotate(-3deg)`,
            width: "82%",
            height: "56%",
            marginBottom: 40,
          }}
        >
          <Img
            src={src}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: 24,
              border: "12px solid white",
              boxShadow: "16px 16px 0px rgba(0,0,0,0.9)",
            }}
          />

          {/* Price badge */}
          <div
            style={{
              position: "absolute",
              bottom: -20,
              right: -30,
              transform: `scale(${priceSpring}) rotate(6deg)`,
              fontSize: 64,
              fontWeight: 900,
              color: palette.textSecondary,
              background: palette.tertiary,
              padding: "16px 36px",
              borderRadius: 12,
              border: "6px solid black",
              boxShadow: "8px 8px 0px #000",
              letterSpacing: "-0.04em",
              zIndex: 10
            }}
          >
            ${Math.round(item.amount)}
          </div>
        </div>
      )}

      <div
        style={{
          transform: `translateY(${interpolate(slideIn, [0, 1], [40, 0])}px)`,
          opacity: Math.min(1, frame / 10), // Quick fade to avoid jitter
          textAlign: "center",
          maxWidth: 900,
          padding: "0 40px",
          marginTop: 20
        }}
      >
        <div
          style={{
            fontSize: 54,
            fontWeight: 900,
            color: "white",
            textTransform: "uppercase",
            textShadow: "0 8px 24px rgba(0,0,0,0.8), 4px 4px 0px #000", // Pop shadow
            lineHeight: 1.15,
            letterSpacing: "-0.02em"
          }}
        >
          {item.title}
        </div>
      </div>
    </AbsoluteFill>
  );
}

function CTASlide({
  roomType,
  budgetPhrase,
  reelType = "upgrade",
  delays,
  palette,
}: {
  roomType: string;
  budgetPhrase: string;
  reelType?: "create" | "upgrade";
  delays?: { commentDelay: number; followDelay: number };
  palette: ReelPalette;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const showBudgetStage = reelType === "create";
  const budgetLabel = reelType === "create" ? "Design Total" : "Total Upgrade";

  // Stage 1: "Total upgrade for under $X" (0.0s)
  const pop1 = spring({ frame, fps, config: { damping: 12, mass: 1, stiffness: 200 } });

  // Stage 2: NLP Synced! "Comment [roomType]" (Variable Audio Bound)
  const p2Start = delays
    ? Math.round(delays.commentDelay * fps)
    : Math.floor(fps * (showBudgetStage ? 1.5 : 0.3));
  const pop2 = spring({ frame: frame - p2Start, fps, config: { damping: 10, mass: 1, stiffness: 180 } });
  const slideUp1 = showBudgetStage ? interpolate(pop2, [0, 1], [0, -220]) : 0;
  const scaleDown1 = showBudgetStage ? interpolate(pop2, [0, 1], [1, 0.8]) : 1;

  // Stage 2.5: "...Or check bio!" (Fires 0.4s after the Comment bubble)
  const pop2_5 = spring({ frame: frame - (p2Start + 12), fps, config: { damping: 12, mass: 1, stiffness: 220 } });

  // Stage 3: NLP Synced! "Follow @hackmyapartment" (Variable Audio Bound)
  const p3Start = delays
    ? Math.round(delays.followDelay * fps)
    : Math.floor(fps * (showBudgetStage ? 3.2 : 1.9));
  const pop3 = spring({ frame: frame - p3Start, fps, config: { damping: 10, mass: 1, stiffness: 250 } });
  const slideUp2 = interpolate(pop3, [0, 1], [0, -140]); // Pushes everything up further

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>

      {/* Container that shifts up as new elements arrive */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: showBudgetStage ? 40 : 28,
          transform: `translateY(${slideUp1 + slideUp2}px)`,
        }}
      >
        {showBudgetStage && (
          <div style={{ transform: `scale(${pop1 * scaleDown1})`, textAlign: "center" }}>
            <div
              style={{
                fontSize: 64,
                fontWeight: 900,
                textTransform: "uppercase",
                color: palette.text,
                background: palette.primary,
                padding: "16px 40px",
                borderRadius: 100,
                display: "inline-block",
                boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                marginBottom: 20,
                letterSpacing: "-0.02em"
              }}
            >
              {budgetLabel}
            </div>
            <br />
            <div
              style={{
                fontSize: 88,
                fontWeight: 900,
                textTransform: "uppercase",
                color: palette.secondary,
                textShadow: "8px 8px 0px #000",
                letterSpacing: "-0.03em",
                lineHeight: 1
              }}
            >
              {budgetPhrase}
            </div>
          </div>
        )}

        {/* Stage 2: Comment Bubble */}
        <div
          style={{
            transform: `scale(${pop2}) rotate(-2deg)`,
            textAlign: "center",
            opacity: frame >= p2Start ? 1 : 0
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: palette.textSecondary,
              background: palette.tertiary,
              padding: "32px 56px",
              borderRadius: 40,
              border: "8px solid black",
              boxShadow: "12px 12px 0px rgba(0,0,0,0.9)",
              lineHeight: 1.15,
              position: "relative"
            }}
          >
            Comment{" "}
            <span style={{ color: palette.secondary, textShadow: "4px 4px 0px #000" }}>
              {`"${roomType.toUpperCase()}"`}
            </span>
            <br />
            For Product Links!

            {/* Little chat bubble tail */}
            <div
              style={{
                position: "absolute",
                bottom: -24,
                left: "calc(50% - 20px)",
                width: 40,
                height: 40,
                background: palette.tertiary,
                borderBottom: "8px solid black",
                borderRight: "8px solid black",
                transform: "rotate(45deg)",
                zIndex: -1
              }}
            />
          </div>
        </div>

        {/* Stage 2.5: Or Check Bio */}
        <div
          style={{
            transform: `scale(${pop2_5}) rotate(2deg)`,
            opacity: frame >= p2Start + 12 ? 1 : 0,
            marginTop: -10
          }}
        >
          <div
            style={{
              fontSize: 36,
              fontWeight: 900,
              color: palette.text,
              background: palette.primary,
              padding: "16px 40px",
              borderRadius: 100,
              border: "6px solid black",
              boxShadow: "8px 8px 0px rgba(0,0,0,1)",
              display: "inline-block",
            }}
          >
            ...Or Check The Bio! 🔗
          </div>
        </div>

        {/* Stage 3: Follow Button */}
        <div
          style={{
            transform: `scale(${pop3}) rotate(-3deg)`,
            opacity: frame >= p3Start ? 1 : 0,
            marginTop: 10
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              background: palette.secondary,
              padding: "20px 32px",
              borderRadius: 24,
              border: "6px solid black",
              boxShadow: "8px 8px 0px #000",
            }}
          >
            <div style={{ fontSize: 44, fontWeight: 900, color: palette.textSecondary }}>
              @hackmyapartment
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: "white",
                background: "black",
                padding: "10px 24px",
                borderRadius: 100,
                boxShadow: "0 8px 16px rgba(0,0,0,0.5)"
              }}
            >
              Follow!
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export function ReelComposition({
  items,
  roomType,
  budgetPhrase,
  reelType = "upgrade",
  roomImageUrl,
  audioUrl,
  timings,
  theme,
  paletteIndex = 0,
}: ReelCompositionProps) {
  const { fps } = useVideoConfig();

  const palette = PALETTES[Math.abs(Math.round(paletteIndex as number)) % PALETTES.length];

  // Inject the Outfit Google Font globally
  const googleFontsImport = (
    <style>
      {`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@800;900&display=swap');`}
    </style>
  );

  const introFrames = getIntroDurationInFrames(fps, timings);
  const ctaFrames = getCtaDurationInFrames(fps, timings);
  const productFrames = items.map((_, index) =>
    getProductDurationInFrames(items.length, index, fps, timings)
  );

  const introSlide = (
    <Sequence from={0} durationInFrames={introFrames}>
      <IntroSlide
        items={items}
        roomType={roomType}
        budgetPhrase={budgetPhrase}
        reelType={reelType}
        theme={theme}
        palette={palette}
      />
    </Sequence>
  );

  const productSlides = items.map((item, i) => {
    const itemFrames = productFrames[i];
    const itemFrom =
      introFrames +
      productFrames.slice(0, i).reduce((sum, frames) => sum + frames, 0);

    return (
      <Sequence
        key={item.id}
        from={itemFrom}
        durationInFrames={itemFrames}
      >
        <ProductSlide item={item} index={i} palette={palette} />
      </Sequence>
    );
  });

  const ctaFrom =
    introFrames + productFrames.reduce((sum, frames) => sum + frames, 0);

  const ctaSlide = (
    <Sequence
      from={ctaFrom}
      durationInFrames={ctaFrames}
    >
      <CTASlide
        roomType={roomType}
        budgetPhrase={budgetPhrase}
        reelType={reelType}
        delays={timings?.ctaStages}
        palette={palette}
      />
    </Sequence>
  );

  return (
    <AbsoluteFill style={{ fontFamily: "'Outfit', sans-serif" }}>
      {googleFontsImport}
      <KenBurnsBackground roomImageUrl={roomImageUrl} seed={items.length} roomType={roomType} />

      {/* Voiceover audio — plays at 1.5× speed, slides are scaled to match */}
      {audioUrl && <Audio src={audioUrl} playbackRate={AUDIO_PLAYBACK_RATE} />}

      {introSlide}
      {productSlides}
      {ctaSlide}
    </AbsoluteFill>
  );
}
