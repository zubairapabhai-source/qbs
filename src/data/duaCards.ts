/**
 * Duʿā Cards data — 100% original typography-based Islamic stickers.
 *
 * No image assets required — every sticker is rendered from Arabic
 * Unicode text plus transliteration. Ships OTA-safe.
 *
 * Two catalogues:
 *   DUA_STICKERS    — short remembrance phrases the user can drop
 *                     onto a card (Bismillāh, Alḥamdulillāh, MashāAllāh…)
 *   CARD_TEMPLATES  — occasion cards (Jumuʿah, Ramadan, Get well, In
 *                     loving memory, New baby, Nikāḥ, Safe travels…)
 *                     each with a gradient + a default sticker + a
 *                     default personal-message placeholder.
 *
 * Everything is trilingual (EN / AR / UR) so the same catalogue works
 * across Treasures, Dreams, and QBS.
 */

export type Trilingual = { en: string; ar: string; ur: string };

// ── DUʿĀ STICKERS ────────────────────────────────────────────────
// Short remembrance / adhkār phrases the user drops onto a card.
// `ar` is the calligraphy centrepiece; `en` and `ur` show as a soft
// transliteration under it if the user wants meaning shown.

export interface DuaSticker {
  id: string;
  ar: string;                // main Arabic phrase (calligraphy)
  translit: string;          // Roman transliteration
  meaning: Trilingual;       // short one-line meaning
  category: 'praise' | 'greeting' | 'seeking' | 'blessing' | 'protection' | 'sabr' | 'occasion';
}

export const DUA_STICKERS: DuaSticker[] = [
  // ── Featured / Newly added ────────────────────────────────────
  {
    id: 'ameen-ya-rabb', ar: 'آمِين يَا رَبَّ الْعَالَمِين', translit: 'Āmīn yā Rabb al-ʿālamīn',
    category: 'blessing',
    meaning: {
      en: 'Āmīn — O Lord of all creation',
      ar: 'آمين يا رب العالمين',
      ur: 'آمین، اے سارے جہانوں کے رب',
    },
  },
  {
    id: 'khair-afiyat-dunya-akhira',
    ar: 'اَللّٰهُمَّ ارْزُقْنَا خَيْرَ الدُّنْيَا وَالْآخِرَةِ وَعَافِيَتَهُمَا',
    translit: 'Allāhumma-rzuqnā khayra-d-dunyā wa-l-ākhirati wa ʿāfiyatahumā',
    category: 'seeking',
    meaning: {
      en: 'O Allāh, grant us the good of this world and the next, and well-being in both',
      ar: 'اللهم ارزقنا خير الدنيا والآخرة وعافيتهما',
      ur: 'اے اللہ! ہمیں دونوں جہاں کی خیر و عافیت عطاء فرما',
    },
  },
  // ── Original set ─────────────────────────────────────────────
  {
    id: 'bismillah', ar: 'بِسْمِ اللّٰهِ', translit: 'Bismillāh',
    category: 'praise',
    meaning: {
      en: 'In the name of Allāh',
      ar: 'بسم الله',
      ur: 'اللہ کے نام سے',
    },
  },
  {
    id: 'alhamdulillah', ar: 'اَلْحَمْدُ لِلّٰهِ', translit: 'Alḥamdulillāh',
    category: 'praise',
    meaning: {
      en: 'All praise is for Allāh',
      ar: 'الحمد لله',
      ur: 'تمام تعریفیں اللہ کے لیے',
    },
  },
  {
    id: 'mashallah', ar: 'مَا شَاۤءَ اللّٰهُ', translit: 'MāshāʾAllāh',
    category: 'praise',
    meaning: {
      en: 'What Allāh has willed',
      ar: 'ما شاء الله',
      ur: 'جو اللہ نے چاہا',
    },
  },
  {
    id: 'subhanallah', ar: 'سُبْحَانَ اللّٰهِ', translit: 'SubḥānAllāh',
    category: 'praise',
    meaning: {
      en: 'Glory be to Allāh',
      ar: 'سبحان الله',
      ur: 'اللہ پاک ہے',
    },
  },
  {
    id: 'allahu-akbar', ar: 'اَللّٰهُ أَكْبَرُ', translit: 'Allāhu Akbar',
    category: 'praise',
    meaning: {
      en: 'Allāh is Greatest',
      ar: 'الله أكبر',
      ur: 'اللہ سب سے بڑا ہے',
    },
  },
  {
    id: 'shahada', ar: 'لَاۤ إِلٰهَ إِلَّا اللّٰهُ', translit: 'Lā ilāha illā-llāh',
    category: 'praise',
    meaning: {
      en: 'There is no god but Allāh',
      ar: 'لا إله إلا الله',
      ur: 'اللہ کے سوا کوئی معبود نہیں',
    },
  },
  {
    id: 'astaghfirullah', ar: 'أَسْتَغْفِرُ اللّٰهَ', translit: 'Astaghfirullāh',
    category: 'seeking',
    meaning: {
      en: 'I seek forgiveness from Allāh',
      ar: 'أستغفر الله',
      ur: 'میں اللہ سے مغفرت مانگتا ہوں',
    },
  },
  {
    id: 'salaam', ar: 'اَلسَّلَامُ عَلَيْكُمْ', translit: 'As-salāmu ʿalaykum',
    category: 'greeting',
    meaning: {
      en: 'Peace be upon you',
      ar: 'السلام عليكم',
      ur: 'آپ پر سلامتی ہو',
    },
  },
  {
    id: 'wa-alaykum', ar: 'وَعَلَيْكُمُ السَّلَامُ', translit: 'Wa-ʿalaykumus-salām',
    category: 'greeting',
    meaning: {
      en: 'And upon you be peace',
      ar: 'وعليكم السلام',
      ur: 'اور آپ پر بھی سلامتی',
    },
  },
  {
    id: 'jazak', ar: 'جَزَاكَ اللّٰهُ خَيْرًا', translit: 'JazākAllāhu Khayran',
    category: 'blessing',
    meaning: {
      en: 'May Allāh reward you with good',
      ar: 'جزاك الله خيرًا',
      ur: 'اللہ آپ کو اچھی جزا دے',
    },
  },
  {
    id: 'barakallah', ar: 'بَارَكَ اللّٰهُ فِيكَ', translit: 'Bārakallāhu fīk',
    category: 'blessing',
    meaning: {
      en: 'May Allāh bless you',
      ar: 'بارك الله فيك',
      ur: 'اللہ آپ میں برکت دے',
    },
  },
  {
    id: 'inshallah', ar: 'إِنْ شَاۤءَ اللّٰهُ', translit: 'InshāʾAllāh',
    category: 'blessing',
    meaning: {
      en: 'If Allāh wills',
      ar: 'إن شاء الله',
      ur: 'اگر اللہ نے چاہا',
    },
  },
  {
    id: 'ameen', ar: 'آمِين', translit: 'Āmīn',
    category: 'blessing',
    meaning: {
      en: 'So may it be',
      ar: 'آمين',
      ur: 'قبول فرما',
    },
  },
  {
    id: 'hasbi', ar: 'حَسْبُنَا اللّٰهُ وَنِعْمَ الْوَكِيلُ', translit: 'Ḥasbunallāhu wa niʿmal-wakīl',
    category: 'protection',
    meaning: {
      en: 'Allāh is sufficient for us and the best Guardian',
      ar: 'حسبنا الله ونعم الوكيل',
      ur: 'اللہ ہمیں کافی ہے اور بہترین وکیل',
    },
  },
  {
    id: 'fi-amanillah', ar: 'فِي أَمَانِ اللّٰهِ', translit: 'Fī amānillāh',
    category: 'protection',
    meaning: {
      en: 'In Allāh\'s protection',
      ar: 'في أمان الله',
      ur: 'اللہ کی حفاظت میں',
    },
  },
  {
    id: 'inna-lillahi', ar: 'إِنَّا لِلّٰهِ وَإِنَّاۤ إِلَيْهِ رَاجِعُونَ', translit: 'Innā lillāhi wa innā ilayhi rājiʿūn',
    category: 'sabr',
    meaning: {
      en: 'Indeed we belong to Allāh and to Him we return',
      ar: 'إنا لله وإنا إليه راجعون',
      ur: 'ہم اللہ کے لیے ہیں اور اسی کی طرف لوٹنا ہے',
    },
  },
  {
    id: 'sabr-jameel', ar: 'صَبْرٌ جَمِيلٌ', translit: 'Ṣabrun jamīl',
    category: 'sabr',
    meaning: {
      en: 'Beautiful patience',
      ar: 'صبر جميل',
      ur: 'خوبصورت صبر',
    },
  },
  {
    id: 'jumua-mubarak', ar: 'جُمُعَة مُبَارَكَة', translit: 'Jumuʿah Mubārakah',
    category: 'occasion',
    meaning: {
      en: 'Blessed Friday',
      ar: 'جمعة مباركة',
      ur: 'مبارک جمعہ',
    },
  },
  {
    id: 'ramadan-mubarak', ar: 'رَمَضَان مُبَارَك', translit: 'Ramaḍān Mubārak',
    category: 'occasion',
    meaning: {
      en: 'Blessed Ramadan',
      ar: 'رمضان مبارك',
      ur: 'مبارک رمضان',
    },
  },
  {
    id: 'eid-mubarak', ar: 'عِيد مُبَارَك', translit: 'ʿĪd Mubārak',
    category: 'occasion',
    meaning: {
      en: 'Blessed Eid',
      ar: 'عيد مبارك',
      ur: 'مبارک عید',
    },
  },
  {
    id: 'rabbi-zidni', ar: 'رَبِّ زِدْنِي عِلْمًا', translit: 'Rabbī zidnī ʿilmā',
    category: 'seeking',
    meaning: {
      en: 'My Lord, increase me in knowledge',
      ar: 'رب زدني علمًا',
      ur: 'اے میرے رب، میرے علم میں اضافہ فرما',
    },
  },
  {
    id: 'la-hawla', ar: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ', translit: 'Lā ḥawla wa lā quwwata illā billāh',
    category: 'protection',
    meaning: {
      en: 'There is no power except with Allāh',
      ar: 'لا حول ولا قوة إلا بالله',
      ur: 'گناہ سے بچنے اور نیکی کی طاقت صرف اللہ سے ہے',
    },
  },
  // ── Added — Salawāt on the Prophet ﷺ ────────────────────────
  {
    id: 'salawat', ar: 'اَللّٰهُمَّ صَلِّ عَلٰى مُحَمَّد', translit: 'Allāhumma ṣalli ʿalā Muḥammad',
    category: 'praise',
    meaning: {
      en: 'O Allāh, send blessings upon Muḥammad ﷺ',
      ar: 'اللهم صل على محمد',
      ur: 'اے اللہ! محمد ﷺ پر درود بھیج',
    },
  },
  {
    id: 'sallallahu', ar: 'صَلَّى اللّٰهُ عَلَيْهِ وَسَلَّم', translit: 'Ṣallallāhu ʿalayhi wa sallam',
    category: 'praise',
    meaning: {
      en: 'Peace and blessings be upon him ﷺ',
      ar: 'صلى الله عليه وسلم',
      ur: 'اللہ ان پر رحمت اور سلامتی بھیجے',
    },
  },
  // ── Added — extra remembrance & petitions ─────────────────
  {
    id: 'tabarak',
    ar: 'تَبَارَكَ اللّٰهُ', translit: 'Tabārak Allāh',
    category: 'praise',
    meaning: {
      en: 'Blessed is Allāh',
      ar: 'تبارك الله',
      ur: 'اللہ بہت برکت والا ہے',
    },
  },
  {
    id: 'la-tahzan',
    ar: 'لَا تَحْزَنْ إِنَّ اللّٰهَ مَعَنَا', translit: 'Lā taḥzan inna-llāha maʿanā',
    category: 'protection',
    meaning: {
      en: 'Do not grieve — indeed Allāh is with us',
      ar: 'لا تحزن إن الله معنا',
      ur: 'غم نہ کر، بےشک اللہ ہمارے ساتھ ہے',
    },
  },
  {
    id: 'rabbi-yassir',
    ar: 'رَبِّ يَسِّرْ وَلَا تُعَسِّرْ', translit: 'Rabbi yassir wa lā tuʿassir',
    category: 'seeking',
    meaning: {
      en: 'My Lord, make it easy — do not make it hard',
      ar: 'رب يسر ولا تعسر',
      ur: 'اے میرے رب! آسان فرما، مشکل نہ کر',
    },
  },
  {
    id: 'hasbunallah-short',
    ar: 'حَسْبِيَ اللّٰهُ', translit: 'Ḥasbiya-llāh',
    category: 'protection',
    meaning: {
      en: 'Allāh is enough for me',
      ar: 'حسبي الله',
      ur: 'اللہ میرے لیے کافی ہے',
    },
  },
  {
    id: 'tawakkalt',
    ar: 'تَوَكَّلْتُ عَلَى اللّٰهِ', translit: 'Tawakkaltu ʿalallāh',
    category: 'protection',
    meaning: {
      en: 'I place my trust in Allāh',
      ar: 'توكلت على الله',
      ur: 'میں نے اللہ پر توکل کیا',
    },
  },
  {
    id: 'alhamdulillah-ala-kulli-hal',
    ar: 'اَلْحَمْدُ لِلّٰهِ عَلٰى كُلِّ حَال', translit: 'Alḥamdulillāhi ʿalā kulli ḥāl',
    category: 'sabr',
    meaning: {
      en: 'All praise to Allāh in every state',
      ar: 'الحمد لله على كل حال',
      ur: 'ہر حال میں اللہ کا شکر',
    },
  },
  {
    id: 'shukran-lillah',
    ar: 'شُكْرًا لِلّٰهِ', translit: 'Shukran lillāh',
    category: 'praise',
    meaning: {
      en: 'Thanks be to Allāh',
      ar: 'شكرًا لله',
      ur: 'اللہ کا شکر',
    },
  },
  {
    id: 'ameen-wa-laka',
    ar: 'آمِين وَلَكَ بِالْمِثْلِ', translit: 'Āmīn wa laka bil-mithl',
    category: 'blessing',
    meaning: {
      en: 'Āmīn — and the same to you',
      ar: 'آمين ولك بالمثل',
      ur: 'آمین، اور آپ کے لیے بھی ایسا ہی',
    },
  },
  {
    id: 'wa-iyyakum',
    ar: 'وَإِيَّاكُم', translit: 'Wa iyyākum',
    category: 'blessing',
    meaning: {
      en: 'And to you (in reply to JazākAllāh)',
      ar: 'وإياكم',
      ur: 'اور آپ کو بھی',
    },
  },
  {
    id: 'taqabbal',
    ar: 'تَقَبَّلَ اللّٰهُ مِنَّا وَمِنْكُم', translit: 'Taqabbal Allāhu minnā wa minkum',
    category: 'occasion',
    meaning: {
      en: 'May Allāh accept from us and you',
      ar: 'تقبل الله منا ومنكم',
      ur: 'اللہ ہماری اور آپ کی طرف سے قبول فرمائے',
    },
  },
  {
    id: 'ma-shaa-tabarakallah',
    ar: 'مَا شَاۤءَ اللّٰهُ تَبَارَكَ اللّٰه', translit: 'MāshāʾAllāh tabārak Allāh',
    category: 'blessing',
    meaning: {
      en: 'What Allāh willed — blessed is Allāh',
      ar: 'ما شاء الله تبارك الله',
      ur: 'جو اللہ نے چاہا — اللہ برکت والا ہے',
    },
  },
  {
    id: 'jazakumallah',
    ar: 'جَزَاكُمُ اللّٰهُ خَيْرًا', translit: 'JazākumAllāhu Khayran',
    category: 'blessing',
    meaning: {
      en: 'May Allāh reward you all with good',
      ar: 'جزاكم الله خيرًا',
      ur: 'اللہ آپ سب کو اچھی جزا دے',
    },
  },
  {
    id: 'yarhamukallah',
    ar: 'يَرْحَمُكَ اللّٰه', translit: 'Yarḥamuk-Allāh',
    category: 'blessing',
    meaning: {
      en: 'May Allāh have mercy on you (reply to a sneeze)',
      ar: 'يرحمك الله',
      ur: 'اللہ تم پر رحم فرمائے',
    },
  },
  {
    id: 'khayr-inshaallah',
    ar: 'خَيْر إِن شَاءَ اللّٰه', translit: 'Khayr inshāʾAllāh',
    category: 'blessing',
    meaning: {
      en: 'All goodness, if Allāh wills',
      ar: 'خير إن شاء الله',
      ur: 'اگر اللہ نے چاہا، سب خیر ہو گی',
    },
  },
  {
    id: 'kun-fayakun',
    ar: 'كُنْ فَيَكُونُ', translit: 'Kun fa-yakūn',
    category: 'praise',
    meaning: {
      en: '"Be", and it is',
      ar: 'كن فيكون',
      ur: '"ہو جا"، اور وہ ہو جاتا ہے',
    },
  },
];

export const DUA_CATEGORY_LABEL: Record<DuaSticker['category'], Trilingual> = {
  praise:     { en: 'Praise',     ar: 'الحمد',     ur: 'حمد' },
  greeting:   { en: 'Greeting',   ar: 'التحية',    ur: 'سلام' },
  seeking:    { en: 'Seeking',    ar: 'الطلب',     ur: 'دعا' },
  blessing:   { en: 'Blessing',   ar: 'الدعاء',    ur: 'برکت' },
  protection: { en: 'Protection', ar: 'الحماية',   ur: 'حفاظت' },
  sabr:       { en: 'Sabr',       ar: 'الصبر',     ur: 'صبر' },
  occasion:   { en: 'Occasion',   ar: 'المناسبة',  ur: 'موقع' },
};

// ── CARD TEMPLATES ───────────────────────────────────────────────
// Each template is an occasion (Jumuʿah Mubārak, get well, Nikāḥ…)
// with a colour gradient + a default sticker + a default personal
// message the user can freely edit.
//
// The visual gradient uses two hex colours from top-left to bottom-
// right, and an accent gold used for the sticker text.

export interface CardTemplate {
  id: string;
  emoji: string;                     // small tile emoji, not on card
  title: Trilingual;
  gradient: [string, string];        // [top, bottom]
  accent: string;                    // main text colour (gold-family)
  motif: 'crescent' | 'star' | 'lantern' | 'heart' | 'flower' | 'geometry' | 'palm' | 'kaaba';
  defaultStickerId: string;          // maps to DUA_STICKERS
  defaultMessage: Trilingual;        // personal note text the user can edit
}

export const CARD_TEMPLATES: CardTemplate[] = [
  {
    id: 'jumua',
    emoji: '🕌',
    title: { en: 'Jumuʿah Mubārak', ar: 'جمعة مباركة', ur: 'جمعہ مبارک' },
    gradient: ['#0F172A', '#1E3A5F'],
    accent: '#D4AF37',
    motif: 'crescent',
    defaultStickerId: 'jumua-mubarak',
    defaultMessage: {
      en: 'May this blessed Friday bring peace to your heart and mercy from your Lord.',
      ar: 'جعل الله جمعتك مباركة وقلبك مطمئنًا ورزقك موصولًا.',
      ur: 'اللہ آپ کا جمعہ مبارک بنائے، دل کو سکون اور رزق میں برکت عطا فرمائے۔',
    },
  },
  {
    id: 'ramadan',
    emoji: '🌙',
    title: { en: 'Ramaḍān Mubārak', ar: 'رمضان مبارك', ur: 'رمضان مبارک' },
    gradient: ['#0B4F3B', '#116B4F'],
    accent: '#F5D06F',
    motif: 'lantern',
    defaultStickerId: 'ramadan-mubarak',
    defaultMessage: {
      en: 'May your fasts be easy, your duʿās accepted, and your heart softened this Ramadan.',
      ar: 'تقبل الله صيامك وقيامك ودعاءك في هذا الشهر المبارك.',
      ur: 'اللہ آپ کے روزے، قیام اور دعائیں قبول فرمائے اس مبارک مہینے میں۔',
    },
  },
  {
    id: 'eid',
    emoji: '🎉',
    title: { en: 'ʿĪd Mubārak', ar: 'عيد مبارك', ur: 'عید مبارک' },
    gradient: ['#5B2A86', '#8E44AD'],
    accent: '#F5D06F',
    motif: 'star',
    defaultStickerId: 'eid-mubarak',
    defaultMessage: {
      en: 'Taqabbal Allāhu minnā wa minkum. Wishing you and your loved ones a joyous Eid.',
      ar: 'تقبل الله منا ومنكم. عيد سعيد لك ولأحبتك.',
      ur: 'تقبل اللہ منا و منکم۔ آپ اور آپ کے پیاروں کو خوشیوں بھری عید مبارک۔',
    },
  },
  {
    id: 'get-well',
    emoji: '🌿',
    title: { en: 'Shifāʾ — Get well soon', ar: 'شفاء عاجل', ur: 'جلد شفا' },
    gradient: ['#134E4A', '#0F766E'],
    accent: '#FDE68A',
    motif: 'flower',
    defaultStickerId: 'hasbi',
    defaultMessage: {
      en: 'May Allāh grant you complete shifāʾ — a healing that leaves behind no illness.',
      ar: 'شفاك الله شفاءً لا يغادر سقمًا. ألف سلامة.',
      ur: 'اللہ آپ کو ایسی شفا دے جس کے بعد کوئی بیماری باقی نہ رہے۔',
    },
  },
  {
    id: 'condolence',
    emoji: '🤍',
    title: { en: 'In loving memory', ar: 'رحمة الله عليه', ur: 'رحمۃ اللہ علیہ' },
    gradient: ['#1E293B', '#334155'],
    accent: '#E5E7EB',
    motif: 'geometry',
    defaultStickerId: 'inna-lillahi',
    defaultMessage: {
      en: 'May Allāh grant them Jannat al-Firdaws and give the family beautiful patience.',
      ar: 'رحمه الله رحمة واسعة وأدخله فسيح جناته وألهم الأهل الصبر والسلوان.',
      ur: 'اللہ ان کی مغفرت فرمائے، جنت الفردوس عطا کرے، اور اہلِ خانہ کو صبرِ جمیل دے۔',
    },
  },
  {
    id: 'new-baby',
    emoji: '👶',
    title: { en: 'A new arrival', ar: 'مولود جديد', ur: 'نئی خوشی' },
    gradient: ['#0F4C81', '#3B82C4'],
    accent: '#FDE68A',
    motif: 'heart',
    defaultStickerId: 'barakallah',
    defaultMessage: {
      en: 'BārakAllāhu lakuma fīl-mawhūb. May Allāh make them a coolness of your eyes.',
      ar: 'بارك الله لكما في الموهوب ورزقكما بره وشكر الواهب.',
      ur: 'بارک اللہ لکما فی الموھوب۔ اللہ اسے آپ کی آنکھوں کی ٹھنڈک بنائے۔',
    },
  },
  {
    id: 'nikah',
    emoji: '💍',
    title: { en: 'On your Nikāḥ', ar: 'في نكاحك', ur: 'نکاح مبارک' },
    gradient: ['#4C1D95', '#7C3AED'],
    accent: '#F5D06F',
    motif: 'flower',
    defaultStickerId: 'barakallah',
    defaultMessage: {
      en: 'BārakAllāhu laka wa bāraka ʿalayka, wa jamaʿa baynakumā fī khayr. Congratulations!',
      ar: 'بارك الله لك وبارك عليك وجمع بينكما في خير.',
      ur: 'بارک اللہ لک و بارک علیک، اور آپ دونوں کو خیر پر جمع فرمائے۔ مبارک ہو۔',
    },
  },
  {
    id: 'travel',
    emoji: '✈️',
    title: { en: 'Safe travels', ar: 'سلامة السفر', ur: 'سفر بخیر' },
    gradient: ['#0C4A6E', '#0891B2'],
    accent: '#FDE68A',
    motif: 'palm',
    defaultStickerId: 'fi-amanillah',
    defaultMessage: {
      en: 'Fī amānillāh — may Allāh fold up the earth for you and bring you back safe to us.',
      ar: 'في أمان الله. طوى الله لك البُعد وردك سالمًا غانمًا.',
      ur: 'اللہ کی حفاظت میں۔ اللہ آپ کا سفر آسان کرے اور خیریت سے واپس لائے۔',
    },
  },
  {
    id: 'thank-you',
    emoji: '🌸',
    title: { en: 'Thank you', ar: 'جزاك الله خيرًا', ur: 'شکریہ' },
    gradient: ['#7C2D12', '#C2410C'],
    accent: '#FDE68A',
    motif: 'flower',
    defaultStickerId: 'jazak',
    defaultMessage: {
      en: 'JazākAllāhu khayran — the reward with Allāh is far greater than any I could give.',
      ar: 'جزاك الله عني خير الجزاء وبارك في عمرك ورزقك.',
      ur: 'جزاک اللہ خیراً۔ اللہ کے پاس کا اجر میری ادائیگی سے کہیں بہتر ہے۔',
    },
  },
  {
    id: 'graduation',
    emoji: '🎓',
    title: { en: 'On your success', ar: 'مبارك نجاحك', ur: 'کامیابی مبارک' },
    gradient: ['#052E16', '#166534'],
    accent: '#FDE68A',
    motif: 'star',
    defaultStickerId: 'mashallah',
    defaultMessage: {
      en: 'MāshāʾAllāh — may Allāh make your knowledge a light for you and a rope to those who follow.',
      ar: 'ما شاء الله. جعل الله علمك نورًا وسببًا لهداية من بعدك.',
      ur: 'ماشاءاللہ۔ اللہ آپ کے علم کو آپ کے لیے نور اور دوسروں کے لیے راستہ بنائے۔',
    },
  },
  {
    id: 'salam',
    emoji: '🕊️',
    title: { en: 'Just Salām', ar: 'سلام', ur: 'سلام' },
    gradient: ['#1E1B4B', '#3730A3'],
    accent: '#F5D06F',
    motif: 'geometry',
    defaultStickerId: 'salaam',
    defaultMessage: {
      en: 'Thinking of you. May Allāh keep you safe, healthy, and near to Him always.',
      ar: 'أرسل إليك سلامي. حفظك الله وأسعدك وقربك إليه.',
      ur: 'آپ کو یاد کیا۔ اللہ آپ کو محفوظ، صحت مند، اور اپنے قریب رکھے۔',
    },
  },
  {
    id: 'birthday',
    emoji: '🌟',
    title: { en: 'Another year', ar: 'عام سعيد', ur: 'ایک اور سال' },
    gradient: ['#831843', '#BE185D'],
    accent: '#FDE68A',
    motif: 'star',
    defaultStickerId: 'barakallah',
    defaultMessage: {
      en: 'May Allāh bless every year that comes and make each one better than the last.',
      ar: 'بارك الله في عمرك وجعل قادم أيامك خيرًا من ماضيها.',
      ur: 'اللہ آپ کی عمر میں برکت دے اور ہر آنے والا سال پچھلے سے بہتر بنائے۔',
    },
  },
];

// Small helpers ─────────────────────────────────────────────────
export function getSticker(id: string): DuaSticker | undefined {
  return DUA_STICKERS.find((s) => s.id === id);
}

export function getTemplate(id: string): CardTemplate | undefined {
  return CARD_TEMPLATES.find((t) => t.id === id);
}
