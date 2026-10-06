/**
 * Soundscape bundles — pre-set audio + visual palettes that pair with
 * calligraphy / du'ā cards for atmospheric reveals on the recipient
 * side (and preview on sender side).
 *
 *   • Each bundle maps to either a short Qur'ānic surah streamed from
 *     mp3quran.net OR an isolated verse streamed from islamic.network
 *     (used for the Āyat ash-Shifā).
 *   • The sender can pick between TWO reciters:
 *       - Qari ʿAbdul Basit ʿAbdul Ṣamad (classical mujawwad)
 *       - Qari Mishary Rashid al-ʿAfāsy (modern, widely-loved)
 *   • Visual palette is a pure data recipe → the backend reveal page
 *     renders petals / sparks / lantern-glow / mihrab-arch via CSS
 *     keyframes; the sender preview uses the same data to drive
 *     Reanimated layers in-app.
 *
 * Shared ACROSS all 3 apps — keep identical.
 */

export type SoundscapeId =
  | 'ameen'       // 🤲 du'ā cards
  | 'barakah'     // 💐 nikāh / wedding
  | 'nur'         // ☀️ exams, graduation, light
  | 'eid'         // 🌙 celebration
  | 'shifa'       // 🕊️ illness, recovery
  | 'duashifa'    // 💊 Qur'anic healing verse (Al-Isrā 17:82)
  | 'parents'     // 👳 honour, parents' birthday
  | 'protection'  // 🛡️ against waswasa, evil eye, safe travel
  | 'taziyah'     // 🕯️ bereavement, loss
  | 'takwir'      // 🌅 Day of Judgment / awakening — Qari ʿAbdul Basit
  | 'duha'        // 🌄 forenoon / divine mercy — Qari ʿAbdul Basit
  | 'shams'       // 🌞 the sun / inner clarity — Qari ʿAbdul Basit
  | 'bismillah'   // 🕋 opening blessing — Qari ʿAbdul Basit
  | 'balad';      // 🏙️ The City — Qari ʿAbdul Basit

export type ReciterId = 'basit' | 'afasy';

export type ParticleKind =
  | 'petals'
  | 'sparks'
  | 'lantern'
  | 'droplets'
  | 'stars'
  | 'dates'
  | 'candle'
  | 'noor';

export type FrameMotif = 'arabesque' | 'mihrab' | 'tessellation' | 'floret' | 'none';

export interface Reciter {
  id: ReciterId;
  base_url: string;
  label: { en: string; ar: string; ur: string };
}

export const RECITERS: Reciter[] = [
  {
    id: 'basit',
    base_url: 'https://cdn.mp3quran.net/audio/abdulbasit-abdulsamad/r3',
    label: {
      en: 'Qari ʿAbdul Basit',
      ar: 'القارئ عبد الباسط',
      ur: 'قاری عبد الباسط',
    },
  },
  {
    id: 'afasy',
    base_url: 'https://cdn.mp3quran.net/audio/mishary-alafasy/r1',
    label: {
      en: 'Qari Al-Mishary',
      ar: 'القارئ مشاري',
      ur: 'قاری مشاری',
    },
  },
];
export const RECITER_BY_ID: Record<ReciterId, Reciter> =
  Object.fromEntries(RECITERS.map((r) => [r.id, r])) as Record<ReciterId, Reciter>;

export interface Soundscape {
  id: SoundscapeId;
  emoji: string;
  label: { en: string; ar: string; ur: string };
  /** Surah file stem (e.g. "091" for Al-Shams). Resolves to <reciter_base>/091.mp3. */
  surah_file: string;
  /** Credit shown under the label (e.g. the surah or verse name). */
  surah_name: { en: string; ar: string; ur: string };
  duration_s: number;
  /**
   * Optional per-reciter absolute audio URL. If set for a reciter it
   * OVERRIDES the standard `base_url + surah_file + ".mp3"` scheme.
   * Used for isolated-verse recitations hosted on islamic.network AND
   * for the two new custom-hosted Qari ʿAbdul Basit recordings
   * (Takwir + Aḍ-Ḍuḥā) that live on our own backend.
   */
  audio_url_override?: Partial<Record<ReciterId, string>>;
  /**
   * Which reciters are offered as options for this soundscape. Omit to
   * allow BOTH (back-compat). Set to a single-reciter array to lock
   * the scope to that voice — e.g. the two new Qari ʿAbdul Basit
   * bundles only expose Basit, and the nine original surah bundles
   * only expose Al-Mishary (user asked us to retire our auto-added
   * Basit mp3quran-CDN fallbacks there).
   */
  available_reciters?: ReciterId[];
  visual: {
    bg_from: string;
    bg_to: string;
    glow: string;
    particle: ParticleKind;
    frame: FrameMotif;
    accent: string;
  };
}

export const SOUNDSCAPES: Soundscape[] = [
  {
    id: 'ameen', emoji: '🤲',
    label: { en: 'Ameen',   ar: 'آمين',   ur: 'آمین' },
    surah_file: '001',
    surah_name: { en: 'Al-Fātiḥah', ar: 'الفاتحة', ur: 'سورۃ الفاتحہ' },
    duration_s: 54,
    available_reciters: ['afasy'],
    visual: { bg_from: '#1b3a63', bg_to: '#3a2060', glow: '#F5D06F', particle: 'sparks',   frame: 'arabesque',    accent: '#F5D06F' },
  },
  {
    id: 'barakah', emoji: '💐',
    label: { en: 'Barakah', ar: 'بركة',   ur: 'برکت' },
    surah_file: '108',
    surah_name: { en: 'Al-Kawthar', ar: 'الكوثر', ur: 'سورۃ الکوثر' },
    duration_s: 22,
    available_reciters: ['afasy'],
    visual: { bg_from: '#5a2060', bg_to: '#203058', glow: '#F5A6C9', particle: 'petals',   frame: 'arabesque',    accent: '#F5A6C9' },
  },
  {
    id: 'nur', emoji: '☀️',
    label: { en: 'Nūr',     ar: 'نور',    ur: 'نور' },
    surah_file: '091',
    surah_name: { en: 'Al-Shams', ar: 'الشمس', ur: 'سورۃ الشمس' },
    duration_s: 46,
    available_reciters: ['afasy'],
    visual: { bg_from: '#453b18', bg_to: '#5a3a1a', glow: '#FFD56E', particle: 'noor',     frame: 'floret',       accent: '#FFD56E' },
  },
  {
    id: 'eid', emoji: '🌙',
    label: { en: 'Eid',     ar: 'العيد',  ur: 'عید' },
    surah_file: '114',
    surah_name: { en: 'An-Nās', ar: 'الناس', ur: 'سورۃ الناس' },
    duration_s: 20,
    available_reciters: ['afasy'],
    visual: { bg_from: '#2b1a68', bg_to: '#3f1f68', glow: '#E8D28E', particle: 'lantern',  frame: 'tessellation', accent: '#E8D28E' },
  },
  {
    id: 'shifa', emoji: '🕊️',
    label: { en: 'Shifā',   ar: 'شفاء',   ur: 'شفاء' },
    surah_file: '093',
    surah_name: { en: 'Aḍ-Ḍuḥā', ar: 'الضحى', ur: 'سورۃ الضحیٰ' },
    duration_s: 44,
    available_reciters: ['afasy'],
    visual: { bg_from: '#174a68', bg_to: '#2a5c6a', glow: '#A6D8F5', particle: 'droplets', frame: 'mihrab',       accent: '#A6D8F5' },
  },
  {
    id: 'duashifa', emoji: '💊',
    label: { en: 'Dua Shifā', ar: 'دعاء الشفاء', ur: 'شفا کی دعا' },
    surah_file: '',
    surah_name: { en: 'Al-Isrā 17:82', ar: 'الإسراء ٨٢', ur: 'الإسراء ۸۲' },
    duration_s: 17,
    available_reciters: ['afasy'],
    audio_url_override: {
      afasy: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/2211.mp3',
    },
    visual: { bg_from: '#145a52', bg_to: '#1f7560', glow: '#A6F5C9', particle: 'droplets', frame: 'mihrab',       accent: '#A6F5C9' },
  },
  {
    id: 'parents', emoji: '👳',
    label: { en: 'Parents', ar: 'الوالدين', ur: 'والدین' },
    surah_file: '094',
    surah_name: { en: 'Al-Inshirāḥ', ar: 'الشرح', ur: 'سورۃ الانشراح' },
    duration_s: 28,
    available_reciters: ['afasy'],
    visual: { bg_from: '#5a3818', bg_to: '#3e3058', glow: '#F5D06F', particle: 'petals',   frame: 'mihrab',       accent: '#F5D06F' },
  },
  {
    id: 'protection', emoji: '🛡️',
    label: { en: 'Protection', ar: 'الحماية', ur: 'حفاظت' },
    surah_file: '113',
    surah_name: { en: 'Al-Falaq', ar: 'الفلق', ur: 'سورۃ الفلق' },
    duration_s: 26,
    available_reciters: ['afasy'],
    visual: { bg_from: '#1e3368', bg_to: '#3b1e4a', glow: '#B8CCE8', particle: 'stars',    frame: 'arabesque',    accent: '#B8CCE8' },
  },
  {
    id: 'taziyah', emoji: '🕯️',
    label: { en: 'Taʿziyah', ar: 'تعزية', ur: 'تعزیت' },
    surah_file: '112',
    surah_name: { en: 'Al-Ikhlāṣ', ar: 'الإخلاص', ur: 'سورۃ الاخلاص' },
    duration_s: 32,
    available_reciters: ['afasy'],
    visual: { bg_from: '#3a3833', bg_to: '#262320', glow: '#E8D4B8', particle: 'candle',   frame: 'mihrab',       accent: '#E8D4B8' },
  },
  // ─── NEW Qari ʿAbdul Basit bundles ───
  // All four hosted on our own backend (/audio/*) for playback
  // reliability — expo-audio handles our same-origin files more
  // consistently than external CDN redirects.
  {
    id: 'takwir', emoji: '🌅',
    label: { en: 'At-Takwīr', ar: 'التكوير', ur: 'سورۃ التکویر' },
    surah_file: '081',
    surah_name: { en: 'At-Takwīr · Ch. 81', ar: 'سورة التكوير', ur: 'سورۃ التکویر' },
    duration_s: 150,
    available_reciters: ['basit'],
    audio_url_override: {
      basit: 'https://divine-series.onrender.com/audio/takwir_basit.m4a',
    },
    visual: { bg_from: '#4a1e1e', bg_to: '#2b1138', glow: '#F5B06F', particle: 'sparks',   frame: 'arabesque',    accent: '#F5B06F' },
  },
  {
    id: 'duha', emoji: '🌄',
    label: { en: 'Aḍ-Ḍuḥā', ar: 'الضحى', ur: 'سورۃ الضحیٰ' },
    surah_file: '093',
    surah_name: { en: 'Aḍ-Ḍuḥā · Ch. 93', ar: 'سورة الضحى', ur: 'سورۃ الضحیٰ' },
    duration_s: 60,
    available_reciters: ['basit'],
    audio_url_override: {
      basit: 'https://divine-series.onrender.com/audio/duha_basit.m4a',
    },
    visual: { bg_from: '#5a3a15', bg_to: '#1c3860', glow: '#F5D06F', particle: 'noor',     frame: 'floret',       accent: '#F5D06F' },
  },
  {
    id: 'shams', emoji: '🌞',
    label: { en: 'Ash-Shams', ar: 'الشمس', ur: 'سورۃ الشمس' },
    surah_file: '091',
    surah_name: { en: 'Ash-Shams · Ch. 91', ar: 'سورة الشمس', ur: 'سورۃ الشمس' },
    duration_s: 708,
    available_reciters: ['basit'],
    audio_url_override: {
      // TEMP: owner's uploaded "Shams" file was actually Aḍ-Ḍuḥā —
      // reverting to mp3quran Basit CDN until a correctly-labelled
      // Ash-Shams recording is supplied.
      basit: 'https://cdn.mp3quran.net/audio/abdulbasit-abdulsamad/r3/091.mp3',
    },
    visual: { bg_from: '#5a3818', bg_to: '#2b1a30', glow: '#FFD56E', particle: 'noor',     frame: 'floret',       accent: '#FFD56E' },
  },
  {
    id: 'bismillah', emoji: '🕋',
    label: { en: 'Bismillāh', ar: 'بسم الله', ur: 'بسم اللہ' },
    surah_file: '',
    surah_name: { en: 'Bismillāh ar-Raḥmān', ar: 'بسم الله الرحمن', ur: 'بسم اللہ الرحمٰن' },
    duration_s: 11,
    available_reciters: ['basit'],
    audio_url_override: {
      // Extracted from the opening 11 seconds of the uploaded Shams
      // recording — Basit's signature Bismillah ar-Raḥmān ar-Raḥīm.
      basit: 'https://divine-series.onrender.com/audio/bismillah_basit.m4a',
    },
    visual: { bg_from: '#1a2854', bg_to: '#3b2168', glow: '#F5D06F', particle: 'noor',     frame: 'mihrab',       accent: '#F5D06F' },
  },
  {
    id: 'balad', emoji: '🏙️',
    label: { en: 'Al-Balad', ar: 'البلد', ur: 'سورۃ البلد' },
    surah_file: '090',
    surah_name: { en: 'Al-Balad · Ch. 90', ar: 'سورة البلد', ur: 'سورۃ البلد' },
    duration_s: 56,
    available_reciters: ['basit'],
    audio_url_override: {
      // Owner's uploaded screen-record — Basit's mujawwad Al-Balad (56s).
      basit: 'https://divine-series.onrender.com/audio/balad_basit.m4a',
    },
    visual: { bg_from: '#2a1f14', bg_to: '#3b2a1b', glow: '#E8B86C', particle: 'lantern',  frame: 'arabesque',    accent: '#E8B86C' },
  },
];

export const SOUNDSCAPE_BY_ID: Record<SoundscapeId, Soundscape> =
  Object.fromEntries(SOUNDSCAPES.map((s) => [s.id, s])) as Record<SoundscapeId, Soundscape>;

export function soundscapeFor(id: string | null | undefined): Soundscape | undefined {
  if (!id) return undefined;
  return SOUNDSCAPE_BY_ID[id as SoundscapeId];
}

/** Build the audio URL for a given soundscape + reciter choice. */
export function audioUrlFor(s: Soundscape, reciterId: ReciterId): string {
  const override = s.audio_url_override?.[reciterId];
  if (override) return override;
  return `${RECITER_BY_ID[reciterId].base_url}/${s.surah_file}.mp3`;
}

/** Compose the trilingual credit line "Al-Shams · Qari Al-Mishary". */
export function creditFor(
  s: Soundscape,
  reciterId: ReciterId,
  lang: 'en' | 'ar' | 'ur',
): string {
  const r = RECITER_BY_ID[reciterId];
  return `${s.surah_name[lang]} · ${r.label[lang]}`;
}

// ─── Pastel watercolour palette ─────────────────────────────────────
// Each soundscape has an optional "pastel" twin — a soft parchment /
// watercolour mood for senders who want a lighter, airier ecard. The
// gradient tones intentionally lean warm (manuscript cream, blush,
// mint, sky) and the `ink` colour is dark enough for AA contrast on
// the lightest gradient stop so the Arabic + body text stay crisp.
export interface PastelPalette {
  /** Top-left gradient stop (lightest). */
  bg_from: string;
  /** Bottom-right gradient stop. */
  bg_to: string;
  /** Headline / Arabic sticker colour — mid-tone matching the mood. */
  accent: string;
  /** Body text + translit — deepest tone, readable on bg_from. */
  ink: string;
  /** Corner motif + chip border — mid-saturation accent. */
  motif: string;
  /** Border + chip stroke colour. */
  border: string;
}

const PASTEL_BY_ID: Record<SoundscapeId, PastelPalette> = {
  ameen:      { bg_from: '#FFF4D9', bg_to: '#F5E3B0', accent: '#8A6A1C', ink: '#5A4418', motif: '#C9A227', border: '#D9BC6B' },
  barakah:    { bg_from: '#FBE5EE', bg_to: '#F2CFDE', accent: '#8E2D5A', ink: '#5A1E3C', motif: '#D080A6', border: '#E09FBF' },
  nur:        { bg_from: '#FFF5E0', bg_to: '#FFE4B5', accent: '#7A5A1C', ink: '#4A3818', motif: '#D4A147', border: '#E8C271' },
  eid:        { bg_from: '#EEE6F5', bg_to: '#DACEE8', accent: '#4E2E7A', ink: '#2E1A4A', motif: '#8D6AC2', border: '#B29CD6' },
  shifa:      { bg_from: '#E0F0F5', bg_to: '#C7E4ED', accent: '#1F5A6E', ink: '#153E4D', motif: '#5A9EB2', border: '#9CC9D6' },
  duashifa:   { bg_from: '#E1F2E6', bg_to: '#C7E6D0', accent: '#1F6E52', ink: '#154530', motif: '#5AB58E', border: '#9CD6B2' },
  parents:    { bg_from: '#FBE8D5', bg_to: '#F5D4B0', accent: '#8A5A1C', ink: '#5A3818', motif: '#C98D47', border: '#E0B88A' },
  protection: { bg_from: '#E8EDFA', bg_to: '#D0D9F0', accent: '#2E3E7A', ink: '#1E2958', motif: '#6A7FC2', border: '#A6B5D6' },
  taziyah:    { bg_from: '#F5EFE4', bg_to: '#E6DECE', accent: '#5A4A33', ink: '#3A3024', motif: '#A69074', border: '#C9B898' },
  takwir:     { bg_from: '#FDE3C4', bg_to: '#F6C9A4', accent: '#8A3A1E', ink: '#5A2516', motif: '#C77144', border: '#E29C73' },
  duha:       { bg_from: '#FFF2D4', bg_to: '#FFE3A8', accent: '#7A5218', ink: '#4A3310', motif: '#D4A147', border: '#E8C271' },
  shams:      { bg_from: '#FFF5D4', bg_to: '#FFE19C', accent: '#8A5A1C', ink: '#5A3818', motif: '#D4A147', border: '#E8C271' },
  bismillah:  { bg_from: '#FFF4D9', bg_to: '#EEE6F5', accent: '#5A3818', ink: '#3A2410', motif: '#C9A227', border: '#D9BC6B' },
};

/** Default pastel for cards without a selected soundscape. */
export const PASTEL_DEFAULT: PastelPalette = PASTEL_BY_ID.ameen;

/** Look up the pastel palette for a given soundscape id. */
export function pastelFor(id: string | null | undefined): PastelPalette {
  if (!id) return PASTEL_DEFAULT;
  return PASTEL_BY_ID[id as SoundscapeId] || PASTEL_DEFAULT;
}
