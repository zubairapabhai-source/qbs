/**
 * API client with graceful fallback to bundled seed JSON when the
 * backend is unreachable (preview / offline mode).
 */
import scientistsSeed from './data_scientists.json';
import atozSeed from './data_atoz.json';

const BASE = process.env.EXPO_PUBLIC_QBS_API_URL || '';

async function tryFetch<T>(path: string, init?: RequestInit, fallback?: T): Promise<{ data: T; live: boolean }> {
  if (!BASE) return { data: fallback as T, live: false };
  try {
    const ctrl = new AbortController();
    const tm = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(`${BASE}${path}`, { ...init, signal: ctrl.signal });
    clearTimeout(tm);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { data: (await res.json()) as T, live: true };
  } catch (e) {
    return { data: fallback as T, live: false };
  }
}

export interface Scientist {
  id: string; name_en: string; name_ar?: string; name_western?: string | null;
  death_year_ce?: number | null; era?: string; region?: string;
  fields?: string[];
  summary_en?: string | null; summary_ar?: string | null; summary_ur?: string | null;
  discoveries_en?: string[]; discoveries_ar?: string[]; discoveries_ur?: string[];
  quran_sunnah_connection_en?: string | null; quran_sunnah_connection_ar?: string | null; quran_sunnah_connection_ur?: string | null;
  western_acknowledgments_en?: string[]; western_acknowledgments_ar?: string[]; western_acknowledgments_ur?: string[];
  suggested_reading_en?: string[]; suggested_reading_ar?: string[]; suggested_reading_ur?: string[];
}

export async function listScientists(lang?: string): Promise<{ scientists: Scientist[]; eras: string[]; fields: string[]; live: boolean }> {
  const seedFallback = {
    total: scientistsSeed.scientists?.length || 0,
    filter_eras: scientistsSeed.filter_era_master_list || [],
    filter_fields: scientistsSeed.filter_fields_master_list || [],
    scientists: (scientistsSeed.scientists || []) as Scientist[],
  };
  const url = lang ? `/api/scientists?lang=${encodeURIComponent(lang)}` : `/api/scientists`;
  const { data, live } = await tryFetch<any>(url, undefined, seedFallback);
  return {
    scientists: data.scientists || [],
    eras: data.filter_eras || [],
    fields: data.filter_fields || [],
    live,
  };
}

export interface AtozEntry {
  slug: string; ref?: string; topic: string; science_hook?: string;
  arabic?: string; translation_en?: string;
  // sunnah entries carry these in place of science_hook
  hadith_en?: string; hadith_ar?: string; source?: string; grade?: string;
  classical_anchor?: string; modern_link?: string;
  // Locale variants (trilingual entries)
  topic_ar?: string; topic_ur?: string;
  translation_ar?: string; translation_ur?: string;
  science_hook_ar?: string; science_hook_ur?: string;
  hadith_en_ar?: string; hadith_en_ur?: string;
  classical_anchor_ar?: string; classical_anchor_ur?: string;
  modern_link_ar?: string; modern_link_ur?: string;
}

export async function listAtozSeed(): Promise<{ entries: AtozEntry[]; live: boolean }> {
  // Combine Qur'anic A-Z entries with Sunnah-scientific entries so both
  // appear in the A-Z list. Sunnah entries are flagged via the `hadith_en`
  // field which the renderer uses to switch styling.
  const verses = (atozSeed.verses_to_author || []) as AtozEntry[];
  const sunnah = ((atozSeed as any).hadith_scientific || []) as AtozEntry[];
  return { entries: [...verses, ...sunnah], live: false };
}

export interface DailySign {
  date: string;
  sign: { slug: string; title_en: string; ayah: string; summary_en: string };
  note?: string;
}

export async function getDailySign(): Promise<{ sign: DailySign | null; live: boolean }> {
  const fallbacks: DailySign[] = [
    { date: new Date().toISOString().slice(0, 10),
      sign: { slug: 'expanding-universe', title_en: 'The Expanding Universe',
        ayah: 'And the heaven We constructed with strength, and indeed, We are [its] expander. (Quran 51:47)',
        summary_en: "The Quran's mention of an expanding heaven aligns with the 1929 Hubble discovery of cosmic expansion. Modern cosmology confirms the universe has been expanding since the Big Bang." } },
    { date: new Date().toISOString().slice(0, 10),
      sign: { slug: 'embryology', title_en: 'Stages of Embryonic Development',
        ayah: 'Then We made the sperm-drop into a clinging clot, and We made the clot into a lump… (Quran 23:14)',
        summary_en: "The Quran's description of human embryonic development — nuṭfa, ʿalaqa, muḍgha — drew the attention of embryologist Prof. Keith L. Moore." } },
    { date: new Date().toISOString().slice(0, 10),
      sign: { slug: 'two-seas', title_en: 'The Two Seas That Do Not Mix',
        ayah: 'He released the two seas, meeting [side by side]; between them is a barrier so neither transgresses. (Quran 55:19–20)',
        summary_en: 'Oceanographers documented haloclines between fresh and salt water bodies — a physical barrier matching the Quranic description.' } },
  ];
  // Deterministic pick per day for offline mode
  const today = new Date();
  const dayIdx = (today.getUTCFullYear() * 372 + (today.getUTCMonth() + 1) * 31 + today.getUTCDate()) % fallbacks.length;
  const seed = fallbacks[dayIdx];
  const { data, live } = await tryFetch<DailySign>(`/api/daily-sign`, undefined, seed);
  return { sign: data, live };
}

export interface SheikhAnswer {
  answer: string;
  snippets?: { key: string; source: string; lang: string; text: string }[];
  stats?: any;
  blocked?: boolean;
  quota?: { free_per_week: number; weekly_used: number; pack_balance: number };
}

export async function askSheikh(question: string, deviceId: string, lang: string): Promise<{ ok: boolean; status?: number; data?: SheikhAnswer; error?: any }> {
  if (!BASE) {
    // Mock preview answer
    return {
      ok: true,
      data: {
        answer:
          "This is a preview response. When connected to the live backend, the AI Sheikh will answer using verbatim citations from Ibn Kathīr, al-Saʿdī, al-Muyassar, and al-Jalālayn, then add any relevant scientific reading. Your question was: \"" + question + "\".\n\nThe traditional tafseer holds primacy; the scientific reading is an inference, not a doctrine.",
        snippets: [],
        quota: { free_per_week: 3, weekly_used: 0, pack_balance: 0 },
      },
    };
  }
  try {
    const res = await fetch(`${BASE}/api/sheikh/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, device_id: deviceId, lang }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, status: res.status, error: body };
    return { ok: true, status: 200, data: body };
  } catch (e: any) {
    return { ok: false, error: { message: e?.message || 'Network error' } };
  }
}

export async function getEntitlement(deviceId: string) {
  return tryFetch<any>(`/api/entitlement/${deviceId}`, undefined, {
    unlocked: false, weekly_questions: { used: 0, free_per_week: 3, remaining_free: 3 },
    question_pack_balance: 0,
  });
}
