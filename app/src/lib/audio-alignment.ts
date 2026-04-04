interface AlignmentData {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

export interface AudioTimingMapping {
  introSeconds: number;
  itemSeconds: number[];
  ctaSeconds: number;
  ctaStages?: {
    commentDelay: number;
    followDelay: number;
  };
}

/**
 * Algorithmically maps abstract visual components (Intro, Items, Outro) 
 * to absolute audio millisecond timestamps.
 * 
 * Works by detecting logical layout boundaries (`\n`) within the ElevenLabs
 * character array to pinpoint exactly when the AI transitions between segments.
 */
export function calculateSegmentTimings(
  alignment: AlignmentData | null,
  expectedItemCount: number,
  fallbackTotalSeconds: number = 20
): AudioTimingMapping {
  // If no alignment data is available, fallback to a mathematical distribution
  if (!alignment || !alignment.characters || alignment.characters.length === 0) {
    const defaultIntro = 4;
    const defaultCta = 4;
    const remaining = Math.max(3, fallbackTotalSeconds - defaultIntro - defaultCta);
    const perItem = Math.max(3, remaining / Math.max(1, expectedItemCount));
    return {
      introSeconds: defaultIntro,
      itemSeconds: Array(expectedItemCount).fill(perItem),
      ctaSeconds: defaultCta,
    };
  }

  const { characters, character_start_times_seconds, character_end_times_seconds } = alignment;
  const totalDuration = character_end_times_seconds[character_end_times_seconds.length - 1] || fallbackTotalSeconds;

  const boundaryTimestamps: number[] = [];
  let isNewline = false;

  // Scan the character offsets to find explicit line breaks (`\n`)
  for (let i = 0; i < characters.length; i++) {
    if (characters[i] === "\n") {
      if (!isNewline) {
        // We've hit a boundary block. Record the absolute start time.
        boundaryTimestamps.push(character_start_times_seconds[i]);
        isNewline = true;
      }
    } else {
      isNewline = false;
    }
  }

  // Calculate the delta (duration) between each boundary
  const durationsSecs: number[] = [];
  let lastMarker = 0;
  for (const stamp of boundaryTimestamps) {
    durationsSecs.push(stamp - lastMarker);
    lastMarker = stamp;
  }
  // The final block runs from the last boundary to the end of the audio file
  durationsSecs.push(totalDuration - lastMarker);

  // If the AI heavily hallucinated or merged paragraphs, fallback to safety math
  if (durationsSecs.length < 3) {
    return calculateSegmentTimings(null, expectedItemCount, totalDuration);
  }

  // First block is always Intro
  const introSeconds = durationsSecs[0];
  // Last block is always CTA
  const ctaSeconds = durationsSecs[durationsSecs.length - 1];
  // Middle blocks are Items
  let itemSeconds = durationsSecs.slice(1, -1);

  // If the AI perfectly mapped items, itemSeconds.length === expectedItemCount.
  // If it merged some items together or hallucinated extra breaks, we distribute the time
  // proportionately to guarantee synchronization.
  if (itemSeconds.length !== expectedItemCount && expectedItemCount > 0) {
    const totalItemsTime = itemSeconds.reduce((a, b) => a + b, 0);
    const averagedTime = totalItemsTime / expectedItemCount;
    itemSeconds = Array(expectedItemCount).fill(averagedTime);
  }

  // Calculate Sub-Sentence offsets using the raw text array!
  const ctaStartAt = lastMarker;
  const joinedText = characters.join("").toLowerCase();
  
  // Find the exact character offset where the AI starts pronouncing these key action words!
  const commentIdx = joinedText.lastIndexOf("comment");
  const followIdx = joinedText.lastIndexOf("follow");

  // Approximate default offsets just in case the AI spelled them differently
  let commentSeconds = 1.6;
  let followSeconds = 3.2;

  if (commentIdx !== -1 && character_start_times_seconds[commentIdx]) {
     commentSeconds = character_start_times_seconds[commentIdx] - ctaStartAt;
  }
  
  if (followIdx !== -1 && character_start_times_seconds[followIdx]) {
     followSeconds = character_start_times_seconds[followIdx] - ctaStartAt;
  }

  // Clamp limits to prevent physics engine bugs if the audio tracks are malformed
  commentSeconds = Math.max(0.5, Math.min(commentSeconds, ctaSeconds - 1));
  followSeconds = Math.max(commentSeconds + 0.5, Math.min(followSeconds, ctaSeconds - 0.5));

  return {
    introSeconds,
    itemSeconds,
    ctaSeconds,
    ctaStages: {
      commentDelay: commentSeconds,
      followDelay: followSeconds
    }
  };
}
