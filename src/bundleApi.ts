/**
 * Cross-app Bundle Upsell — QBS frontend client.
 * See /app/backend/ummah_passport.py for the contract.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DUAS_BASE } from './duasWallApi';

const APP_KIND = 'qbs' as const;
const DEVICE_ID_KEY = '@qbs.deviceId';

async function _getDeviceId(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
  } catch {}
  const fresh = `qbs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  try { await AsyncStorage.setItem(DEVICE_ID_KEY, fresh); } catch {}
  return fresh;
}

export interface BundleView {
  claimed: boolean;
  claimed_by_app: 'treasures' | 'dreams' | 'qbs' | null;
  claimed_at: string | null;
  redeemed_by: Array<'treasures' | 'dreams' | 'qbs'>;
  should_unlock_here: boolean;
}

async function _fetch<T>(path: string, init?: RequestInit): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`${DUAS_BASE}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(init?.headers || {}),
      },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err: any = new Error(body?.detail?.message || `HTTP ${res.status}`);
      err.status = res.status;
      err.detail = body?.detail || body;
      throw err;
    }
    return body as T;
  } finally { clearTimeout(timer); }
}

export const bundleApi = {
  async status(): Promise<BundleView> {
    const device_id = await _getDeviceId();
    return _fetch<BundleView>(`/api/passport/bundle/status?app=${APP_KIND}&device_id=${encodeURIComponent(device_id)}`);
  },
  async claim(receipt: string, transactionId?: string, productId?: string): Promise<{
    ok: boolean; already_claimed: boolean; code: string; bundle: any;
  }> {
    const device_id = await _getDeviceId();
    return _fetch('/api/passport/bundle/claim', {
      method: 'POST',
      body: JSON.stringify({
        device_id, app: APP_KIND,
        receipt: receipt || '',
        transaction_id: transactionId || null,
        product_id: productId || null,
      }),
    });
  },
  async redeem(): Promise<{ ok: boolean; already_redeemed?: boolean }> {
    const device_id = await _getDeviceId();
    return _fetch('/api/passport/bundle/redeem', {
      method: 'POST',
      body: JSON.stringify({ device_id, app: APP_KIND }),
    });
  },

  // ── Gift-a-Bundle ────────────────────────────────────────────
  async giftCreate(receipt: string, transactionId?: string, productId?: string, buyerMsg?: string): Promise<{
    ok: boolean; code: string; created_at: string;
  }> {
    const device_id = await _getDeviceId();
    return _fetch('/api/passport/gift/create', {
      method: 'POST',
      body: JSON.stringify({
        device_id, app: APP_KIND,
        receipt: receipt || '',
        transaction_id: transactionId || null,
        product_id: productId || null,
        buyer_msg: buyerMsg || null,
      }),
    });
  },
  async giftStatus(code: string): Promise<{
    exists: boolean; claimed: boolean; claimed_at: string | null;
    claimed_by_app: string | null; code: string;
  }> {
    return _fetch(`/api/passport/gift/status?code=${encodeURIComponent(code)}`);
  },
  async giftRedeem(code: string): Promise<{
    ok: boolean; passport_code: string; buyer_msg: string | null;
  }> {
    const device_id = await _getDeviceId();
    return _fetch('/api/passport/gift/redeem', {
      method: 'POST',
      body: JSON.stringify({ device_id, app: APP_KIND, code }),
    });
  },
  async giftsMine(): Promise<{
    gifts: Array<{
      code: string; created_at: string | null; claimed: boolean;
      claimed_at: string | null; claimed_by_app: 'treasures' | 'dreams' | 'qbs' | null;
      buyer_msg: string | null;
    }>;
    sent: number; claimed: number;
  }> {
    const device_id = await _getDeviceId();
    return _fetch(`/api/passport/gifts/mine?app=${APP_KIND}&device_id=${encodeURIComponent(device_id)}`);
  },
  giftCardSvgUrl(code: string, lang?: string): string {
    const q = lang ? `?lang=${encodeURIComponent(lang)}` : '';
    return `${DUAS_BASE}/api/passport/gift/${encodeURIComponent(code)}/card.svg${q}`;
  },
};

type GiftLang = 'en' | 'ar' | 'ur';
export function shareGiftMessage(code: string, buyerMsg: string | null | undefined, lang: string): string {
  const l: GiftLang = (['en', 'ar', 'ur'] as const).includes(lang as GiftLang) ? (lang as GiftLang) : 'en';
  if (l === 'ar') {
    return (
      `🎁 السلام عليكم — لقد أهديتُكَ حزمة السلسلة الإلهيّة!\n\n` +
      `افتح أيّ تطبيق من الثلاثة ← جواز الأمّة ← ألصق هذا الرمز:\n\n    ${code}\n\n` +
      (buyerMsg ? `رسالتي: "${buyerMsg}"\n\n` : '') +
      `ستفتح لك كلّ التطبيقات الثلاثة (كنوز 📖، تعبير الرؤى 🌙، القرآن · الكتاب · العلم ✨). ` +
      `جزاك الله خيرًا. 🌹`
    );
  }
  if (l === 'ur') {
    return (
      `🎁 السلام علیکم — میں نے آپ کو ڈوائن سیریز کا بنڈل بطور تحفہ بھیجا ہے!\n\n` +
      `کوئی بھی ایپ کھولیں ← امّہ پاسپورٹ ← یہ کوڈ پیسٹ کریں:\n\n    ${code}\n\n` +
      (buyerMsg ? `میرا پیغام: "${buyerMsg}"\n\n` : '') +
      `تینوں ایپس اَن لاک ہوں گی (خزائن 📖، تعبیرِ رؤیا 🌙، قرآن · بائبل · سائنس ✨)۔ ` +
      `اللہ ہمیں دونوں کو اجر عطا فرمائے۔ 🌹`
    );
  }
  return (
    `🎁 Assalamu ʿalaykum — I've gifted you the Divine Series bundle!\n\n` +
    `Open any of these 3 apps → tap Ummah Passport → paste this code:\n\n    ${code}\n\n` +
    (buyerMsg ? `My note: "${buyerMsg}"\n\n` : '') +
    `You'll unlock all 3 apps (Treasures of the Sacred Qurʾān 📖, Interpretation of Dreams 🌙, Qurʾān · Bible · Science ✨). ` +
    `May Allāh reward us both. 🌹`
  );
}

export const STORE_LINKS = {
  treasures: {
    ios: 'https://apps.apple.com/app/id6770721697',
    android: 'https://play.google.com/store/apps/details?id=com.divineseriesmobile.sacredtreasures',
    name: 'Treasures of the Sacred Qurʾān',
    emoji: '📖',
  },
  dreams: {
    ios: 'https://apps.apple.com/app/id6765926174',
    android: 'https://play.google.com/store/apps/details?id=com.divineseries.interpretationofdreams',
    name: 'Interpretation of Dreams',
    emoji: '🌙',
  },
  qbs: {
    ios: 'https://apps.apple.com/app/id6801619940',
    android: 'https://play.google.com/store/apps/details?id=com.divineseriesmobile.quranbiblescience',
    name: 'Qurʾān · Bible · Science',
    emoji: '✨',
  },
} as const;

export type AppKind = keyof typeof STORE_LINKS;
export function storeUrlFor(app: AppKind, os: 'ios' | 'android'): string {
  return STORE_LINKS[app][os];
}
export const OTHER_APPS: AppKind[] = ['treasures', 'dreams'];
