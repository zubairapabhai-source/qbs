/**
 * Struggle-Themed Verses — hand-curated, Sharia-clean, ZERO-cost.
 *
 * Each struggle maps to 4 canonical Qurʾānic verses. Rotation is
 * deterministic (day-of-year mod verses.length) so:
 *   1. Every user on the same day sees the same verse (feels communal).
 *   2. No LLM / backend hit — 100% offline after first render.
 *
 * Translations use Sahih International (public domain) for English.
 * Urdu is Maulana Fateh Muhammad Jalandhri, Arabic is uthmani script.
 *
 * IMPORTANT: keep this list Sharia-clean, avoid contested verses,
 * and prefer āyāt that are widely used in ruqyah / duʿā practice.
 */
export type Struggle =
  | 'sabr'      // patience, grief, hardship
  | 'rizq'      // sustenance, financial worry
  | 'hasad'     // envy, comparing to others
  | 'waswas'    // anxiety, whispers, worry
  | 'shukr'     // gratitude, feeling ungrateful
  | 'wahsha'    // loneliness, feeling alone
  | 'ghadab'    // anger, temper
  | 'tawbah';   // regret, repentance

export interface TriString { en: string; ar: string; ur: string; }
export interface VerseEntry {
  ref: string;
  ar: string;
  translation: TriString;
}
export interface StruggleMeta {
  key: Struggle;
  emoji: string;
  label: TriString;
  body: TriString;
}

/** Ordered list of struggles for the picker. Emojis are gentle, not clownish. */
export const STRUGGLES: StruggleMeta[] = [
  {
    key: 'sabr', emoji: '🌿',
    label: { en: 'Patience', ar: 'الصبر', ur: 'صبر' },
    body: {
      en: 'When hardship weighs heavy — Allāh loves the patient.',
      ar: 'حين يثقل الابتلاء — والله يحب الصابرين.',
      ur: 'جب مصیبت بھاری ہو — اللّٰہ صبر کرنے والوں سے محبت رکھتا ہے۔',
    },
  },
  {
    key: 'rizq', emoji: '🌾',
    label: { en: 'Sustenance', ar: 'الرزق', ur: 'رزق' },
    body: {
      en: 'When money worries choke the heart — He is al-Razzāq.',
      ar: 'حين يخنق القلبَ همُّ المال — وهو الرزّاق.',
      ur: 'جب مال کی فکر دل کو گھیرے — وہی الرزّاق ہے۔',
    },
  },
  {
    key: 'hasad', emoji: '👁️',
    label: { en: 'Envy', ar: 'الحسد', ur: 'حسد' },
    body: {
      en: 'When comparing to others steals your peace.',
      ar: 'حين تسرق منك المقارنة راحتك.',
      ur: 'جب دوسروں سے مقابلہ آپ کا سکون چُرا لے۔',
    },
  },
  {
    key: 'waswas', emoji: '🌫️',
    label: { en: 'Anxiety', ar: 'الوسواس', ur: 'وسوسے' },
    body: {
      en: 'When fear and whispers cloud the mind.',
      ar: 'حين يُغيّم الوسواس والخوف الذهن.',
      ur: 'جب وسوسے اور خوف ذہن کو گھیر لیں۔',
    },
  },
  {
    key: 'shukr', emoji: '✨',
    label: { en: 'Gratitude', ar: 'الشكر', ur: 'شکر' },
    body: {
      en: 'To grow in thankfulness — He increases for those who thank.',
      ar: 'لتنمو في الشكر — يزيد لمن يشكر.',
      ur: 'شکر میں بڑھنا — شکر کرنے والوں کو وہ بڑھاتا ہے۔',
    },
  },
  {
    key: 'wahsha', emoji: '🌙',
    label: { en: 'Loneliness', ar: 'الوحشة', ur: 'تنہائی' },
    body: {
      en: 'When you feel alone — He is closer than the jugular vein.',
      ar: 'حين تشعر بالوحدة — وهو أقرب من حبل الوريد.',
      ur: 'جب تنہائی محسوس ہو — وہ شہ رگ سے بھی قریب ہے۔',
    },
  },
  {
    key: 'ghadab', emoji: '🔥',
    label: { en: 'Anger', ar: 'الغضب', ur: 'غصّہ' },
    body: {
      en: 'When anger wants the wheel — restrain it for His sake.',
      ar: 'حين يريد الغضب أن يقود — كظمه لله.',
      ur: 'جب غصہ قابو پانا چاہے — اسے اللّٰہ کی خاطر روکو۔',
    },
  },
  {
    key: 'tawbah', emoji: '🕊️',
    label: { en: 'Repentance', ar: 'التوبة', ur: 'توبہ' },
    body: {
      en: 'For the past that pains you — His mercy outruns His wrath.',
      ar: 'لماضٍ يؤلمك — رحمته سبقت غضبه.',
      ur: 'جو ماضی دل دُکھائے — اس کی رحمت غضب سے بڑھ کر ہے۔',
    },
  },
];

export const STRUGGLE_VERSES: Record<Struggle, VerseEntry[]> = {
  sabr: [
    {
      ref: 'Al-Baqarah 2:155–156',
      ar: 'وَبَشِّرِ ٱلصَّـٰبِرِينَ ٱلَّذِينَ إِذَآ أَصَـٰبَتْهُم مُّصِيبَةٌۭ قَالُوٓا۟ إِنَّا لِلَّهِ وَإِنَّآ إِلَيْهِ رَٰجِعُونَ',
      translation: {
        en: 'And give good tidings to the patient — those who, when disaster strikes them, say, "Indeed we belong to Allāh, and indeed to Him we will return."',
        ar: 'وبشّر الصابرين، الذين إذا أصابتهم مصيبة قالوا إنا لله وإنا إليه راجعون.',
        ur: 'اور صبر کرنے والوں کو خوشخبری دے دو، جنہیں مصیبت پڑنے پر کہتے ہیں: بیشک ہم اللّٰہ کے ہیں اور اسی کی طرف لوٹ کر جانے والے ہیں۔',
      },
    },
    {
      ref: 'Al-Baqarah 2:286',
      ar: 'لَا يُكَلِّفُ ٱللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
      translation: {
        en: 'Allāh does not burden a soul beyond that it can bear.',
        ar: 'لا يكلّف الله نفسًا إلا وسعها.',
        ur: 'اللّٰہ کسی جان پر اس کی طاقت سے زیادہ بوجھ نہیں ڈالتا۔',
      },
    },
    {
      ref: 'Ash-Sharh 94:5–6',
      ar: 'فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا',
      translation: {
        en: 'For indeed, with hardship [comes] ease. Indeed, with hardship [comes] ease.',
        ar: 'فإنّ مع العُسر يُسرا، إنّ مع العُسر يُسرا.',
        ur: 'پس بیشک تنگی کے ساتھ آسانی ہے، بیشک تنگی کے ساتھ آسانی ہے۔',
      },
    },
    {
      ref: 'Az-Zumar 39:10',
      ar: 'إِنَّمَا يُوَفَّى ٱلصَّـٰبِرُونَ أَجْرَهُم بِغَيْرِ حِسَابٍۢ',
      translation: {
        en: 'Indeed, the patient will be given their reward without measure.',
        ar: 'إنما يوفّى الصابرون أجرهم بغير حساب.',
        ur: 'بلاشبہ صبر کرنے والوں کو ان کا اجر بے حساب دیا جائے گا۔',
      },
    },
  ],
  rizq: [
    {
      ref: 'Aṭ-Ṭalāq 65:2–3',
      ar: 'وَمَن يَتَّقِ ٱللَّهَ يَجْعَل لَّهُۥ مَخْرَجًۭا ۝ وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ',
      translation: {
        en: 'Whoever fears Allāh — He will make for him a way out and provide for him from where he does not expect.',
        ar: 'ومن يتّق الله يجعل له مخرجا، ويرزقه من حيث لا يحتسب.',
        ur: 'اور جو اللّٰہ سے ڈرے، وہ اس کے لیے راستہ بنا دے گا اور اسے ایسی جگہ سے رزق دے گا جہاں سے اسے گمان بھی نہ ہو۔',
      },
    },
    {
      ref: 'Hūd 11:6',
      ar: 'وَمَا مِن دَآبَّةٍۢ فِى ٱلْأَرْضِ إِلَّا عَلَى ٱللَّهِ رِزْقُهَا',
      translation: {
        en: 'There is no creature on earth but that upon Allāh is its provision.',
        ar: 'وما من دابّة في الأرض إلا على الله رزقها.',
        ur: 'اور زمین میں کوئی چلنے والا نہیں مگر اس کا رزق اللّٰہ پر ہے۔',
      },
    },
    {
      ref: 'Al-ʿAnkabūt 29:60',
      ar: 'وَكَأَيِّن مِّن دَآبَّةٍۢ لَّا تَحْمِلُ رِزْقَهَا ٱللَّهُ يَرْزُقُهَا وَإِيَّاكُمْ',
      translation: {
        en: 'How many creatures carry not their own provision! It is Allāh who provides for them and for you.',
        ar: 'وكأيّن من دابة لا تحمل رزقها الله يرزقها وإياكم.',
        ur: 'اور کتنے ہی جانور ہیں جو اپنا رزق نہیں اٹھاتے، اللّٰہ ہی انہیں اور تمہیں رزق دیتا ہے۔',
      },
    },
    {
      ref: 'Adh-Dhāriyāt 51:22',
      ar: 'وَفِى ٱلسَّمَآءِ رِزْقُكُمْ وَمَا تُوعَدُونَ',
      translation: {
        en: 'And in the heaven is your provision and whatever you are promised.',
        ar: 'وفي السماء رزقكم وما توعدون.',
        ur: 'اور آسمان میں تمہارا رزق ہے اور جس کا تم سے وعدہ کیا جاتا ہے۔',
      },
    },
  ],
  hasad: [
    {
      ref: 'An-Nisāʾ 4:32',
      ar: 'وَلَا تَتَمَنَّوْا۟ مَا فَضَّلَ ٱللَّهُ بِهِۦ بَعْضَكُمْ عَلَىٰ بَعْضٍۢ',
      translation: {
        en: 'Do not wish for that by which Allāh has made some of you excel others.',
        ar: 'ولا تتمنّوا ما فضّل الله به بعضكم على بعض.',
        ur: 'اور اس کی آرزو نہ کرو جس میں اللّٰہ نے تم میں سے کسی کو کسی پر برتری دی ہے۔',
      },
    },
    {
      ref: 'Al-Falaq 113:5',
      ar: 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ',
      translation: {
        en: '…and from the evil of an envier when he envies.',
        ar: '… ومن شرّ حاسد إذا حسد.',
        ur: '…اور حسد کرنے والے کے شر سے جب وہ حسد کرے۔',
      },
    },
    {
      ref: 'Az-Zukhruf 43:32',
      ar: 'أَهُمْ يَقْسِمُونَ رَحْمَتَ رَبِّكَ',
      translation: {
        en: 'Is it they who distribute the mercy of your Lord?',
        ar: 'أهم يقسمون رحمة ربك؟',
        ur: 'کیا وہ آپ کے رب کی رحمت تقسیم کرتے ہیں؟',
      },
    },
    {
      ref: 'Ṭā-Hā 20:131',
      ar: 'وَلَا تَمُدَّنَّ عَيْنَيْكَ إِلَىٰ مَا مَتَّعْنَا بِهِۦٓ أَزْوَٰجًۭا مِّنْهُمْ',
      translation: {
        en: 'Do not extend your eyes toward that by which We have given enjoyment to [certain] categories of them.',
        ar: 'ولا تمدّنّ عينيك إلى ما متعنا به أزواجًا منهم.',
        ur: 'اور اپنی نگاہیں اس چیز کی طرف نہ اٹھاؤ جو ہم نے ان میں سے مختلف لوگوں کو دی ہیں۔',
      },
    },
  ],
  waswas: [
    {
      ref: 'Ar-Raʿd 13:28',
      ar: 'أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ',
      translation: {
        en: 'Verily, in the remembrance of Allāh do hearts find rest.',
        ar: 'ألا بذكر الله تطمئن القلوب.',
        ur: 'خبردار! اللّٰہ کے ذکر ہی سے دلوں کو اطمینان حاصل ہوتا ہے۔',
      },
    },
    {
      ref: 'An-Nās 114:4–5',
      ar: 'مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ ۝ ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ',
      translation: {
        en: 'From the evil of the retreating whisperer — who whispers in the breasts of mankind.',
        ar: 'من شرّ الوسواس الخنّاس، الذي يوسوس في صدور الناس.',
        ur: 'وسوسہ ڈالنے والے، پیچھے ہٹ جانے والے کے شر سے، جو لوگوں کے سینوں میں وسوسے ڈالتا ہے۔',
      },
    },
    {
      ref: 'At-Tawbah 9:51',
      ar: 'قُل لَّن يُصِيبَنَآ إِلَّا مَا كَتَبَ ٱللَّهُ لَنَا',
      translation: {
        en: 'Say, "Never will we be struck except by what Allāh has decreed for us."',
        ar: 'قل لن يصيبنا إلا ما كتب الله لنا.',
        ur: 'کہہ دو: ہمیں کبھی وہی پہنچے گا جو اللّٰہ نے ہمارے لیے لکھ دیا ہے۔',
      },
    },
    {
      ref: 'Al-Baqarah 2:216',
      ar: 'وَعَسَىٰٓ أَن تَكْرَهُوا۟ شَيْـًۭٔا وَهُوَ خَيْرٌۭ لَّكُمْ',
      translation: {
        en: 'Perhaps you dislike a thing while it is good for you.',
        ar: 'وعسى أن تكرهوا شيئًا وهو خير لكم.',
        ur: 'اور شاید تم کسی چیز کو ناپسند کرو حالانکہ وہ تمہارے حق میں بہتر ہو۔',
      },
    },
  ],
  shukr: [
    {
      ref: 'Ibrāhīm 14:7',
      ar: 'لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ',
      translation: {
        en: 'If you are grateful, I will surely increase you [in favour].',
        ar: 'لئن شكرتم لأزيدنّكم.',
        ur: 'اگر تم شکر کرو گے تو میں تمہیں یقیناً بڑھاؤں گا۔',
      },
    },
    {
      ref: 'Al-Baqarah 2:152',
      ar: 'فَٱذْكُرُونِىٓ أَذْكُرْكُمْ وَٱشْكُرُوا۟ لِى وَلَا تَكْفُرُونِ',
      translation: {
        en: 'So remember Me; I will remember you. And be grateful to Me and do not deny Me.',
        ar: 'فاذكروني أذكركم واشكروا لي ولا تكفرون.',
        ur: 'پس تم مجھے یاد کرو، میں تمہیں یاد کروں گا، اور میرا شکر کرو اور میری ناشکری نہ کرو۔',
      },
    },
    {
      ref: 'An-Naḥl 16:18',
      ar: 'وَإِن تَعُدُّوا۟ نِعْمَةَ ٱللَّهِ لَا تُحْصُوهَآ',
      translation: {
        en: 'And if you should count the favours of Allāh, you could not enumerate them.',
        ar: 'وإن تعدّوا نعمة الله لا تحصوها.',
        ur: 'اور اگر تم اللّٰہ کی نعمتوں کو گنو تو انہیں شمار نہ کر سکو گے۔',
      },
    },
    {
      ref: 'Luqmān 31:12',
      ar: 'وَمَن يَشْكُرْ فَإِنَّمَا يَشْكُرُ لِنَفْسِهِۦ',
      translation: {
        en: 'Whoever is grateful is grateful only for [the benefit of] himself.',
        ar: 'ومن يشكر فإنما يشكر لنفسه.',
        ur: 'اور جو شکر کرتا ہے وہ اپنے ہی لیے شکر کرتا ہے۔',
      },
    },
  ],
  wahsha: [
    {
      ref: 'Qāf 50:16',
      ar: 'وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ ٱلْوَرِيدِ',
      translation: {
        en: 'And We are closer to him than [his] jugular vein.',
        ar: 'ونحن أقرب إليه من حبل الوريد.',
        ur: 'اور ہم اس کی شہ رگ سے بھی زیادہ اس کے قریب ہیں۔',
      },
    },
    {
      ref: 'Al-Baqarah 2:186',
      ar: 'وَإِذَا سَأَلَكَ عِبَادِى عَنِّى فَإِنِّى قَرِيبٌ',
      translation: {
        en: 'When My servants ask you concerning Me — indeed I am near.',
        ar: 'وإذا سألك عبادي عنّي فإنّي قريب.',
        ur: 'اور جب میرے بندے آپ سے میرے بارے میں پوچھیں، تو بیشک میں قریب ہوں۔',
      },
    },
    {
      ref: 'Aḍ-Ḍuḥā 93:3',
      ar: 'مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ',
      translation: {
        en: 'Your Lord has not taken leave of you, nor has He detested [you].',
        ar: 'ما ودّعك ربك وما قلى.',
        ur: 'آپ کے رب نے آپ کو نہ چھوڑا ہے، اور نہ ہی وہ ناراض ہوا ہے۔',
      },
    },
    {
      ref: 'At-Tawbah 9:40',
      ar: 'لَا تَحْزَنْ إِنَّ ٱللَّهَ مَعَنَا',
      translation: {
        en: 'Do not grieve; indeed Allāh is with us.',
        ar: 'لا تحزن إنّ الله معنا.',
        ur: 'غم نہ کر، بیشک اللّٰہ ہمارے ساتھ ہے۔',
      },
    },
  ],
  ghadab: [
    {
      ref: 'Āl ʿImrān 3:134',
      ar: 'وَٱلْكَـٰظِمِينَ ٱلْغَيْظَ وَٱلْعَافِينَ عَنِ ٱلنَّاسِ',
      translation: {
        en: '…who restrain their anger and pardon the people.',
        ar: 'والكاظمين الغيظ والعافين عن الناس.',
        ur: '…اور جو غصہ پی جاتے ہیں اور لوگوں کو معاف کر دیتے ہیں۔',
      },
    },
    {
      ref: 'Ash-Shūrā 42:37',
      ar: 'وَإِذَا مَا غَضِبُوا۟ هُمْ يَغْفِرُونَ',
      translation: {
        en: '…and when they are angry, they forgive.',
        ar: 'وإذا ما غضبوا هم يغفرون.',
        ur: '…اور جب وہ غصہ ہوتے ہیں تو معاف کر دیتے ہیں۔',
      },
    },
    {
      ref: 'Al-Aʿrāf 7:199',
      ar: 'خُذِ ٱلْعَفْوَ وَأْمُرْ بِٱلْعُرْفِ وَأَعْرِضْ عَنِ ٱلْجَـٰهِلِينَ',
      translation: {
        en: 'Take what is given willingly, enjoin good, and turn away from the ignorant.',
        ar: 'خذ العفو وأمر بالعرف وأعرض عن الجاهلين.',
        ur: 'عفو اختیار کرو، نیکی کا حکم دو، اور جاہلوں سے منہ پھیر لو۔',
      },
    },
    {
      ref: 'Fuṣṣilat 41:34',
      ar: 'ٱدْفَعْ بِٱلَّتِى هِىَ أَحْسَنُ',
      translation: {
        en: 'Repel [evil] by that [deed] which is better.',
        ar: 'ادفع بالتي هي أحسن.',
        ur: 'برائی کو اس چیز سے دفع کرو جو بہترین ہو۔',
      },
    },
  ],
  tawbah: [
    {
      ref: 'Az-Zumar 39:53',
      ar: 'لَا تَقْنَطُوا۟ مِن رَّحْمَةِ ٱللَّهِ ۚ إِنَّ ٱللَّهَ يَغْفِرُ ٱلذُّنُوبَ جَمِيعًا',
      translation: {
        en: 'Do not despair of the mercy of Allāh. Indeed, Allāh forgives all sins.',
        ar: 'لا تقنطوا من رحمة الله، إنّ الله يغفر الذنوب جميعًا.',
        ur: 'اللّٰہ کی رحمت سے مایوس نہ ہو، بیشک اللّٰہ تمام گناہ بخش دیتا ہے۔',
      },
    },
    {
      ref: 'An-Nisāʾ 4:110',
      ar: 'وَمَن يَعْمَلْ سُوٓءًا أَوْ يَظْلِمْ نَفْسَهُۥ ثُمَّ يَسْتَغْفِرِ ٱللَّهَ يَجِدِ ٱللَّهَ غَفُورًۭا رَّحِيمًۭا',
      translation: {
        en: 'Whoever does wrong or wrongs himself but then seeks forgiveness of Allāh — will find Allāh Forgiving and Merciful.',
        ar: 'ومن يعمل سوءًا أو يظلم نفسه ثم يستغفر الله يجد الله غفورًا رحيمًا.',
        ur: 'اور جو بُرا کام کرے یا اپنی جان پر ظلم کرے پھر اللّٰہ سے مغفرت مانگے، وہ اللّٰہ کو بخشنے والا مہربان پائے گا۔',
      },
    },
    {
      ref: 'At-Taḥrīm 66:8',
      ar: 'يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوا۟ تُوبُوٓا۟ إِلَى ٱللَّهِ تَوْبَةًۭ نَّصُوحًۭا',
      translation: {
        en: 'O you who have believed, repent to Allāh with sincere repentance.',
        ar: 'يا أيها الذين آمنوا توبوا إلى الله توبة نصوحا.',
        ur: 'اے ایمان والو! اللّٰہ کے سامنے سچی توبہ کرو۔',
      },
    },
    {
      ref: 'Al-Anʿām 6:54',
      ar: 'كَتَبَ رَبُّكُمْ عَلَىٰ نَفْسِهِ ٱلرَّحْمَةَ',
      translation: {
        en: 'Your Lord has decreed upon Himself mercy.',
        ar: 'كتب ربّكم على نفسه الرحمة.',
        ur: 'تمہارے رب نے اپنے اوپر رحمت لازم کر لی ہے۔',
      },
    },
  ],
};

/** Deterministic pick for today — same day → same verse across all users
 *  (feels like a communal reflection). Uses day-of-year mod verse-count. */
export function verseForToday(struggle: Struggle, now: Date = new Date()): VerseEntry {
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  const dayOfYear = Math.floor(diff);
  const list = STRUGGLE_VERSES[struggle];
  return list[dayOfYear % list.length];
}
