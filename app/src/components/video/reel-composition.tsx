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
  getSecondsPerItem,
  CTA_DURATION_SECONDS,
  INTRO_DURATION_SECONDS,
} from "../../lib/video-config";
import { AudioTimingMapping } from "../../lib/audio-alignment";

export interface ReelCompositionProps extends Record<string, unknown> {
  items: Item[];
  roomType: string;
  budgetPhrase: string;
  roomImageUrl?: string;
  audioUrl?: string;
  timings?: Record<string, any> | null;
}

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
  roomType,
  budgetPhrase,
}: {
  roomType: string;
  budgetPhrase: string;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Aggressive overshooting bounces
  const titleSpring = spring({ frame, fps, config: { damping: 10, mass: 1, stiffness: 200 } });
  const subtitleSpring = spring({
    frame: frame - 8,
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
            fontSize: 88,
            fontWeight: 900,
            textTransform: "uppercase",
            color: "#fbbf24", // Vibrant Yellow
            textShadow: "6px 6px 0px #000", // Hard neo-brutalist shadow
            lineHeight: 1.1,
            letterSpacing: "-0.02em"
          }}
        >
          Let's Build a{"\n"}{roomType}
        </div>
      </div>
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
            textTransform: "uppercase",
            color: "white",
            background: "#ec4899", // Pop Pink
            padding: "16px 48px",
            borderRadius: 16, // Squarer, aggressive look
            border: "6px solid black",
            boxShadow: "8px 8px 0px #000",
            letterSpacing: "-0.02em"
          }}
        >
          {budgetPhrase}
        </div>
      </div>
    </AbsoluteFill>
  );
}



function ProductSlide({ item }: { item: Item; index: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // High bounce, aggressive physics
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
            transform: `scale(${slideIn}) rotate(-3deg)`, // Dynamic scrapbooked polaroid rotation
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
              boxShadow: "16px 16px 0px rgba(0,0,0,0.9)", // Neo-brutalism shadow!
            }}
          />

          {/* Aggressive overlapping price badge pinned to the polaroid corner */}
          <div
            style={{
              position: "absolute",
              bottom: -20,
              right: -30,
              transform: `scale(${priceSpring}) rotate(6deg)`, // Opposing rotation for tension
              fontSize: 64,
              fontWeight: 900,
              color: "black",
              background: "#34d399", // Neon Mint
              padding: "16px 36px",
              borderRadius: 12,
              border: "6px solid black",
              boxShadow: "8px 8px 0px #000",
              letterSpacing: "-0.04em",
              zIndex: 10
            }}
          >
            ${item.amount.toFixed(2)}
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
  delays,
}: {
  roomType: string;
  budgetPhrase: string;
  delays?: { commentDelay: number; followDelay: number };
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Stage 1: "Total upgrade for under $X" (0.0s)
  const pop1 = spring({ frame, fps, config: { damping: 12, mass: 1, stiffness: 200 } });

  // Stage 2: NLP Synced! "Comment [roomType]" (Variable Audio Bound)
  const p2Start = delays ? Math.round(delays.commentDelay * fps) : Math.floor(fps * 1.5);
  const pop2 = spring({ frame: frame - p2Start, fps, config: { damping: 10, mass: 1, stiffness: 180 } });
  const slideUp1 = interpolate(pop2, [0, 1], [0, -220]); // Pushes Stage 1 up
  const scaleDown1 = interpolate(pop2, [0, 1], [1, 0.8]);

  // Stage 2.5: "...Or check bio!" (Fires 0.4s after the Comment bubble)
  const pop2_5 = spring({ frame: frame - (p2Start + 12), fps, config: { damping: 12, mass: 1, stiffness: 220 } });

  // Stage 3: NLP Synced! "Follow @hackmyapartment" (Variable Audio Bound)
  const p3Start = delays ? Math.round(delays.followDelay * fps) : Math.floor(fps * 3.2);
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
          gap: 40,
          transform: `translateY(${slideUp1 + slideUp2}px)`,
        }}
      >
        {/* Stage 1: Budget Hook */}
        <div style={{ transform: `scale(${pop1 * scaleDown1})`, textAlign: "center" }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              textTransform: "uppercase",
              color: "black",
              background: "white",
              padding: "16px 40px",
              borderRadius: 100,
              display: "inline-block",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              marginBottom: 20,
              letterSpacing: "-0.02em"
            }}
          >
            Total Upgrade
          </div>
          <br />
          <div
            style={{
              fontSize: 88,
              fontWeight: 900,
              textTransform: "uppercase",
              color: "#fbbf24", // Vibrant Yellow
              textShadow: "8px 8px 0px #000",
              letterSpacing: "-0.03em",
              lineHeight: 1
            }}
          >
            {budgetPhrase}
          </div>
        </div>

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
              color: "black",
              background: "#34d399", // Neon Mint
              padding: "32px 56px",
              borderRadius: 40,
              border: "8px solid black",
              boxShadow: "12px 12px 0px rgba(0,0,0,0.9)",
              lineHeight: 1.15,
              position: "relative"
            }}
          >
            Comment{" "}
            <span style={{ color: "white", textShadow: "4px 4px 0px #000" }}>
              "{roomType.toUpperCase()}"
            </span>
            <br />
            For Product Links!

            {/* Little chat bubble tail centered! */}
            <div
              style={{
                position: "absolute",
                bottom: -24,
                left: "calc(50% - 20px)",
                width: 40,
                height: 40,
                background: "#34d399",
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
              color: "black",
              background: "#fbbf24", // Yellow accent pill
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
              background: "#ec4899",
              padding: "20px 32px",
              borderRadius: 24,
              border: "6px solid black",
              boxShadow: "8px 8px 0px #000",
            }}
          >
            <div style={{ fontSize: 44, fontWeight: 900, color: "white" }}>
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
  roomImageUrl,
  audioUrl,
  timings,
}: ReelCompositionProps) {
  const { fps } = useVideoConfig();

  // Inject the loud Outift Google Font globally via CSS!
  const googleFontsImport = (
    <style>
      {`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@800;900&display=swap');`}
    </style>
  );

  // Use dynamic alignment from ElevenLabs. Fallback mathematically if raw unaligned script.
  const introFrames = timings ? Math.round(timings.introSeconds * fps) : INTRO_DURATION_SECONDS * fps;
  const ctaFrames = timings ? Math.round(timings.ctaSeconds * fps) : CTA_DURATION_SECONDS * fps;
  const fallbackItemFrames = Math.round(getSecondsPerItem(items.length) * fps);

  let currentFrame = 0;

  const introSlide = (
    <Sequence from={currentFrame} durationInFrames={introFrames}>
      <IntroSlide roomType={roomType} budgetPhrase={budgetPhrase} />
    </Sequence>
  );
  currentFrame += introFrames;

  const productSlides = items.map((item, i) => {
    const itemFrames = timings?.itemSeconds[i] ? Math.round(timings.itemSeconds[i] * fps) : fallbackItemFrames;
    const slide = (
      <Sequence
        key={item.id}
        from={currentFrame}
        durationInFrames={itemFrames}
      >
        <ProductSlide item={item} index={i} />
      </Sequence>
    );
    currentFrame += itemFrames;
    return slide;
  });

  const ctaSlide = (
    <Sequence
      from={currentFrame}
      durationInFrames={ctaFrames}
    >
      <CTASlide roomType={roomType} budgetPhrase={budgetPhrase} delays={timings?.ctaStages} />
    </Sequence>
  );

  return (
    <AbsoluteFill style={{ fontFamily: "'Outfit', sans-serif" }}>
      {googleFontsImport}
      <KenBurnsBackground roomImageUrl={roomImageUrl} seed={items.length} roomType={roomType} />

      {/* Voiceover audio perfectly tracked across entire reel */}
      {audioUrl && <Audio src={audioUrl} />}

      {introSlide}
      {productSlides}
      {ctaSlide}
    </AbsoluteFill>
  );
}
