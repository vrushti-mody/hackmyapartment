const ROOM_FALLBACK_IMAGES: Record<string, string[]> = {
  "living room": [
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1583847268964-b28ce8faba0f?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1593696140826-c58b021acf8b?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1080&auto=format&fit=crop",
  ],
  bedroom: [
    "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1505693314120-0d443867891c?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1080&auto=format&fit=crop",
  ],
  kitchen: [
    "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1080&auto=format&fit=crop",
  ],
  bathroom: [
    "https://images.unsplash.com/photo-1620626011761-996317b8d101?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1604709177595-ee9c2580e9a3?q=80&w=1080&auto=format&fit=crop",
  ],
  office: [
    "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1080&auto=format&fit=crop",
  ],
  outdoor: [
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1460317442991-0ec209397118?q=80&w=1080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1080&auto=format&fit=crop",
  ],
};

const DEFAULT_ROOM_KEY = "living room";

function normalizeRoomKey(roomType: string): string {
  const normalized = roomType.toLowerCase().trim();
  return (
    Object.keys(ROOM_FALLBACK_IMAGES).find((key) => normalized.includes(key)) ||
    DEFAULT_ROOM_KEY
  );
}

function hashSeed(seed: string): number {
  return seed.split("").reduce((hash, char) => hash * 31 + char.charCodeAt(0), 7);
}

export function getRoomFallbackImages(roomType: string): string[] {
  return ROOM_FALLBACK_IMAGES[normalizeRoomKey(roomType)] || ROOM_FALLBACK_IMAGES[DEFAULT_ROOM_KEY];
}

export function getRoomFallbackImage(roomType: string, seed: string | number = 0): string {
  const pool = getRoomFallbackImages(roomType);
  const seedValue = typeof seed === "number" ? seed : hashSeed(seed);
  const safeIndex = Math.abs(seedValue) % pool.length;
  return pool[safeIndex];
}
