import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import { getLocales } from 'expo-localization';

export type Lang = 'en' | 'ar' | 'ur';
const LANG_KEY = '@qbs:lang';
const DEVICE_KEY = '@qbs:deviceId';
const UNLOCK_KEY = '@qbs:unlocked';
const PACK_KEY = '@qbs:packBalance';

function makeDeviceId() {
  return 'qbs_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function detectDeviceLang(): Lang {
  try {
    const locs = getLocales();
    const top = locs?.[0]?.languageCode || 'en';
    if (top.startsWith('ar')) return 'ar';
    if (top.startsWith('ur')) return 'ur';
  } catch {}
  return 'en';
}

interface AppState {
  lang: Lang;
  deviceId: string;
  unlocked: boolean;
  weeklyUsed: number;
  packBalance: number;
  hydrated: boolean;
  setLang: (l: Lang) => Promise<void>;
  hydrate: () => Promise<void>;
  setEntitlement: (p: Partial<Pick<AppState, 'unlocked' | 'weeklyUsed' | 'packBalance'>>) => void;
}

export const useApp = create<AppState>((set, get) => ({
  lang: 'en',
  deviceId: '',
  unlocked: false,
  weeklyUsed: 0,
  packBalance: 0,
  hydrated: false,
  async setLang(l) {
    set({ lang: l });
    await AsyncStorage.setItem(LANG_KEY, l);
    // RTL hint — doesn't force reload, just exposes direction
    const shouldBeRTL = l === 'ar' || l === 'ur';
    if (I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.allowRTL(shouldBeRTL);
      // Hard reload would be needed for true RTL flip; we keep textAlign-based
      // rendering for now so the UI looks correct without restarting the app.
    }
  },
  async hydrate() {
    const [l, did, unlockedRaw, packRaw] = await Promise.all([
      AsyncStorage.getItem(LANG_KEY),
      AsyncStorage.getItem(DEVICE_KEY),
      AsyncStorage.getItem(UNLOCK_KEY),
      AsyncStorage.getItem(PACK_KEY),
    ]);
    let deviceId = did;
    if (!deviceId) {
      deviceId = makeDeviceId();
      await AsyncStorage.setItem(DEVICE_KEY, deviceId);
    }
    // Auto-detect device locale on first launch; user can override via Settings.
    const lang: Lang = (l as Lang) || detectDeviceLang();
    set({
      lang,
      deviceId,
      // Persisted entitlement survives app restart so a paid user isn't
      // temporarily locked out while /api/entitlement round-trips.
      unlocked: unlockedRaw === '1',
      packBalance: packRaw ? Math.max(0, parseInt(packRaw, 10) || 0) : 0,
      hydrated: true,
    });
  },
  setEntitlement(p) {
    set(p as any);
    // Persist any changed keys to survive relaunch.
    if (typeof p.unlocked !== 'undefined') {
      AsyncStorage.setItem(UNLOCK_KEY, p.unlocked ? '1' : '0').catch(() => {});
    }
    if (typeof p.packBalance !== 'undefined') {
      AsyncStorage.setItem(PACK_KEY, String(p.packBalance)).catch(() => {});
    }
  },
}));

export function isRTL(lang: Lang) {
  return lang === 'ar' || lang === 'ur';
}
