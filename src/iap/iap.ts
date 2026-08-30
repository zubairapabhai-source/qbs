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

// Async purchase errors surface via useIAP's onPurchaseError callback,
// NOT the requestPurchase promise. We stash the last error at module
// scope + expose a subscribe hook so screens can render an actionable
// dialog when the store rejects a payment (declined, restricted, etc.).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _lastPurchaseError: { at: number; error: any; productId: string } | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PurchaseErrorListener = (e: any, productId: string) => void;
let _onErrorListener: PurchaseErrorListener | null = null;
export function subscribePurchaseError(fn: PurchaseErrorListener): () => void {
  _onErrorListener = fn;
  return () => { if (_onErrorListener === fn) _onErrorListener = null; };
}
export function getLastPurchaseError() { return _lastPurchaseError; }

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

/** Fire-and-forget breadcrumb — logs every purchase attempt outcome to
 * the backend so we can diagnose users whose receipt never came through.
 * Never throws. Safe to await, safe to ignore. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function logAttemptToBackend(deviceId: string, productId: string, outcome: 'requested' | 'success' | 'error' | 'cancelled', errorCode?: string | null, errorMessage?: string | null, raw?: any) {
  if (!API_BASE) return;
  try {
    await fetch(`${API_BASE}/api/iap/log-attempt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: deviceId || 'unknown',
        platform: Platform.OS,
        productId,
        outcome,
        errorCode: errorCode || null,
        errorMessage: errorMessage || null,
        raw,
      }),
    });
  } catch { /* swallow */ }
}

/** Map an IAP error to a user-friendly, action-orientated message + tag.
 * `tag` drives which recovery button to show. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function classifyPurchaseError(e: any): { tag: 'cancelled' | 'declined' | 'network' | 'restricted' | 'not-allowed' | 'already-owned' | 'unknown'; title: string; body: string; } {
  const code = String(e?.code || e?.responseCode || '').toUpperCase();
  const msg = String(e?.message || e?.description || e || '').toLowerCase();

  if (code === 'USERCANCELLED' || code === 'E_USER_CANCELLED' || /cancel/.test(msg))
    return { tag: 'cancelled', title: 'Purchase cancelled', body: 'No charge was made. Tap Try Again if you\'d like to complete the unlock.' };

  if (code === 'PAYMENTINVALID' || code === 'E_PAYMENT_DECLINED' || /declined|payment/i.test(msg))
    return { tag: 'declined', title: 'Payment declined', body: 'Your Apple ID payment method was declined. Please open iPhone Settings → your Apple ID → Payment & Shipping, verify your card, then Try Again.' };

  if (code === 'PAYMENTNOTALLOWED' || code === 'E_NOT_ALLOWED' || /not.?allowed|restricted/i.test(msg))
    return { tag: 'not-allowed', title: 'Purchases not allowed', body: 'iOS is blocking in-app purchases on this device. Check Settings → Screen Time → Content & Privacy Restrictions → iTunes & App Store Purchases → set In-app Purchases to Allow.' };

  if (code === 'E_ALREADY_OWNED' || /already/i.test(msg))
    return { tag: 'already-owned', title: 'You already own this', body: 'The App Store says this unlock is already on your account. Tap Restore Purchase to sync it now — no charge.' };

  if (code === 'NETWORKCONNECTIONFAILED' || code === 'E_NETWORK_ERROR' || /network|connect|offline|timeout/i.test(msg))
    return { tag: 'network', title: 'Network problem', body: 'Couldn\'t reach the App Store. Check your Wi-Fi / mobile data and try again.' };

  return { tag: 'unknown', title: 'Purchase didn\'t go through', body: 'The App Store returned an error we didn\'t recognise. Try Again, or use one of the recovery options below.' };
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
      // Breadcrumb: successful attempt (fire-and-forget)
      logAttemptToBackend(deviceId || 'unknown', productId, 'success', null, null, {
        txn: purchase.transactionId, orig: purchase.originalTransactionId,
      });
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
    onPurchaseError: (e: any) => {
      // Breadcrumb to backend so support has a paper trail even when the
      // user never talks to us. Also stash the last error on the store's
      // module state so screens can render an actionable dialog instead
      // of failing silently.
      const code = String(e?.code || e?.responseCode || 'UNKNOWN');
      const msg = String(e?.message || e?.description || e || '');
      const productId = String(e?.productId || e?.sku || 'unknown');
      const isCancel = /cancel/i.test(code) || /cancel/i.test(msg);
      logAttemptToBackend(deviceId || 'unknown', productId, isCancel ? 'cancelled' : 'error', code, msg, { raw: e });
      _lastPurchaseError = { at: Date.now(), error: e, productId };
      if (_onErrorListener) _onErrorListener(e, productId);
      if (!isCancel) console.warn('[IAP]', code, msg);
    },
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
