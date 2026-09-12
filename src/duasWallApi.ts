/**
 * Duā Wall API — QBS frontend.
 *
 * Targets the SHARED Treasures backend so posts and blessings appear across
 * all 3 Divine Series apps. Even though QBS's normal API lives at /q, the
 * wall is hosted at /t so we rewrite the tail.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROD_ROOT = 'https://divine-series.onrender.com';
const RAW_BASE = process.env.EXPO_PUBLIC_QBS_API_URL || `${PROD_ROOT}/q`;
export const DUAS_BASE = RAW_BASE.replace(/\/[dq]$/, '/t').replace(/\/$/, '');

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

export type DuaCategory =
  | 'family' | 'health' | 'guidance' | 'forgiveness'
  | 'provision' | 'protection' | 'ummah' | 'deceased' | 'personal';

export type DuaReaction =
  | 'ameen' | 'may_allah_answer' | 'in_sha_allah'
  | 'sending_dua' | 'allah_hafiz';

export interface WallDua {
  id: string;
  category: DuaCategory;
  text: string;
  lang: 'en' | 'ar' | 'ur';
  created_at: string;
  bless_count: number;
  reactions: Record<DuaReaction, number>;
}

export interface WallStats {
  total_duas: number;
  total_blessings: number;
  posted_24h: number;
}

async function _fetch<T>(path: string, init?: RequestInit): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
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
      const err: any = new Error(body?.detail?.message || body?.message || `HTTP ${res.status}`);
      err.status = res.status;
      err.detail = body?.detail || body;
      throw err;
    }
    return body as T;
  } finally {
    clearTimeout(timer);
  }
}

export const wallApi = {
  async list(category?: DuaCategory, limit = 20, skip = 0) {
    const qs = new URLSearchParams();
    if (category) qs.set('category', category);
    qs.set('limit', String(limit));
    qs.set('skip', String(skip));
    return _fetch<{ items: WallDua[]; limit: number; skip: number }>(`/api/duas?${qs.toString()}`);
  },
  async stats() {
    return _fetch<WallStats>('/api/duas/stats');
  },
  async create(category: DuaCategory, text: string, lang: 'en' | 'ar' | 'ur' = 'en') {
    const device_id = await _getDeviceId();
    return _fetch<{ ok: true; dua: WallDua }>('/api/duas', {
      method: 'POST',
      body: JSON.stringify({ device_id, category, text, lang }),
    });
  },
  async bless(duaId: string) {
    const device_id = await _getDeviceId();
    return _fetch<{ ok: true; bless_count: number; already_blessed?: boolean }>(
      `/api/duas/${duaId}/bless`,
      { method: 'POST', body: JSON.stringify({ device_id }) },
    );
  },
  async react(duaId: string, reaction: DuaReaction) {
    const device_id = await _getDeviceId();
    return _fetch<{ ok: true; reactions: Record<DuaReaction, number> }>(
      `/api/duas/${duaId}/react`,
      { method: 'POST', body: JSON.stringify({ device_id, reaction }) },
    );
  },
  async translate(duaId: string, lang: 'en' | 'ar' | 'ur') {
    return _fetch<{ text: string; cached: boolean; lang: string; note?: string }>(
      `/api/duas/${duaId}/translate?lang=${lang}`,
    );
  },
};

export const CATEGORY_LABELS: Record<DuaCategory, { en: string; ar: string; ur: string; icon: string }> = {
  family:      { en: 'Family',      ar: 'الأهل',      ur: 'خاندان',    icon: 'people' },
  health:      { en: 'Health',      ar: 'الصحة',      ur: 'صحت',       icon: 'heart' },
  guidance:    { en: 'Guidance',    ar: 'الهداية',    ur: 'ہدایت',      icon: 'compass' },
  forgiveness: { en: 'Forgiveness', ar: 'المغفرة',    ur: 'مغفرت',      icon: 'sparkles' },
  provision:   { en: 'Provision',   ar: 'الرزق',      ur: 'رزق',        icon: 'basket' },
  protection:  { en: 'Protection',  ar: 'الحفظ',      ur: 'حفاظت',      icon: 'shield-checkmark' },
  ummah:       { en: 'The Ummah',   ar: 'الأمة',      ur: 'اُمّہ',       icon: 'globe' },
  deceased:    { en: 'The Deceased',ar: 'المتوفَّون', ur: 'مرحومین',    icon: 'flower' },
  personal:    { en: 'Personal',    ar: 'شخصي',       ur: 'ذاتی',       icon: 'rose' },
};

export const REACTION_LABELS: Record<DuaReaction, { en: string; ar: string; ur: string }> = {
  ameen:            { en: 'Āmīn',                    ar: 'آمين',                  ur: 'آمین' },
  may_allah_answer: { en: 'May Allāh answer',        ar: 'يُستجاب بإذن الله',      ur: 'اللہ قبول فرمائے' },
  in_sha_allah:     { en: 'In shāʾ Allāh',           ar: 'إن شاء الله',            ur: 'ان شاء اللہ' },
  sending_dua:      { en: 'Sending my duʿās',        ar: 'أدعو لك',                ur: 'دعاؤں میں یاد' },
  allah_hafiz:      { en: 'Allāh ḥāfiẓ',             ar: 'الله حافظ',              ur: 'اللہ حافظ' },
};
