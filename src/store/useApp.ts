import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import { getLocales } from 'expo-localization';
import { initialStreak, nextStreak, MILESTONE_DAYS, type StreakState } from '../personalisation/streak';

export type Lang = 'en' | 'ar' | 'ur';
const LANG_KEY = '@qbs:lang';
const DEVICE_KEY = '@qbs:deviceId';
const UNLOCK_KEY = '@qbs:unlocked';
const PACK_KEY = '@qbs:packBalance';
const STREAK_KEY = '@qbs:streak';
const REMINDER_PREF_KEY = '@qbs:remindersEnabled';

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
  streak: StreakState;
  remindersEnabled: boolean | null;   // null = never asked
  setLang: (l: Lang) => Promise<void>;
  hydrate: () => Promise<void>;
  setEntitlement: (p: Partial<Pick<AppState, 'unlocked' | 'weeklyUsed' | 'packBalance'>>) => void;
  recordAction: () => void;
  markMilestoneShown: (n: number) => void;
  setRemindersEnabled: (v: boolean) => void;
}

export const useApp = create<AppState>((set, get) => ({
  lang: 'en',
  deviceId: '',
  unlocked: false,
  weeklyUsed: 0,
  packBalance: 0,
  hydrated: false,
  streak: initialStreak,
  remindersEnabled: null,
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
    const [l, did, unlockedRaw, packRaw, streakRaw, remindersRaw] = await Promise.all([
      AsyncStorage.getItem(LANG_KEY),
      AsyncStorage.getItem(DEVICE_KEY),
      AsyncStorage.getItem(UNLOCK_KEY),
      AsyncStorage.getItem(PACK_KEY),
      AsyncStorage.getItem(STREAK_KEY),
      AsyncStorage.getItem(REMINDER_PREF_KEY),
    ]);
    let deviceId = did;
    if (!deviceId) {
      deviceId = makeDeviceId();
      await AsyncStorage.setItem(DEVICE_KEY, deviceId);
    }
    // Auto-detect device locale on first launch; user can override via Settings.
    const lang: Lang = (l as Lang) || detectDeviceLang();
    let streak = initialStreak;
    try {
      if (streakRaw) streak = { ...initialStreak, ...JSON.parse(streakRaw) };
    } catch {}
    set({
      lang,
      deviceId,
      // Persisted entitlement survives app restart so a paid user isn't
      // temporarily locked out while /api/entitlement round-trips.
      unlocked: unlockedRaw === '1',
      packBalance: packRaw ? Math.max(0, parseInt(packRaw, 10) || 0) : 0,
      streak,
      remindersEnabled: remindersRaw === '1' ? true : remindersRaw === '0' ? false : null,
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
  recordAction() {
    const nextS = nextStreak(get().streak);
    if (nextS === get().streak) return; // idempotent same-day no-op
    set({ streak: nextS });
    AsyncStorage.setItem(STREAK_KEY, JSON.stringify(nextS)).catch(() => {});
  },
  markMilestoneShown(n: number) {
    const cur = get().streak;
    // Cascade: mark n AND every smaller milestone as shown, so that a
    // user who first sees "30 days" doesn't later get a stale "7 days"
    // pop-up. `pendingMilestone` now returns the highest un-celebrated
    // milestone ≤ current, so without this cascade the modal would
    // re-surface every lower milestone on subsequent Home visits.
    const toMark = MILESTONE_DAYS
      .filter((d) => d <= n && !cur.milestones.includes(String(d)))
      .map((d) => String(d));
    if (toMark.length === 0) return;
    const next = { ...cur, milestones: [...cur.milestones, ...toMark] };
    set({ streak: next });
    AsyncStorage.setItem(STREAK_KEY, JSON.stringify(next)).catch(() => {});
    // Broadcast to Ummah Passport (fire-and-forget).
    const top = Math.max(...toMark.map(Number));
    import('../passportApi').then(({ passportApi }) => {
      passportApi.milestone(`streak_${top}`, `${top}-day streak in Qurʾān·Bible·Science`, '🔥')
        .catch(() => {});
    }).catch(() => {});
  },
  setRemindersEnabled(v: boolean) {
    set({ remindersEnabled: v });
    AsyncStorage.setItem(REMINDER_PREF_KEY, v ? '1' : '0').catch(() => {});
  },
}));

export function isRTL(lang: Lang) {
  return lang === 'ar' || lang === 'ur';
}
