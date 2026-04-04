/**
 * Budget rounding utilities.
 *
 * Every episode headline uses a round "under $X" figure to feel snappy
 * (e.g., "under $150" instead of "under $137.42"). We round UP to the
 * nearest $50 so the claim is always truthful.
 */

/** Round a dollar total up to the nearest $50 increment. */
export function getRoundedTotal(total: number): number {
  return Math.ceil(total / 50) * 50;
}

/** Format the rounded total as a human-friendly budget phrase (e.g., "under $150"). */
export function getBudgetPhrase(total: number): string {
  if (total === 0) return "";
  const rounded = getRoundedTotal(total);
  return `under $${rounded}`;
}
