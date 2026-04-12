/**
 * Budget rounding utilities.
 *
 * Every episode headline uses a round "under $X" figure to feel snappy
 * (e.g., "under $150" instead of "under $137.42"). We round UP to the
 * nearest $50 so the claim is always truthful.
 */

type PricedItem = {
  amount: number;
};

function roundUpToNearest(value: number, increment: number): number {
  if (value <= 0) return 0;
  return Math.ceil(value / increment) * increment;
}

export function getRawTotal(items: PricedItem[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

export function formatCurrency(amount: number): string {
  if (!Number.isFinite(amount)) return "$0";
  return `$${Number.isInteger(amount) ? amount.toFixed(0) : amount.toFixed(2)}`;
}

/** Round a dollar total up to the nearest $50 increment. */
export function getRoundedTotal(total: number): number {
  return roundUpToNearest(total, 50);
}

/** Format the rounded total as a human-friendly budget phrase (e.g., "under $150"). */
export function getBudgetPhrase(total: number): string {
  if (total === 0) return "";
  const rounded = getRoundedTotal(total);
  return `under $${rounded}`;
}

/** Round the priciest product up to the nearest $5 for upgrade hooks. */
export function getUpgradeHookPrice(items: PricedItem[]): number {
  if (items.length === 0) return 0;
  const maxItemAmount = items.reduce(
    (highest, item) => Math.max(highest, item.amount),
    0
  );

  return roundUpToNearest(maxItemAmount, 5);
}

/** Shared upgrade hook used in the reel title and opening script line. */
export function getUpgradeHook(roomType: string, items: PricedItem[]): string {
  const roundedMaxItem = getUpgradeHookPrice(items);
  if (!roomType.trim() || roundedMaxItem === 0) return "";

  return `Upgrade your ${roomType.toLowerCase()} with these finds that cost $${roundedMaxItem} and under`;
}

export function getUpgradeBundlePrice(items: PricedItem[]): number {
  if (items.length === 0) return 0;
  return Math.ceil(items.reduce((highest, item) => Math.max(highest, item.amount), 0));
}

export function getUpgradeBundlePriceLabel(items: PricedItem[]): string {
  const roundedMaxItem = getUpgradeBundlePrice(items);
  return roundedMaxItem > 0 ? `$${roundedMaxItem} and under` : "";
}
