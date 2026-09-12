/**
 * Trilingual strings for the QBS Ummah Passport screen.
 * Keys are `en/ar/ur` tuples so consumers just do:
 *   const t = pt('code_hint', lang);
 */
type Lang = 'en' | 'ar' | 'ur';

const S: Record<string, Record<Lang, string>> = {
  intro: {
    en: 'One anonymous link between your 3 Divine Series apps. Streaks unite, milestones celebrate, badges accrue. Each app still installs and unlocks separately for £0.99.',
    ar: 'رابط مجهول واحد بين تطبيقاتك الثلاثة. تتوحّد سلاسل النشاط، وتُحتفى بالمعالم، وتتراكم الأوسمة. كل تطبيق يُثبَّت ويُفتَح على حدة بـ ٠٫٩٩ جنيه.',
    ur: 'آپ کی 3 ڈیوائن سیریز ایپس کے درمیان ایک گمنام لنک۔ اسٹریک متحد، سنگ میل کی خوشی، اور بیج اکٹھے۔ ہر ایپ الگ سے £0.99 میں انسٹال اور انلاک ہوتی رہے گی۔',
  },
  your_passport_code: { en: 'YOUR PASSPORT CODE', ar: 'رمز جوازك', ur: 'آپ کا پاسپورٹ کوڈ' },
  code_meta: {
    en: 'Enter this in {apps} to complete the link. Valid 24h.',
    ar: 'أدخل هذا في {apps} لإكمال الرابط. صالح 24 ساعة.',
    ur: 'لنک مکمل کرنے کے لیے یہ {apps} میں درج کریں۔ 24 گھنٹے کے لیے درست۔',
  },
  copy_share: { en: 'Copy / share', ar: 'نسخ / مشاركة', ur: 'کاپی / شیئر' },
  refresh: { en: 'Refresh', ar: 'تحديث', ur: 'ریفریش' },
  all_linked_title: { en: 'All 3 apps linked', ar: 'كل التطبيقات الثلاثة مربوطة', ur: 'تینوں ایپس جڑ گئیں' },
  all_linked_body: {
    en: 'You have earned the Trinity badge. Streaks and milestones now sync.',
    ar: 'لقد كسبت وسام «الثلاثيّة». تتزامن سلاسل النشاط والمعالم الآن.',
    ur: 'آپ نے Trinity بیج حاصل کر لیا۔ اب اسٹریک اور سنگ میل مل کر چلیں گے۔',
  },
  got_code_title: { en: 'Got a code from a friend?', ar: 'حصلت على رمز من صديق؟', ur: 'دوست سے کوڈ ملا؟' },
  got_code_body_a: { en: 'Paste a Passport code, a bundle code, or a', ar: 'الصق رمز جواز أو رمز حزمة أو', ur: 'پاسپورٹ کوڈ، بنڈل کوڈ، یا' },
  got_code_body_b: { en: 'gift code', ar: 'رمز هديّة', ur: 'تحفہ کوڈ' },
  got_code_body_c: { en: 'here to link or unlock.', ar: 'هنا للربط أو الفتح.', ur: 'یہاں لنک یا انلاک کرنے کے لیے پیسٹ کریں۔' },
  paste_clipboard: { en: 'Paste from clipboard', ar: 'الصق من الحافظة', ur: 'کلپ بورڈ سے پیسٹ' },
  redeem_code: { en: 'Redeem code', ar: 'استرداد الرمز', ur: 'کوڈ استعمال کریں' },
  connected_apps: { en: 'CONNECTED APPS', ar: 'التطبيقات المرتبطة', ur: 'منسلک ایپس' },
  linked: { en: 'Linked', ar: 'مربوط', ur: 'منسلک' },
  not_linked: { en: 'Not yet linked', ar: 'غير مربوط بعد', ur: 'ابھی نہیں جڑا' },
  get: { en: 'Get', ar: 'احصل', ur: 'حاصل' },
  badges: { en: 'BADGES', ar: 'الأوسمة', ur: 'بیجز' },
  create_a_code: { en: 'Create a code', ar: 'أنشئ رمزًا', ur: 'کوڈ بنائیں' },
  create_body: {
    en: 'Generate a 6-character code, then enter the same code in your other apps.',
    ar: 'أنشئ رمزًا من 6 أحرف، ثم أدخل الرمز نفسه في تطبيقاتك الأخرى.',
    ur: '6-حرفی کوڈ بنائیں، پھر وہی کوڈ اپنی دوسری ایپس میں درج کریں۔',
  },
  generate_my_code: { en: 'Generate my code', ar: 'أنشئ الرمز', ur: 'میرا کوڈ بنائیں' },
  or: { en: 'OR', ar: 'أو', ur: 'یا' },
  enter_a_code: { en: 'Enter a code', ar: 'أدخل رمزًا', ur: 'کوڈ درج کریں' },
  enter_body_a: { en: 'Paste a Passport code from your other app, a bundle code, or a', ar: 'الصق رمز جواز من تطبيقك الآخر أو رمز حزمة أو', ur: 'اپنی دوسری ایپ سے پاسپورٹ کوڈ، بنڈل کوڈ، یا' },
  enter_body_b: { en: 'gift code', ar: 'رمز هديّة', ur: 'تحفہ کوڈ' },
  enter_body_c: { en: 'from a friend.', ar: 'من صديق.', ur: 'کسی دوست سے۔' },
  link_my_apps: { en: 'Link my apps', ar: 'اربط تطبيقاتي', ur: 'میری ایپس جوڑیں' },
  disclaimer: {
    en: '🔒 Anonymous · no name, no email · only three device-ids linked · you can un-link any time by reinstalling.',
    ar: '🔒 مجهول · بلا اسم أو بريد · ثلاثة معرّفات أجهزة فقط · يمكنك فكّ الرابط بإعادة التثبيت.',
    ur: '🔒 گمنام · نہ نام نہ ای میل · صرف تین ڈیوائس آئی ڈی جڑی ہیں · دوبارہ انسٹال کر کے آپ کبھی بھی لنک ختم کر سکتے ہیں۔',
  },
  a_copy_pw_toast: { en: 'Copied', ar: 'تم النسخ', ur: 'کاپی ہو گیا' },
  a_copy_body: { en: 'Passport instructions copied to your clipboard.', ar: 'تم نسخ تعليمات الجواز إلى الحافظة.', ur: 'پاسپورٹ ہدایات کلپ بورڈ پر کاپی ہو گئیں۔' },
  a_create_fail_title: { en: 'Could not create', ar: 'تعذّر الإنشاء', ur: 'بنایا نہیں جا سکا' },
  a_create_fail_body: { en: 'Try again in a moment.', ar: 'حاول مرة أخرى بعد لحظة.', ur: 'کچھ دیر بعد دوبارہ کوشش کریں۔' },
  a_enter_code_title: { en: 'Enter a code', ar: 'أدخل رمزًا', ur: 'کوڈ درج کریں' },
  a_enter_code_body: { en: 'Passport codes are 6 characters, like A7-KM-2X.', ar: 'رموز الجواز مكوّنة من 6 أحرف مثل A7-KM-2X.', ur: 'پاسپورٹ کوڈ 6-حرفی ہوتے ہیں، جیسے A7-KM-2X۔' },
  a_linked_title: { en: 'Linked', ar: 'مربوط', ur: 'منسلک' },
  a_linked_default: { en: '✨ Streaks and milestones will now sync across your apps.', ar: '✨ ستتزامن سلاسل النشاط والمعالم عبر تطبيقاتك.', ur: '✨ اسٹریک اور سنگ میل اب آپ کی ایپس میں مل کر چلیں گے۔' },
  a_not_linked_title: { en: 'Not linked', ar: 'غير مربوط', ur: 'منسلک نہیں' },
  a_not_linked_invalid: { en: 'Code not found. Check for typos.', ar: 'الرمز غير موجود. تحقّق من الأخطاء.', ur: 'کوڈ نہیں ملا۔ املاء دیکھیں۔' },
  a_not_linked_expired: { en: 'This code has expired. Generate a fresh one.', ar: 'انتهت صلاحية هذا الرمز. أنشئ رمزًا جديدًا.', ur: 'یہ کوڈ ختم ہو چکا ہے۔ نیا بنائیں۔' },
  a_not_linked_taken: { en: 'This passport already has a QBS device linked.', ar: 'يوجد جهاز QBS مرتبط بهذا الجواز.', ur: 'اس پاسپورٹ سے QBS ڈیوائس پہلے ہی جڑی ہے۔' },
  a_not_linked_generic: { en: 'Could not link.', ar: 'تعذّر الربط.', ur: 'لنک نہیں ہو سکا۔' },
};

export function pt(key: keyof typeof S, lang: 'en' | 'ar' | 'ur' = 'en', vars?: Record<string, string | number>): string {
  const raw = (S[key] && S[key][lang]) || (S[key] && S[key].en) || key;
  if (!vars) return raw;
  return Object.keys(vars).reduce((s, k) => s.replace(`{${k}}`, String(vars[k])), raw);
}
