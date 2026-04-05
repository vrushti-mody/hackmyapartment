function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeAffiliateLink(value: unknown): string {
  return normalizeText(value);
}

export function normalizeProductTitle(value: unknown): string {
  const title = normalizeText(value).toLowerCase();

  return title
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getProductIdentityKey(value: {
  title?: unknown;
  affiliateLink?: unknown;
  id?: unknown;
}): string {
  const normalizedTitle = normalizeProductTitle(value.title);
  if (normalizedTitle) return `title:${normalizedTitle}`;

  const affiliateLink = normalizeAffiliateLink(value.affiliateLink);
  if (affiliateLink) return `link:${affiliateLink}`;

  const id = normalizeText(value.id);
  return id ? `id:${id}` : "";
}
