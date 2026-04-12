import { formatCurrency, getRawTotal, getUpgradeBundlePrice, getUpgradeBundlePriceLabel } from "@/lib/budget";

type BundleReelType = "create" | "upgrade";

type BundleIdentity = {
  reelType?: BundleReelType;
  roomType: string;
  theme?: string;
};

type BundleWithItems = BundleIdentity & {
  items: Array<{ amount: number }>;
};

export type BundleKind = "design" | "upgrade";

export function getBundleKind(reelType: BundleReelType = "upgrade"): BundleKind {
  return reelType === "create" ? "design" : "upgrade";
}

export function getBundleTypeLabel(reelType: BundleReelType = "upgrade"): string {
  return getBundleKind(reelType) === "design" ? "Design Bundle" : "Upgrade Bundle";
}

export function getBundleTitle(bundle: BundleIdentity): string {
  return `${bundle.roomType} ${getBundleTypeLabel(bundle.reelType)}`.trim();
}

export function getBundleTheme(bundle: BundleIdentity): string {
  return getBundleKind(bundle.reelType) === "design" ? bundle.theme?.trim() || "" : "";
}

export function getBundlePriceValue(bundle: BundleWithItems): number {
  return getBundleKind(bundle.reelType) === "design"
    ? getRawTotal(bundle.items)
    : getUpgradeBundlePrice(bundle.items);
}

export function getBundlePriceLabel(bundle: BundleWithItems): string {
  return getBundleKind(bundle.reelType) === "design"
    ? `${formatCurrency(getRawTotal(bundle.items))} total`
    : getUpgradeBundlePriceLabel(bundle.items);
}

export function getBundlePriceCaption(bundle: BundleIdentity): string {
  return getBundleKind(bundle.reelType) === "design"
    ? "sum of all items"
    : "most expensive item in bundle";
}
