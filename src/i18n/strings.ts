import type { Lang } from '../store/useApp';

export const STR: Record<string, Record<Lang, string>> = {
  appName: {
    en: 'Quran, Bible & Science',
    ar: 'القرآن والإنجيل والعلم',
    ur: 'قرآن، انجیل اور سائنس',
  },
  begin: { en: 'Begin', ar: 'ابدأ', ur: 'شروع کریں' },
  bismillah: {
    en: 'In the name of Allah, the Most Compassionate, the Most Merciful',
    ar: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    ur: 'اللہ کے نام سے جو نہایت مہربان رحم والا ہے',
  },
  tagline: {
    en: 'Daily signs of the Divine — anchored in the Quran, examined through the lens of the Bible and the discoveries of the great Muslim scientists.',
    ar: 'علاماتٌ يوميّةٌ من الإله — متجذّرةٌ في القرآن، تُدرَس عبر الإنجيل واكتشافات أعظم علماء المسلمين.',
    ur: 'الٰہی نشانیاں روزانہ — قرآن میں جڑی، انجیل اور عظیم مسلم سائنسدانوں کی دریافتوں کے ذریعے دیکھی گئیں۔',
  },
  // tabs
  tabDaily: { en: 'Daily Sign', ar: 'علامة اليوم', ur: 'آج کی نشانی' },
  tabAtoz: { en: 'A–Z', ar: 'أ – ي', ur: 'الف–ی' },
  tabScientists: { en: 'Scientists', ar: 'العلماء', ur: 'سائنسدان' },
  tabSheikh: { en: 'Ask Sheikh', ar: 'اسأل الشيخ', ur: 'شیخ سے پوچھیں' },
  // daily sign
  signOfDay: { en: 'Sign of the Day', ar: 'علامة اليوم', ur: 'آج کی نشانی' },
  refresh: { en: 'Refresh', ar: 'تحديث', ur: 'تازہ کریں' },
  share: { en: 'Share', ar: 'شارك', ur: 'شیئر کریں' },
  save: { en: 'Save', ar: 'احفظ', ur: 'محفوظ کریں' },
  loading: { en: 'Loading…', ar: 'جارٍ التحميل…', ur: 'لوڈ ہو رہا ہے…' },
  retry: { en: 'Retry', ar: 'إعادة المحاولة', ur: 'دوبارہ کوشش' },
  // a–z
  atozTitle: { en: 'A–Z of Science', ar: 'موسوعة العلم', ur: 'سائنس کا ا تا ی' },
  atozSub: {
    en: 'Possible scientific readings — anchored in classical tafseer',
    ar: 'قراءات علمية محتملة — مع تثبيت التفسير الكلاسيكي',
    ur: 'ممکنہ سائنسی پہلو — کلاسیکی تفسیر کی روشنی میں',
  },
  searchPlaceholder: {
    en: 'Search topics, verses, scientists…',
    ar: 'ابحث في المواضيع والآيات والعلماء…',
    ur: 'موضوعات، آیات، سائنسدان تلاش کریں…',
  },
  noResults: { en: 'No results.', ar: 'لا توجد نتائج.', ur: 'کوئی نتیجہ نہیں۔' },
  // scientists
  scientistsTitle: { en: 'Muslim Scientists', ar: 'علماء المسلمين', ur: 'مسلم سائنسدان' },
  scientistsSub: {
    en: '50 figures from Ibn Sīnā to the modern age',
    ar: 'خمسون عالمًا من ابن سينا إلى اليوم',
    ur: '۵۰ شخصیات ابن سینا سے جدید دور تک',
  },
  allEras: { en: 'All eras', ar: 'كل العصور', ur: 'تمام ادوار' },
  allFields: { en: 'All fields', ar: 'كل المجالات', ur: 'تمام شعبے' },
  region: { en: 'Region', ar: 'المنطقة', ur: 'علاقہ' },
  died: { en: 'd.', ar: 'تـ.', ur: 'و.' },
  fields: { en: 'Fields', ar: 'المجالات', ur: 'شعبے' },
  summary: { en: 'Summary', ar: 'نبذة', ur: 'خلاصہ' },
  discoveries: { en: 'Discoveries', ar: 'الاكتشافات', ur: 'دریافتیں' },
  quranLink: { en: 'Quran & Sunnah connection', ar: 'الصلة بالقرآن والسنة', ur: 'قرآن و سنت سے ربط' },
  westernAck: { en: 'Western acknowledgment', ar: 'اعتراف الغرب', ur: 'مغربی اعتراف' },
  authoringInProgress: {
    en: 'Full biography authoring in progress — early seed entry.',
    ar: 'تأليف السيرة الكاملة جارٍ — مدخل أوّليّ.',
    ur: 'مکمل سوانح تیار ہو رہی ہے — ابتدائی مدخل۔',
  },
  // sheikh
  sheikhTitle: { en: 'Ask the AI Sheikh', ar: 'اسأل الشيخ', ur: 'AI شیخ سے پوچھیں' },
  sheikhSub: {
    en: 'Tafseer of any āyah · or ask for a scientific Qur’ānic verse on any topic',
    ar: 'تفسير أي آية · أو اطلب آية قرآنية علميّة في أي موضوع',
    ur: 'کسی بھی آیت کی تفسیر · یا کسی موضوع پر قرآنی سائنسی آیت طلب کریں',
  },
  sheikhAskHint: {
    en: 'Ask for a tafseer (e.g. “tafseer of 41:53”) or a scientific verse (e.g. “Qur’ān on embryology”)…',
    ar: 'اطلب تفسيرًا (مثل: «تفسير ٤١:٥٣») أو آية علميّة (مثل: «آيات الأجنّة»)…',
    ur: 'تفسیر طلب کریں (مثلاً «۴۱:۵۳ کی تفسیر») یا سائنسی آیت (مثلاً «جنین پر قرآن»)…',
  },
  send: { en: 'Send', ar: 'إرسال', ur: 'بھیجیں' },
  unlockTitle: {
    en: 'Unlock for £0.99',
    ar: 'افتح بـ ٠٫٩٩ جنيهًا إسترلينيًّا',
    ur: 'صرف £0.99 میں انلاک کریں',
  },
  unlockBody: {
    en: 'Lifetime access. 3 free AI Sheikh questions per week. Extra packs available.',
    ar: 'وصول مدى الحياة. ثلاثة أسئلة مجّانية للشيخ أسبوعيًّا. حزم إضافية متاحة.',
    ur: 'تاحیات رسائی۔ ہفتے میں ۳ مفت شیخ سوالات۔ مزید پیک دستیاب۔',
  },
  quotaRemaining: {
    en: 'free questions left this week',
    ar: 'أسئلة مجّانية متبقّية هذا الأسبوع',
    ur: 'اس ہفتے کے باقی مفت سوالات',
  },
  classicalPrimacy: {
    en: 'The traditional tafseer holds primacy. The scientific reading is an inference, not a doctrine. We have carefully grounded this AI in the four classical Sunni tafāsīr (Ibn Kathīr, al-Saʿdī, al-Muyassar, al-Jalālayn), the Qurʾān itself, and the authentic Sunnah. Despite this grounding effort, an AI is NOT a replacement for a real, qualified, living scholar (ʿālim) — for any serious religious matter please consult a living shaykh. Allah knows best.',
    ar: 'التفسير الكلاسيكي هو الأصل، والقراءة العلمية استنباطٌ لا عقيدة. لقد سعينا إلى تثبيت هذا الذكاء الاصطناعي على التفاسير السنّية الكلاسيكية الأربعة (ابن كثير، السعدي، الميسر، الجلالين)، وعلى القرآن الكريم نفسه، والسنّة الصحيحة. ومع ذلك، فإن الذكاء الاصطناعي ليس بديلاً عن عالمٍ حقيقي مؤهَّلٍ حيّ — لأيّ مسألة دينية جدّية، يُرجى الرجوع إلى شيخٍ حيٍّ. والله أعلم.',
    ur: 'کلاسیکی تفسیر اصل ہے؛ سائنسی قراءت ایک اخذِ مفہوم ہے، نہ کہ عقیدہ۔ ہم نے اس AI کو چار کلاسیکی سنی تفاسیر (ابن کثیر، السعدی، المیسر، الجلالین)، خود قرآنِ کریم، اور صحیح سنت پر احتیاط سے مبنی کیا ہے۔ پھر بھی AI کسی حقیقی، اہل، زندہ عالم کا متبادل ہرگز نہیں — کسی بھی سنجیدہ دینی مسئلے کے لیے کسی زندہ شیخ سے رجوع فرمائیں۔ واللہ اعلم۔',
  },
  // bookmarks
  bookmarks: { en: 'Bookmarks', ar: 'المحفوظات', ur: 'بُک مارک' },
  bookmarksEmpty: {
    en: 'No bookmarks yet. Tap the bookmark icon on any scientist, topic, or verse to save it here.',
    ar: 'لا توجد محفوظات بعد. اضغط أيقونة الحفظ على أي عالم أو موضوع أو آية لإضافتها هنا.',
    ur: 'ابھی کوئی بک مارک نہیں۔ کسی سائنسدان، موضوع یا آیت پر بک مارک آئیکن دبائیں۔',
  },
  bmScientists: { en: 'Scientists', ar: 'العلماء', ur: 'سائنسدان' },
  bmTopics: { en: 'Topics', ar: 'مواضيع', ur: 'موضوعات' },
  bmVerses: { en: 'Verses', ar: 'الآيات', ur: 'آیات' },
  saved: { en: 'Saved', ar: 'تم الحفظ', ur: 'محفوظ' },
  removed: { en: 'Removed', ar: 'تمت الإزالة', ur: 'ہٹا دیا' },
  // misc
  back: { en: 'Back', ar: 'رجوع', ur: 'واپس' },
  settings: { en: 'Settings', ar: 'الإعدادات', ur: 'ترتیبات' },
  language: { en: 'Language', ar: 'اللغة', ur: 'زبان' },
  english: { en: 'English', ar: 'الإنجليزية', ur: 'انگریزی' },
  arabic: { en: 'Arabic', ar: 'العربية', ur: 'عربی' },
  urdu: { en: 'Urdu', ar: 'الأردية', ur: 'اردو' },
  comingSoon: { en: 'Coming soon', ar: 'قريبًا', ur: 'جلد آرہا ہے' },
  about: { en: 'About', ar: 'حول', ur: 'بارے میں' },
  aboutBody: {
    en: 'Rooted in the ʿaqīdah of Ahl al-Sunnah wa\'l-Jamāʿah. All AI answers cite classical tafseer — Ibn Kathīr, al-Saʿdī, al-Muyassar, and al-Jalālayn.',
    ar: 'مبنيٌّ على عقيدة أهل السنّة والجماعة. كل إجابات الذكاء الاصطناعي تستشهد بالتفسير الكلاسيكي — ابن كثير والسعدي والميسر والجلالين.',
    ur: 'اہلِ سنت و الجماعت کے عقیدے پر مبنی۔ تمام AI جوابات کلاسیکی تفسیر — ابن کثیر، السعدی، المیسر، اور الجلالین — کے حوالے سے ہیں۔',
  },
  // ── Phase 2 aggressive sweep (auto-injected) ──
  a3_about_forMyBelovedFather: { en: 'FOR MY BELOVED FATHER', ar: 'لِأَبِي الْغَالِي', ur: 'میرے پیارے والدِ محترم کے لیے' },
  a3_about_muhammadAmin: { en: 'Muhammad Amin', ar: 'Muhammad Amin', ur: 'محمد امین' },
  a3_about_mahmoodTarajia: { en: 'Mahmood Tarajia', ar: 'Mahmood Tarajia', ur: 'محمود تراجیا' },
  a3_about_spiritualMashIkh: { en: 'SPIRITUAL MASHĀʾIKH', ar: 'الْمَشَايِخُ الرُّوحَانِيُّونَ', ur: 'روحانی مشائخ' },
  a3_about_hadratShaykhAbdurRaMNaqshband: { en: 'Hadrat Shaykh ʿAbdur Raḥīm Naqshbandī', ar: 'Hadrat Shaykh ʿAbdur Raḥīm Naqshbandī', ur: 'حضرت شیخ عبد الرحیم نقشبندی' },
  a3_about_chakwLRecentlyPassedRaMatull: { en: 'Chakwāl · recently passed (Raḥmatullāhi ʿalayhi)', ar: 'Chakwāl · تُوُفِّيَ حَدِيثًا (Raḥmatullāhi ʿalayhi)', ur: 'چکوال · حال ہی میں وصال فرما گئے (رحمۃ اللہ علیہ)' },
  a3_about_hadratShaykhZulfiqRAMad: { en: 'Hadrat Shaykh Zulfiqār Aḥmad Naqshbandī', ar: 'Hadrat Shaykh Zulfiqār Aḥmad Naqshbandī', ur: 'حضرت شیخ ذوالفقار احمد نقشبندی' },
  a3_about_myTeachersAsTidhah: { en: 'MY TEACHERS · ASĀTIDHAH', ar: 'أَسَاتِذَتِي', ur: 'میرے اساتذہ کرام' },
  a3_about_belovedUstDAfiAhullH: { en: 'Beloved Ustād (ḥafiẓahullāh)', ar: 'أُسْتَاذِي الْغَالِي (ḥafiẓahullāh)', ur: 'پیارے استاد (حفظہ اللہ)' },
  a3_about_hadratMuftAMadKhNp: { en: 'Hadrat Muftī Aḥmad Khānpūrī', ar: 'Hadrat Muftī Aḥmad Khānpūrī', ur: 'حضرت مفتی احمد خانپوری' },
  a3_about_jMiAIslMiyyahTa: { en: 'Jāmiʿa Islāmiyyah Taʿlīmuddīn, Dhabel', ar: 'Jāmiʿa Islāmiyyah Taʿlīmuddīn, Dhabel', ur: 'جامعہ اسلامیہ تعلیم الدین، ڈابھیل' },
  a3_about_passedRaMatullHiAlayhim: { en: 'Passed (Raḥmatullāhi ʿalayhim)', ar: 'تُوُفُّوا (Raḥmatullāhi ʿalayhim)', ur: 'وصال فرما گئے (رحمۃ اللہ علیہم)' },
  a3_about_livingAfiAhumAllH: { en: 'Living (ḥafiẓahum-Allāh)', ar: 'أَحْيَاءٌ (ḥafiẓahum-Allāh)', ur: 'حیات (حفظہم اللہ)' },
  a3_about_sisterAppsTreasuresOfTheSacred: { en: 'Sister apps: Treasures of the Sacred Qurʾān · Interpretation of Dreams', ar: 'التَّطْبِيقَاتُ الشَّقِيقَةُ: Treasures of the Sacred Qurʾān · Interpretation of Dreams', ur: 'دیگر ایپس: Treasures of the Sacred Qurʾān · تعبیرِ خواب' },
  a3_about_aiDisclaimer: { en: 'AI DISCLAIMER', ar: 'إِخْلَاءُ مَسْؤُولِيَّةِ الذَّكَاءِ الاصْطِنَاعِيِّ', ur: 'مصنوعی ذہانت (AI) سے متعلق ضروری وضاحت' },
  a3_slug_notFound: { en: 'Not found', ar: 'غَيْرُ مَوْجُودٍ', ur: 'نہیں ملا' },
  a3_key_verseNotFound: { en: 'Verse not found', ar: 'الْآيَةُ غَيْرُ مَوْجُودَةٍ', ur: 'آیت نہیں ملی' },

};

export function t(key: keyof typeof STR, lang?: Lang): string {
  const row = STR[key as string];
  const useLang = lang ?? _activeLang;
  if (!row) return String(key);
  return row[useLang] ?? row.en;
}

// ── Module-level active language (kept in sync with the useApp Zustand store) ──
// Auto-wired t() calls (without explicit lang arg) read from this. The store
// subscription in src/i18n/bridge.ts updates this whenever the user picks a
// language in Settings, so screens re-render through normal Zustand selectors
// AND helper t('key') calls return the right translation.
let _activeLang: Lang = 'en';
export function setActiveLang(l: Lang): void { _activeLang = l; }
export function currentLang(): Lang { return _activeLang; }

