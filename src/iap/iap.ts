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

async function reportPurchaseToBackend(deviceId: string, p: PurchaseReport) {
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
        // then fetch authoritative balance from backend so a replayed receipt
        // (idempotency) never double-credits the visual counter.
        const optimistic = AI_PACK_CREDITS[productId] || 0;
        try {
          if (API_BASE && deviceId) {
            // Tell backend to credit the pack (idempotent on transaction_id)
            await fetch(`${API_BASE}/api/entitlement/credit-pack`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                device_id: deviceId,
                product_id: productId,
                transaction_id: purchase.transactionId ?? null,
              }),
            });
            // Then fetch the authoritative current balance
            const r = await fetch(`${API_BASE}/api/iap/entitlements/${encodeURIComponent(deviceId)}`);
            const j = await r.json();
            if (typeof j?.packBalance === 'number') setEntitlement({ packBalance: j.packBalance });
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iap?.connected]);

  if (!IS_AVAILABLE || !iap) return FALLBACK;
  return { available: true, ...iap };
}
