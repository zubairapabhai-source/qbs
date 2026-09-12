/**
 * Ummah Passport API — QBS frontend.
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

export interface PassportView {
  id: string;
  code: string;
  code_expires_at: string | null;
  apps: Record<'treasures' | 'dreams' | 'qbs', boolean>;
  linked_at: Record<string, string>;
  badges: string[];
  milestone_count: number;
  distinct_days?: number;
  newly_earned?: string[];
}

export interface Nudge {
  kind: 'celebrate' | 'return' | 'invite';
  emoji: string;
  title: string;
  body: string;
  app: 'treasures' | 'dreams' | 'qbs';
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
  } finally {
    clearTimeout(timer);
  }
}

export const passportApi = {
  async create() {
    const device_id = await _getDeviceId();
    return _fetch<PassportView>('/api/passport/create', {
      method: 'POST',
      body: JSON.stringify({ device_id, app: APP_KIND }),
    });
  },
  async link(code: string) {
    const device_id = await _getDeviceId();
    return _fetch<PassportView>('/api/passport/link', {
      method: 'POST',
      body: JSON.stringify({ device_id, app: APP_KIND, code }),
    });
  },
  async status() {
    const device_id = await _getDeviceId();
    return _fetch<{ linked: boolean; passport: PassportView | null }>(
      `/api/passport/status?app=${APP_KIND}&device_id=${encodeURIComponent(device_id)}`,
    );
  },
  async milestone(kind: string, label: string, emoji = '🌙', counter?: number) {
    const device_id = await _getDeviceId();
    return _fetch<{ ok: boolean; propagated?: boolean; newly_earned?: string[] }>('/api/passport/milestone', {
      method: 'POST',
      body: JSON.stringify({ device_id, app: APP_KIND, kind, label, emoji, counter }),
    });
  },
  async nudges() {
    const device_id = await _getDeviceId();
    return _fetch<{ nudges: Nudge[] }>(`/api/passport/nudges?app=${APP_KIND}&device_id=${encodeURIComponent(device_id)}`);
  },
  async topGifters(window: 'month' | 'all' = 'month', limit = 5) {
    return _fetch<{
      window: string;
      top: Array<{ buyer_short: string; buyer_app: string | null; claimed: number; last_gift_at: string | null }>;
    }>(`/api/passport/gifts/top?window=${window}&limit=${limit}`);
  },
};

export const BADGE_META: Record<string, { emoji: string; label: string; criteria: string }> = {
  trinity:      { emoji: '🌙', label: 'Trinity',      criteria: 'Linked all 3 Divine Series apps' },
  full_series:  { emoji: '⭐', label: 'Full Series',   criteria: 'Unlocked all 3 apps for £0.99 each' },
  '30_day_ummah': { emoji: '📿', label: '30-Day Ummah', criteria: 'Any activity across the trio, 30 days in a row' },
  seeker:       { emoji: '🕌', label: 'Seeker',       criteria: '10+ AI questions across all apps' },
  reciter:      { emoji: '📖', label: 'Reciter',      criteria: 'Read 30 verses across the apps' },
  dreamer:      { emoji: '✨', label: 'Dreamer',       criteria: 'Logged 10 dreams and blessed 10 duʿās' },
};
