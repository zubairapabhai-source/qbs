/**
 * App #3 IAP product IDs — mirrors the Treasures 3-tier "Instant Question"
 * pack model. Same SKU is used on iOS + Android.
 *
 * Configure these in App Store Connect (lifetime = NON-consumable;
 * the 3 ai_pack SKUs = CONSUMABLE) and Google Play Console (both as
 * one-time products) before testing on a real dev build.
 *
 * Bundle / package: com.divineseriesmobile.quranbiblescience
 */
export const IAP_PRODUCTS = {
  /** Non-consumable: lifetime unlock for ~£0.99 */
  lifetimeUnlock: 'com.divineseriesmobile.quranbiblescience.lifetime_unlock',
  /** Consumable: 1 Instant Question (top-up after weekly free 3) — ~£0.49 */
  aiPack1: 'com.divineseriesmobile.quranbiblescience.ai_pack_1',
  /** Consumable: 10 Instant Questions — ~£2.99 (best value, default) */
  aiPack10: 'com.divineseriesmobile.quranbiblescience.ai_pack_10',
  /** Consumable: 30 Instant Questions — ~£6.99 */
  aiPack30: 'com.divineseriesmobile.quranbiblescience.ai_pack_30',
} as const;

export type IapProductSku = (typeof IAP_PRODUCTS)[keyof typeof IAP_PRODUCTS];

/** SKU → credits granted on a successful consumable purchase. Mirrors the
 * Treasures "Instant Question" pack model. The server is the authority — this
 * map is only here so the UI can display "Buy 10 → +10 credits" without an
 * extra round-trip. */
export const AI_PACK_CREDITS: Record<string, number> = {
  [IAP_PRODUCTS.aiPack1]: 1,
  [IAP_PRODUCTS.aiPack10]: 10,
  [IAP_PRODUCTS.aiPack30]: 30,
};

/** Default per-SKU GBP prices — the live values come from the store fetch
 * at runtime, this is only the fallback so the picker isn't blank if the
 * store-products endpoint hasn't replied yet. */
export const AI_PACK_FALLBACK_PRICES: Record<string, string> = {
  [IAP_PRODUCTS.aiPack1]: '£0.49',
  [IAP_PRODUCTS.aiPack10]: '£2.99',
  [IAP_PRODUCTS.aiPack30]: '£6.99',
};
