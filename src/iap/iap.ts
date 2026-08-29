/**
 * Lightweight wrapper around `expo-iap`.
 *
 * IAP is unavailable in Expo Go and on web — this module no-ops in those
 * environments.  Install in a dev build with:
 *   yarn expo install expo-iap expo-secure-store expo-application
 *
 * The fallback shape mirrors what `useIAP()` returns so screens can render
 * harmlessly inside the preview / Expo Go.
 */
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { IAP_PRODUCTS, AI_PACK_CREDITS, type IapProductSku } from './products';
import { useApp } from '../store/useApp';

const API_BASE = process.env.EXPO_PUBLIC_QBS_API_URL || '';

// Module-level dedupe set for purchase callbacks. `useStorePurchases`
// is mounted at BOTH the app root (_layout.tsx) and the /unlock screen
// so a single completed purchase fires two `onPurchaseSuccess` callbacks
// — without this guard, the backend gets two `report-purchase` + two
// `finishTransaction` calls and consumables risk double-credit.
const _handledTxnIds = new Set<string>();

const CONSUMABLE_SKUS: Set<string> = new Set([
  IAP_PRODUCTS.aiPack1,
  IAP_PRODUCTS.aiPack10,
  IAP_PRODUCTS.aiPack30,
]);

// Lazy resolution — keeps the bundle from crashing if expo-iap isn't installed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports
let _useIAP: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  _useIAP = require('expo-iap').useIAP;
} catch {
  _useIAP = null;
}

const IS_AVAILABLE = !!_useIAP && Platform.OS !== 'web';

export interface PurchaseReport {
  productId: IapProductSku;
  isConsumable: boolean;
  transactionId?: string | null;
  purchaseToken?: string | null;
  receiptData?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw?: any;
}

export async function reportPurchaseToBackend(deviceId: string, p: PurchaseReport) {
  if (!API_BASE) return { ok: false, reason: 'no-base-url' };
  try {
    const res = await fetch(`${API_BASE}/api/iap/report-purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, platform: Platform.OS, ...p }),
    });
    return await res.json();
  } catch (e) {
    return { ok: false, reason: String(e) };
  }
}

interface StoreApi {
  available: boolean;
  connected: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requestPurchase: (args: any) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  restorePurchases: () => Promise<any[]>;
}

const FALLBACK: StoreApi = {
  available: false,
  connected: false,
  products: [],
  requestPurchase: async () => { /* noop */ },
  restorePurchases: async () => [],
};

export function useStorePurchases(): StoreApi {
  const deviceId = useApp((s) => s.deviceId);
  const setEntitlement = useApp((s) => s.setEntitlement);

  // Always run the same hooks in the same order. If the native module is
  // missing, give useIAP a noop config object — it will return `connected: false`.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const iap = IS_AVAILABLE ? _useIAP({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onPurchaseSuccess: async (purchase: any) => {
      const productId: IapProductSku = purchase.productId;
      const isConsumable = CONSUMABLE_SKUS.has(productId);

      // Dedupe: refuse to process the same transaction twice (see the
      // _handledTxnIds comment above the Set definition).
      const dedupeKey = purchase.transactionId
        || purchase.purchaseToken
        || `${productId}:${purchase.originalTransactionId || ''}:${purchase.transactionDate || ''}`;
      if (dedupeKey && _handledTxnIds.has(dedupeKey)) {
        return;
      }
      if (dedupeKey) _handledTxnIds.add(dedupeKey);
      await reportPurchaseToBackend(deviceId || 'preview', {
        productId,
        isConsumable,
        transactionId: purchase.transactionId ?? null,
        purchaseToken: purchase.purchaseToken ?? null,
        receiptData: purchase.transactionReceipt ?? null,
        raw: purchase,
      });
      if (productId === IAP_PRODUCTS.lifetimeUnlock) setEntitlement({ unlocked: true });

      if (isConsumable) {
        // Pessimistic UI: optimistic-update with the SKU's known credit count,
        // then use the authoritative balance the backend returns from
        // /credit-pack itself. This avoids a second round-trip AND avoids
        // the "read-back from wrong collection" bug we had previously.
        const optimistic = AI_PACK_CREDITS[productId] || 0;
        try {
          if (API_BASE && deviceId) {
            const r = await fetch(`${API_BASE}/api/entitlement/credit-pack`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                device_id: deviceId,
                product_id: productId,
                transaction_id: purchase.transactionId ?? null,
              }),
            });
            const j = await r.json();
            // Backend returns { ok, credited, new_balance } — trust `new_balance`.
            if (typeof j?.new_balance === 'number') setEntitlement({ packBalance: j.new_balance });
            else setEntitlement({ packBalance: optimistic });
          } else {
            setEntitlement({ packBalance: optimistic });
          }
        } catch { setEntitlement({ packBalance: optimistic }); }
      }
      try { await iap.finishTransaction({ purchase, isConsumable }); } catch { /* swallow */ }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onPurchaseError: (e: any) => { if (e?.code !== 'UserCancelled') console.warn('[IAP]', e); },
  }) : null;

  useEffect(() => {
    if (iap?.connected) {
      iap.fetchProducts({
        skus: [
          IAP_PRODUCTS.lifetimeUnlock,
          IAP_PRODUCTS.aiPack1,
          IAP_PRODUCTS.aiPack10,
          IAP_PRODUCTS.aiPack30,
        ],
        type: 'in-app',
      });

      // SILENT RESTORE: check any already-finalised purchases the platform
      // knows about (Apple / Google surface these without an Apple-ID
      // prompt). If a lifetime unlock is present, promote the local flag
      // and re-report to the backend so server entitlement stays in sync.
      // Runs once on connect — cheap and idempotent.
      (async () => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const getAvail = (iap as any).getAvailablePurchases;
          if (typeof getAvail !== 'function') return;
          const avail = await getAvail();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const lifetime = (Array.isArray(avail) ? avail : []).find((p: any) =>
            p?.productId === IAP_PRODUCTS.lifetimeUnlock ||
            p?.sku === IAP_PRODUCTS.lifetimeUnlock ||
            p?.productIds?.includes?.(IAP_PRODUCTS.lifetimeUnlock)
          );
          if (lifetime) {
            setEntitlement({ unlocked: true });
            if (deviceId) {
              await reportPurchaseToBackend(deviceId, {
                productId: IAP_PRODUCTS.lifetimeUnlock,
                isConsumable: false,
                transactionId: lifetime?.transactionId || lifetime?.originalTransactionId || lifetime?.orderId || null,
                purchaseToken: lifetime?.purchaseToken || null,
                receiptData: lifetime?.transactionReceipt || null,
                raw: lifetime,
              });
            }
          }
        } catch { /* silent — user can still tap Restore manually */ }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iap?.connected, deviceId]);

  if (!IS_AVAILABLE || !iap) return FALLBACK;
  return { available: true, ...iap };
}
