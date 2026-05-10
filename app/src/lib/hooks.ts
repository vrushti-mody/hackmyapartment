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

export type HookFn = (
  roomType: string,
  budgetPhrase: string,
  upgradePrice: number,
  reelType?: "create" | "upgrade",
  theme?: string
) => HookStrings;

export const VIDEO_HOOKS: HookFn[] = [
  // 0 — "Did anyone else notice that..."
  (roomType, budgetPhrase, upgradePrice, reelType, theme) => {
    const action = reelType === "create" ? "build" : "upgrade";
    return {
      headline: `Did anyone else\nnotice that…`,
      subline: `you can ${action} a ${roomType.toLowerCase()} for ${budgetPhrase}?`,
      voiceIntro: `Did anyone else notice that you can ${action} a ${theme ? theme.toLowerCase() + " " : ""}${roomType.toLowerCase()} for ${budgetPhrase}?`,
    };
  },

  // 1 — "This is crazy, but…"
  (roomType, budgetPhrase, upgradePrice, reelType, theme) => {
    const action = reelType === "create" ? "build a" : "upgrade your";
    return {
      headline: `This is crazy,\nbut…`,
      subline: `you can ${action} ${roomType.toLowerCase()} for ${budgetPhrase}`,
      voiceIntro: `This is crazy, but you can completely ${action} ${theme ? theme.toLowerCase() + " " : ""}${roomType.toLowerCase()} for ${budgetPhrase}.`,
    };
  },

  // 2 — "It can't just be me who…"
  (roomType, budgetPhrase, upgradePrice, reelType, theme) => ({
    headline: `It can't just be\nme who…`,
    subline: `wants a better ${roomType.toLowerCase()} without breaking the bank`,
    voiceIntro: `It can't just be me who wants a beautiful ${theme ? theme.toLowerCase() + " " : ""}${roomType.toLowerCase()} without spending a fortune.`,
  }),

  // 3 — "The simple rule that changed how I…"
  (roomType, budgetPhrase, upgradePrice, reelType, theme) => {
    const action = reelType === "create" ? "designed" : "decorated";
    return {
      headline: `The simple rule that\nchanged how I…`,
      subline: `${action} my ${roomType.toLowerCase()} for ${budgetPhrase}`,
      voiceIntro: `The simple rule that changed how I ${action} my ${theme ? theme.toLowerCase() + " " : ""}${roomType.toLowerCase()} — and it only cost ${budgetPhrase}.`,
    };
  },

  // 4 — "X has changed everything for me"
  (roomType, budgetPhrase, upgradePrice, reelType, theme) => ({
    headline: `These finds changed\neverything for me`,
    subline: `${roomType} ${reelType === "create" ? "build" : "upgrade"} incoming 👇`,
    voiceIntro: `These finds have completely changed my ${theme ? theme.toLowerCase() + " " : ""}${roomType.toLowerCase()}. Here's what I used.`,
  }),

  // 5 — "Advice for people who…"
  (roomType, budgetPhrase, upgradePrice, reelType, theme) => ({
    headline: `Advice for people\nwho…`,
    subline: `want a dream ${roomType.toLowerCase()} for ${budgetPhrase}`,
    voiceIntro: `Advice for people who want a gorgeous ${theme ? theme.toLowerCase() + " " : ""}${roomType.toLowerCase()} on a budget — here's everything you need for ${budgetPhrase}.`,
  }),

  // 6 — "X need to know this!"
  (roomType, budgetPhrase, upgradePrice, reelType, theme) => ({
    headline: `${roomType} lovers\nneed to know this!`,
    subline: `budget ${reelType === "create" ? "build" : "upgrade"} that actually slaps`,
    voiceIntro: `${roomType} lovers need to know this. Here are the budget finds that made this ${theme ? theme.toLowerCase() + " " : ""}${roomType.toLowerCase()} possible.`,
  }),

  // 7 — "This is BY FAR the best way to…"
  (roomType, budgetPhrase, upgradePrice, reelType, theme) => {
    const action = reelType === "create" ? "build a" : "upgrade your";
    return {
      headline: `This is BY FAR the\nbest way to…`,
      subline: `${action} ${roomType.toLowerCase()} for ${budgetPhrase}`,
      voiceIntro: `This is by far the best way to ${action} ${theme ? theme.toLowerCase() + " " : ""}${roomType.toLowerCase()} without spending a lot. Total? ${budgetPhrase}.`,
    };
  },

  // 8 — "This is how we're going to…"
  (roomType, budgetPhrase, upgradePrice, reelType, theme) => {
    const action = reelType === "create" ? "build a" : "transform your";
    return {
      headline: `This is how we're\ngoing to…`,
      subline: `${action} ${roomType.toLowerCase()} for ${budgetPhrase}`,
      voiceIntro: `This is how we're going to ${action} ${theme ? theme.toLowerCase() + " " : ""}${roomType.toLowerCase()} for ${budgetPhrase}.`,
    };
  },

  // 9 — "This is a tricky subject, but…"
  (roomType, budgetPhrase, upgradePrice, reelType, theme) => {
    const action = reelType === "create" ? "designing a" : "decorating your";
    return {
      headline: `This is a tricky\nsubject, but…`,
      subline: `${action} ${roomType.toLowerCase()} doesn't have to be hard`,
      voiceIntro: `This is a tricky subject, but ${action} ${theme ? theme.toLowerCase() + " " : ""}${roomType.toLowerCase()} doesn't have to be hard or expensive.`,
    };
  },

  // 10 — "If you don't like X, try this instead…"
  (roomType, budgetPhrase, upgradePrice, reelType, theme) => ({
    headline: `If you don't like\nyour ${roomType}…`,
    subline: `try these finds instead ✨`,
    voiceIntro: `If you don't like your ${roomType.toLowerCase()} right now, try these ${theme ? theme.toLowerCase() + " " : ""}finds instead. All for ${budgetPhrase}.`,
  }),

  // 11 — "Can we please stop doing X"
  (roomType, budgetPhrase, upgradePrice, reelType, theme) => ({
    headline: `Can we please stop\noverpaying for…`,
    subline: `${roomType.toLowerCase()} decor — here's the budget hack`,
    voiceIntro: `Can we please stop overpaying for ${theme ? theme.toLowerCase() + " " : ""}${roomType.toLowerCase()} decor? Here are the budget finds that actually work.`,
  }),
];

/**
 * Returns the hook strings for a given index (cycles through the array).
 */
export function getHook(
  index: number,
  roomType: string,
  budgetPhrase: string,
  upgradePrice: number,
  reelType?: "create" | "upgrade",
  theme?: string
): HookStrings {
  const fn = VIDEO_HOOKS[Math.abs(Math.round(index)) % VIDEO_HOOKS.length];
  return fn(roomType, budgetPhrase, upgradePrice, reelType, theme);
}
