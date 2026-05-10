/**
 * Viral hook sentences for the IntroSlide.
 *
 * Each hook is a function that receives `roomType` and `budgetPhrase` so it
 * can be personalised. The `hookIndex` prop on ReelCompositionProps selects
 * which one to use; it cycles modulo the array length so any integer works.
 *
 * Hooks are inspired by proven TikTok / Reels opener formulas and adapted for
 * the @hackmyapartment apartment-upgrade context.
 */

export interface HookStrings {
  /** Large headline shown on the IntroSlide (can include "\n" for line breaks). */
  headline: string;
  /** Smaller sub-line / pill shown below the headline. */
  subline: string;
  /** Opening sentence used in the AI voiceover script (plain text, no "\n"). */
  voiceIntro: string;
}

export type HookFn = (roomType: string, budgetPhrase: string, upgradePrice: number) => HookStrings;

export const VIDEO_HOOKS: HookFn[] = [
  // 0 — "Did anyone else notice that..."
  (roomType, budgetPhrase) => ({
    headline: `Did anyone else\nnotice that…`,
    subline: `your ${roomType.toLowerCase()} could look this good?`,
    voiceIntro: `Did anyone else notice that your ${roomType.toLowerCase()} could look this good for ${budgetPhrase}?`,
  }),

  // 1 — "This is crazy, but…"
  (roomType, budgetPhrase) => ({
    headline: `This is crazy,\nbut…`,
    subline: `you can upgrade your ${roomType.toLowerCase()} for ${budgetPhrase}`,
    voiceIntro: `This is crazy, but you can completely upgrade your ${roomType.toLowerCase()} for ${budgetPhrase}.`,
  }),

  // 2 — "It can't just be me who…"
  (roomType) => ({
    headline: `It can't just be\nme who…`,
    subline: `wants a better ${roomType.toLowerCase()} without breaking the bank`,
    voiceIntro: `It can't just be me who wants a beautiful ${roomType.toLowerCase()} without spending a fortune.`,
  }),

  // 3 — "The simple rule that changed how I…"
  (roomType, budgetPhrase) => ({
    headline: `The simple rule that\nchanged how I…`,
    subline: `decorated my ${roomType.toLowerCase()} for ${budgetPhrase}`,
    voiceIntro: `The simple rule that changed how I decorated my ${roomType.toLowerCase()} — and it only cost ${budgetPhrase}.`,
  }),

  // 4 — "X has changed everything for me"
  (roomType) => ({
    headline: `These finds changed\neverything for me`,
    subline: `${roomType} upgrade incoming 👇`,
    voiceIntro: `These finds have completely changed my ${roomType.toLowerCase()}. Here's what I used.`,
  }),

  // 5 — "Advice for people who…"
  (roomType, budgetPhrase) => ({
    headline: `Advice for people\nwho…`,
    subline: `want a dream ${roomType.toLowerCase()} for ${budgetPhrase}`,
    voiceIntro: `Advice for people who want a gorgeous ${roomType.toLowerCase()} on a budget — here's everything you need for ${budgetPhrase}.`,
  }),

  // 6 — "X need to know this!"
  (roomType) => ({
    headline: `${roomType} lovers\nneed to know this!`,
    subline: `budget upgrade that actually slaps`,
    voiceIntro: `${roomType} lovers need to know this. Here are the finds that transformed my space.`,
  }),

  // 7 — "This is BY FAR the best way to…"
  (roomType, budgetPhrase) => ({
    headline: `This is BY FAR the\nbest way to…`,
    subline: `upgrade your ${roomType.toLowerCase()} for ${budgetPhrase}`,
    voiceIntro: `This is by far the best way to upgrade your ${roomType.toLowerCase()} without spending a lot. Total? ${budgetPhrase}.`,
  }),

  // 8 — "This is how we're going to…"
  (roomType, budgetPhrase) => ({
    headline: `This is how we're\ngoing to…`,
    subline: `transform your ${roomType.toLowerCase()} for ${budgetPhrase}`,
    voiceIntro: `This is how we're going to transform your ${roomType.toLowerCase()} for ${budgetPhrase}.`,
  }),

  // 9 — "This is a tricky subject, but…"
  (roomType) => ({
    headline: `This is a tricky\nsubject, but…`,
    subline: `decorating your ${roomType.toLowerCase()} doesn't have to be hard`,
    voiceIntro: `This is a tricky subject, but decorating your ${roomType.toLowerCase()} doesn't have to be hard or expensive.`,
  }),

  // 10 — "If you don't like X, try this instead…"
  (roomType, budgetPhrase) => ({
    headline: `If you don't like\nyour ${roomType}…`,
    subline: `try these finds instead ✨`,
    voiceIntro: `If you don't like your ${roomType.toLowerCase()} right now, try these finds instead. All for ${budgetPhrase}.`,
  }),

  // 11 — "Can we please stop doing X"
  (roomType) => ({
    headline: `Can we please stop\noverpaying for…`,
    subline: `${roomType.toLowerCase()} decor — here's the budget hack`,
    voiceIntro: `Can we please stop overpaying for ${roomType.toLowerCase()} decor? Here are the budget finds that actually work.`,
  }),
];

/**
 * Returns the hook strings for a given index (cycles through the array).
 */
export function getHook(
  index: number,
  roomType: string,
  budgetPhrase: string,
  upgradePrice: number
): HookStrings {
  const fn = VIDEO_HOOKS[Math.abs(Math.round(index)) % VIDEO_HOOKS.length];
  return fn(roomType, budgetPhrase, upgradePrice);
}
