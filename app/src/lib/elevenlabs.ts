/**
 * ElevenLabs text-to-speech integration.
 *
 * Converts episode voiceover scripts into natural-sounding audio using
 * the ElevenLabs TTS API. The returned audio Blob can be played in the
 * browser or downloaded for use in video composition.
 */
import { DEFAULT_ELEVENLABS_VOICE_ID } from "./voice";

/**
 * Convert a script string to an audio Blob via ElevenLabs TTS.
 *
 * Voice settings use moderate stability (0.5) and high similarity boost (0.75)
 * to sound natural but consistent across episodes.
 */
function sanitizeForVoiceover(text: string): string {
  return text
    .replace(/(\d+)\s*[xX]\s*(\d+)/g, "$1 by $2")
    .replace(/(\d+)\s*"/g, "$1 inch")
    .replace(/(\d+)\s*'/g, "$1 feet")
    .replace(/\bFT\b/g, "feet")
    .replace(/\bft\b/g, "feet")
    .replace(/\bcm\b/gi, "centimeters")
    .replace(/\bmm\b/gi, "millimeters")
    .replace(/\blbs\b/gi, "pounds");
}

export async function generateAudio(
  script: string,
  apiKey: string,
  voiceId: string = DEFAULT_ELEVENLABS_VOICE_ID
): Promise<Blob> {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: sanitizeForVoiceover(script),
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`ElevenLabs API error: ${res.status} - ${error}`);
  }

  return res.blob();
}

export interface AudioTimestampData {
  audio_base64: string;
  alignment: {
    characters: string[];
    character_start_times_seconds: number[];
    character_end_times_seconds: number[];
  };
}

/**
 * Advanced endpoint that simultaneously generates audio and returns millisecond timestamps
 * for every single character spoken to enable perfect audio-visual synchronization!
 */
export async function generateAudioWithTimestamps(
  script: string,
  apiKey: string,
  voiceId: string = DEFAULT_ELEVENLABS_VOICE_ID
): Promise<AudioTimestampData> {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: sanitizeForVoiceover(script),
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`ElevenLabs API error: ${res.status} - ${error}`);
  }

  return res.json() as Promise<AudioTimestampData>;
}

/** Retrieve the list of available voices for the authenticated account. */
export async function fetchVoices(
  apiKey: string
): Promise<{ voice_id: string; name: string }[]> {
  const res = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": apiKey },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch voices: ${res.status}`);
  }

  const data = await res.json();
  return data.voices.map((v: { voice_id: string; name: string }) => ({
    voice_id: v.voice_id,
    name: v.name,
  }));
}
