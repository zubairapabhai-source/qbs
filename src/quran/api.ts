/**
 * Qur'an reader API — trilingual page/surah/verse lookup.
 * All endpoints are free (no paywall). Tafseer stays on the existing
 * /verse/{key}/full endpoint gated by the 99p unlock IAP.
 */
const BASE = process.env.EXPO_PUBLIC_QBS_API_URL || '';

export interface AyahTri {
  surah?: number;
  verse: number;
  key: string;
  page?: number;
  juz?: number;
  ruku?: number;
  surah_name_en?: string;
  ar: string;
  en: string;
  ur: string;
}
export interface SurahMeta {
  number: number;
  name_ar: string;
  name_en: string;
  meaning_en: string;
  meaning_ur: string;
  ayah_count: number;
  revelation_type: string;
}
export interface PageResponse {
  page: number;
  total_pages: number;
  surah_names_on_page: string[];
  juz: number | null;
  ayahs: AyahTri[];
}
export interface SurahResponse {
  surah: SurahMeta;
  ayahs: AyahTri[];
}

async function j<T>(path: string): Promise<T | null> {
  if (!BASE) return null;
  try {
    const r = await fetch(`${BASE}${path}`);
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch { return null; }
}

export const fetchSurahs = () => j<{ surahs: SurahMeta[]; total: number }>('/api/quran/surahs');
export const fetchPage = (n: number) => j<PageResponse>(`/api/quran/page/${n}`);
export const fetchSurah = (n: number) => j<SurahResponse>(`/api/quran/surah/${n}`);
export const fetchVerseTri = (key: string) => j<AyahTri>(`/api/quran/verse/${encodeURIComponent(key)}/tri`);
