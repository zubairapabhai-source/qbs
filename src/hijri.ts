/**
 * Hijri date helper.
 *
 * Uses native `Intl.DateTimeFormat` with the `islamic-umalqura` calendar,
 * which is the Saudi Umm al-Qurā civil Hijri calendar — the most widely
 * used by mosques worldwide. Available on Hermes / V8 / JSC on iOS &
 * Android (Expo SDK 50+).
 *
 * Returns an empty string on platforms where the calendar isn't available
 * (e.g. older Expo Web shims), so the caller can simply render nothing.
 */

const MONTHS_AR = [
  'مُحَرَّم',
  'صَفَر',
  'رَبِيع الأَوَّل',
  'رَبِيع الآخِر',
  'جُمَادَى الأُولَى',
  'جُمَادَى الآخِرَة',
  'رَجَب',
  'شَعْبَان',
  'رَمَضَان',
  'شَوَّال',
  'ذُو القَعْدَة',
  'ذُو الحِجَّة',
];

const MONTHS_EN = [
  'Muḥarram',
  'Ṣafar',
  'Rabīʿ al-Awwal',
  'Rabīʿ al-Ākhir',
  'Jumādā al-Ūlā',
  'Jumādā al-Ākhirah',
  'Rajab',
  'Shaʿbān',
  'Ramaḍān',
  'Shawwāl',
  'Dhū al-Qaʿdah',
  'Dhū al-Ḥijjah',
];

export type HijriDate = {
  day: number;
  month: number; // 1-indexed
  year: number;
  monthArabic: string;
  monthEnglish: string;
  formatted: string; // e.g. "4 Dhū al-Ḥijjah 1446"
  formattedAr: string; // e.g. "٤ ذو الحجة ١٤٤٦"
};

function parseParts(parts: Intl.DateTimeFormatPart[]) {
  const out: Record<string, string> = {};
  for (const p of parts) {
    if (p.type === 'day') out.day = p.value;
    else if (p.type === 'month') out.month = p.value;
    else if (p.type === 'year') out.year = p.value;
  }
  return out;
}

export function getHijriDate(d: Date = new Date()): HijriDate | null {
  try {
    const en = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    }).formatToParts(d);
    const parts = parseParts(en);
    const day = parseInt(parts.day, 10);
    const month = parseInt(parts.month, 10);
    const year = parseInt(parts.year, 10);
    if (!day || !month || !year) return null;

    const arPretty = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);

    return {
      day,
      month,
      year,
      monthArabic: MONTHS_AR[month - 1] || '',
      monthEnglish: MONTHS_EN[month - 1] || '',
      formatted: `${day} ${MONTHS_EN[month - 1]} ${year}`,
      formattedAr: arPretty,
    };
  } catch {
    return null;
  }
}
