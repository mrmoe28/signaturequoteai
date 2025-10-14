// lib/images/resolveImagePath.ts
export type ProductImage = {
  url?: string | null;
  localPath?: string | null;
  isPrimary?: boolean | null;
};

export function normalizePublicPath(p?: string | null): string | null {
  if (!p) return null;
  // Strip accidental "public" and ensure leading slash
  const cleaned = p.replace(/^public\//, "").replace(/^\/?/, "/");
  return cleaned;
}

/**
 * Given product-level fields and optional image array, return best src.
 * Order: primary.localPath -> first.localPath -> primary.url -> first.url -> placeholder.
 */
export function resolveProductImageSrc(opts: {
  primaryImageUrl?: string | null;
  images?: ProductImage[] | null;
  placeholder?: string; // e.g. "/images/placeholder.svg"
}): string {
  const { primaryImageUrl, images = [], placeholder = "/images/placeholder.svg" } = opts;

  const imageArray = images || [];
  const primary = imageArray.find(i => i?.isPrimary);
  const first = imageArray[0];

  const candidates = [
    normalizePublicPath(primary?.localPath),
    normalizePublicPath(first?.localPath),
    primaryImageUrl ?? null,
    first?.url ?? null,
    placeholder
  ].filter(Boolean) as string[];

  return candidates[0]!;
}
