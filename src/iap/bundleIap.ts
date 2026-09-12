/**
 * Bundle IAP wrapper for QBS.
 *
 * Uses the same lazy-require pattern as the parent `iap.ts` so the code
 * stays inert in Expo Go / web (no native module linked). Kept
 * standalone so the BundleOfferModal doesn't need to sit inside the
 * `useStorePurchases()` hook tree.
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { IAP_PRODUCTS } from './products';

export const BUNDLE_PRODUCT_ID = IAP_PRODUCTS.bundleOtherTwo;

const LOG = (...args: any[]) => {
  if (__DEV__ || Platform.OS !== 'web') {
    // eslint-disable-next-line no-console
    console.log('[qbs-bundle-iap]', ...args);
  }
};

export function isNativeIapAvailable(): boolean {
  if (Platform.OS === 'web') return false;
  const appOwnership = (Constants as any).appOwnership;
  if (appOwnership === 'expo') return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('expo-iap');
    return true;
  } catch {
    return false;
  }
}

export type IapPurchaseResult = {
  platform: 'ios' | 'android';
  receipt: string;
  productId: string;
  transactionId?: string;
};

export async function initIap(): Promise<void> {
  if (!isNativeIapAvailable()) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const iap = require('expo-iap');
    if (typeof iap.initConnection === 'function') {
      await iap.initConnection();
    }
  } catch (e: any) { LOG('initConnection err (safe):', e?.message || e); }
}

export async function fetchBundlePrice(): Promise<string | null> {
  if (!isNativeIapAvailable()) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const iap = require('expo-iap');
    const fn = iap.fetchProducts || iap.getProducts;
    if (typeof fn !== 'function') return null;
    const products: any = await fn({ skus: [BUNDLE_PRODUCT_ID], type: 'in-app' });
    const list: any[] = Array.isArray(products) ? products : (products?.products || []);
    const p = list.find((x: any) => x?.id === BUNDLE_PRODUCT_ID || x?.productId === BUNDLE_PRODUCT_ID) || list[0];
    if (!p) return null;
    return p?.displayPrice || p?.localizedPrice || p?.price || null;
  } catch (e: any) {
    LOG('fetchBundlePrice err:', e?.message || e);
    return null;
  }
}

export async function purchaseBundle(): Promise<IapPurchaseResult> {
  if (!isNativeIapAvailable()) {
    throw new Error('Native IAP is not available in this build.');
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const iap = require('expo-iap');
  await initIap();

  const price = await fetchBundlePrice();
  if (!price) {
    const platformStore = Platform.OS === 'ios' ? 'App Store' : 'Play Store';
    throw new Error(`${platformStore} hasn’t loaded the £1.50 bundle yet. Please try again in a moment.`);
  }

  const buildRequest = () => ({
    request: {
      apple: { sku: BUNDLE_PRODUCT_ID },
      google: { skus: [BUNDLE_PRODUCT_ID] },
      ios: { sku: BUNDLE_PRODUCT_ID },
      android: { skus: [BUNDLE_PRODUCT_ID] },
    },
    type: 'in-app' as const,
  });

  const mapBundlePurchase = (purchase: any): IapPurchaseResult => ({
    platform: Platform.OS as 'ios' | 'android',
    receipt:
      Platform.OS === 'ios'
        ? (purchase?.transactionReceipt || purchase?.jwsRepresentationIos || purchase?.jwsRepresentation || purchase?.transactionId || purchase?.id || '')
        : (purchase?.purchaseTokenAndroid || purchase?.purchaseToken || purchase?.originalJsonAndroid || purchase?.originalJson || ''),
    productId: BUNDLE_PRODUCT_ID,
    transactionId:
      purchase?.id || purchase?.transactionId || purchase?.orderId ||
      purchase?.originalTransactionIdentifierIOS || purchase?.originalTransactionIdentifier,
  });

  return await new Promise<IapPurchaseResult>((resolve, reject) => {
    let settled = false;
    let updateSub: any = null;
    let errorSub: any = null;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      try { updateSub?.remove?.(); } catch {}
      try { errorSub?.remove?.(); } catch {}
    };

    const finish = (purchase: any) => {
      if (settled) return;
      settled = true;
      cleanup();
      const r = mapBundlePurchase(purchase);
      if (typeof iap.finishTransaction === 'function') {
        iap.finishTransaction({ purchase, isConsumable: false }).catch(() => {});
      }
      resolve(r);
    };

    const fail = (err: any) => {
      if (settled) return;
      settled = true;
      cleanup();
      const e: any = new Error(err?.message || String(err) || 'Purchase failed');
      const code = err?.code || err?.errorCode;
      if (code === 'E_USER_CANCELLED' || code === 'PURCHASE_CANCELLED' || /cancel/i.test(err?.message || '')) {
        e.code = 'E_USER_CANCELLED';
      }
      reject(e);
    };

    try {
      updateSub = iap.purchaseUpdatedListener?.((purchase: any) => {
        const pid = purchase?.id || purchase?.productId;
        if (pid && pid !== BUNDLE_PRODUCT_ID) return;
        finish(purchase);
      });
      errorSub = iap.purchaseErrorListener?.((err: any) => fail(err));
    } catch {}

    timeoutHandle = setTimeout(() => {
      fail(new Error('The store is taking too long to respond. Please try again.'));
    }, 15_000);

    Promise.resolve()
      .then(() => iap.requestPurchase(buildRequest()))
      .then((res: any) => {
        if (settled) return;
        if (res == null) return;
        const p = Array.isArray(res)
          ? res.find((x: any) => (x?.id || x?.productId) === BUNDLE_PRODUCT_ID) || res[0]
          : res;
        if (p) finish(p);
      })
      .catch((e: any) => fail(e));
  });
}
