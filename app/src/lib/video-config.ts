/**
 * Video composition constants and timing calculations.
 *
 * Defines the dimensions, frame rate, and segment durations used when
 * rendering an Instagram Reel. The video structure is:
 *   [Intro] -> [Item 1] -> [Item 2] -> ... -> [Item N] -> [CTA]
 *
 * Total duration is capped at 60 seconds to fit an Instagram Reel.
 */

import type { AudioTimingMapping } from "./audio-alignment";

// Instagram Reel dimensions (9:16 portrait) and frame rate.
export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;
export const VIDEO_FPS = 30;
export const AUDIO_PLAYBACK_RATE = 1.2;

// Fixed segment durations in seconds.
export const CTA_DURATION_SECONDS = 4;
export const INTRO_DURATION_SECONDS = 3;

// Total reel cap.
export const MAX_REEL_SECONDS = 60;

/**
 * Dynamically compute seconds per item so the full reel stays ≤ 60s.
 * Remaining time after intro + CTA is divided equally among items.
 * Clamped between 3s minimum and 8s maximum per item.
 */
export function getSecondsPerItem(itemCount: number): number {
  if (itemCount === 0) return 5;
  const available = MAX_REEL_SECONDS - INTRO_DURATION_SECONDS - CTA_DURATION_SECONDS;
  const perItem = available / itemCount;
  return Math.min(8, Math.max(3, perItem));
}

/** Calculate the total video duration in frames for a given number of items. */
export function calculateDuration(itemCount: number): number {
  const totalSeconds =
    INTRO_DURATION_SECONDS +
    itemCount * getSecondsPerItem(itemCount) +
    CTA_DURATION_SECONDS;
  // Hard cap at 60s
  return Math.min(totalSeconds, MAX_REEL_SECONDS) * VIDEO_FPS;
}

function getAdjustedFrames(seconds: number, fps: number): number {
  return Math.max(1, Math.round((seconds / AUDIO_PLAYBACK_RATE) * fps));
}

export function getIntroDurationInFrames(
  fps: number,
  timings?: AudioTimingMapping | null
): number {
  return getAdjustedFrames(timings?.introSeconds ?? INTRO_DURATION_SECONDS, fps);
}

export function getProductDurationInFrames(
  itemCount: number,
  index: number,
  fps: number,
  timings?: AudioTimingMapping | null
): number {
  const seconds = timings?.itemSeconds[index] ?? getSecondsPerItem(itemCount);
  return getAdjustedFrames(seconds, fps);
}

export function getCtaDurationInFrames(
  fps: number,
  timings?: AudioTimingMapping | null
): number {
  const timedCtaFrames = getAdjustedFrames(
    timings?.ctaSeconds ?? CTA_DURATION_SECONDS,
    fps
  );

  const followHoldFrames = timings?.ctaStages
    ? getAdjustedFrames(timings.ctaStages.followDelay + 1.5, fps)
    : 0;

  const defaultFrames = getAdjustedFrames(CTA_DURATION_SECONDS, fps);

  return Math.max(defaultFrames, timedCtaFrames, followHoldFrames);
}

export function getReelDurationInFrames(
  itemCount: number,
  fps: number,
  timings?: AudioTimingMapping | null
): number {
  const introFrames = getIntroDurationInFrames(fps, timings);
  const productFrames = Array.from({ length: itemCount }, (_, index) =>
    getProductDurationInFrames(itemCount, index, fps, timings)
  );
  const ctaFrames = getCtaDurationInFrames(fps, timings);

  return introFrames + productFrames.reduce((sum, frames) => sum + frames, 0) + ctaFrames;
}
