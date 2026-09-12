/**
 * Leaderboards API — QBS port.
 *
 * Points at the shared Treasures backend so QBS users compete with
 * Treasures + Dreams users on ONE anonymous scoreboard.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROD_ROOT = 'https://divine-series.onrender.com';
const RAW_BASE = __DEV__
  ? (process.env.EXPO_PUBLIC_BACKEND_URL ?? `${PROD_ROOT}/t`)
  : `${PROD_ROOT}/t`;
export const LB_BASE = RAW_BASE.replace(/\/[dq]$/, '/t').replace(/\/$/, '');

const DEVICE_ID_KEY = '@qbs.deviceId';

async function getDeviceId(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
  } catch {}
  const fresh = `qbs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  try { await AsyncStorage.setItem(DEVICE_ID_KEY, fresh); } catch {}
  return fresh;
}

export type LbCategory = 'duas' | 'tazkiyah' | 'worship' | 'quran' | 'adhkar' | 'salawat';
export type LbTimeframe = 'day' | 'week' | 'month' | 'all';
export type LbApp = 'treasures' | 'dreams' | 'qbs';
export type PraiseSticker =
  | 'barakallahu_feek'
  | 'masha_allah'
  | 'jazakallah_khair'
  | 'subhanallah'
  | 'ameen'
  | 'may_your_scale_be_heavy';

export interface RosterEntry {
  slug: string; display: string; bio_en: string;
  gender: 'male' | 'female';
  category: 'sahaba' | 'warrior' | 'scholar' | 'scientist' | 'traveller' | 'modern' | 'polymath';
}
export interface RegisterResult { ok: boolean; username_slug: string; display: string; bio_en: string; conflict: boolean; }
export interface EventResult { ok: boolean; accepted: number; dropped: number; week_score: number; }
export interface TopRow { rank: number; username_slug: string; display: string; bio_en: string; score: number; is_champion: boolean; }
export interface TopResult { category: LbCategory; timeframe: LbTimeframe; rows: TopRow[]; my_rank: number | null; my_score: number | null; }
export interface RewardItem {
  id: string; kind: 'treasure_chest' | 'champion_crown' | 'scientific_discovery';
  category: LbCategory; week_key: string; payload: Record<string, any>; claimed: boolean;
}

async function _fetch<T>(path: string, init?: RequestInit): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`${LB_BASE}${path}`, {
      ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) }, signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`lb ${res.status}`);
    return (await res.json()) as T;
  } finally { clearTimeout(timer); }
}

export async function fetchRoster(gender?: 'male' | 'female'): Promise<RosterEntry[]> {
  const q = gender ? `?gender=${gender}` : '';
  const data = await _fetch<{ items: RosterEntry[] }>(`/api/leaderboards/roster${q}`);
  return data.items;
}
export async function registerUsername(usernameSlug: string, honorific?: string): Promise<RegisterResult> {
  const device_hash = await getDeviceId();
  return _fetch<RegisterResult>('/api/leaderboards/register', {
    method: 'POST', body: JSON.stringify({ device_hash, username_slug: usernameSlug, honorific }),
  });
}
export async function submitEvent(category: LbCategory, app: LbApp, delta: number = 1): Promise<EventResult | null> {
  try {
    const device_hash = await getDeviceId();
    return await _fetch<EventResult>('/api/leaderboards/event', {
      method: 'POST', body: JSON.stringify({ device_hash, category, app, delta }),
    });
  } catch { return null; }
}
export async function fetchTop(category: LbCategory, timeframe: LbTimeframe = 'week', limit: number = 20): Promise<TopResult> {
  const device_hash = await getDeviceId();
  return _fetch<TopResult>(`/api/leaderboards/top?category=${category}&timeframe=${timeframe}&limit=${limit}&me=${encodeURIComponent(device_hash)}`);
}
export async function fetchRewards(): Promise<RewardItem[]> {
  const device_hash = await getDeviceId();
  const data = await _fetch<{ items: RewardItem[] }>(`/api/leaderboards/rewards/${encodeURIComponent(device_hash)}`);
  return data.items;
}
export async function claimReward(rewardId: string): Promise<{ ok: boolean }> {
  const device_hash = await getDeviceId();
  return _fetch<{ ok: boolean }>('/api/leaderboards/rewards/claim', {
    method: 'POST', body: JSON.stringify({ device_hash, reward_id: rewardId }),
  });
}
export async function sendPraise(targetSlug: string, sticker: PraiseSticker): Promise<{ ok: boolean }> {
  const device_hash = await getDeviceId();
  return _fetch<{ ok: boolean }>('/api/leaderboards/praise', {
    method: 'POST', body: JSON.stringify({ device_hash, target_slug: targetSlug, sticker }),
  });
}
/** Returns true iff device holds an active champion_crown reward (this week).
 *  Filters on `payload.crown_valid_until` because backend does NOT TTL
 *  `lb_rewards` — stale crowns stick around otherwise. */
export async function isCurrentChampion(): Promise<boolean> {
  try {
    const items = await fetchRewards();
    const nowMs = Date.now();
    return items.some((r) => {
      if (r.kind !== 'champion_crown') return false;
      const until = r?.payload?.crown_valid_until;
      if (!until) return false;
      const t = Date.parse(String(until));
      return Number.isFinite(t) && t > nowMs;
    });
  } catch { return false; }
}
export interface PraiseInboxItem {
  id: string; sticker: PraiseSticker;
  sender_slug: string; sender_display: string;
  created_at: string | null;
}
export async function fetchPraiseInbox(): Promise<PraiseInboxItem[]> {
  const device_hash = await getDeviceId();
  const data = await _fetch<{ items: PraiseInboxItem[] }>(
    `/api/leaderboards/praise/${encodeURIComponent(device_hash)}`,
  );
  return data.items;
}
