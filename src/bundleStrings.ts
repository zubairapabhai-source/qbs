/**
 * bundleStrings — trilingual (EN/AR/UR) copy for the cross-app bundle
 * + gift-a-bundle feature. Reads the current app language via i18n and
 * returns the localised string. Keys are stable across all 3 apps so
 * we can copy/paste this module between them; only the imported
 * `currentLang()` differs.
 */
import { currentLang } from './i18n/strings';

type Lang = 'en' | 'ar' | 'ur';
type Row = { en: string; ar: string; ur: string };

const S: Record<string, Row> = {
  // Offer step
  headline_offer:       { en: 'One-Time Offer',           ar: 'عرض لمرّة واحدة',              ur: 'ایک بار کا خصوصی آفر' },
  title_offer:          { en: 'Add the other two apps',   ar: 'أضف التطبيقين الآخرين',        ur: 'دوسری دو ایپس شامل کریں' },
  subtitle_treasures:   { en: 'You just unlocked Treasures. As a shukr-gift, get both Interpretation of Dreams 🌙 and Qurʾān · Bible · Science ✨ for just {price} extra.',
                          ar: 'لقد فتحتَ للتوّ كنوز. كهديّة شكر، احصل على تعبير الرؤى 🌙 والقرآن · الكتاب · العلم ✨ مقابل {price} إضافيّة فقط.',
                          ur: 'آپ نے خزائن اَن لاک کر لی۔ بطور شکر تحفہ، صرف {price} اضافی میں تعبیرِ رؤیا 🌙 اور قرآن · بائبل · سائنس ✨ حاصل کریں۔' },
  subtitle_dreams:      { en: 'You just unlocked Interpretation of Dreams. As a shukr-gift, get both Treasures 📖 and Qurʾān · Bible · Science ✨ for just {price} extra.',
                          ar: 'لقد فتحتَ تعبير الرؤى. كهديّة شكر، احصل على كنوز 📖 والقرآن · الكتاب · العلم ✨ مقابل {price} إضافيّة فقط.',
                          ur: 'آپ نے تعبیرِ رؤیا اَن لاک کیا۔ بطور شکر تحفہ، صرف {price} اضافی میں خزائن 📖 اور قرآن · بائبل · سائنس ✨ حاصل کریں۔' },
  subtitle_qbs:         { en: 'You just unlocked Qurʾān · Bible · Science. As a shukr-gift, get both Treasures 📖 and Interpretation of Dreams 🌙 for just {price} extra.',
                          ar: 'لقد فتحتَ القرآن · الكتاب · العلم. كهديّة شكر، احصل على كنوز 📖 وتعبير الرؤى 🌙 مقابل {price} إضافيّة فقط.',
                          ur: 'آپ نے قرآن · بائبل · سائنس اَن لاک کیا۔ بطور شکر تحفہ، صرف {price} اضافی میں خزائن 📖 اور تعبیرِ رؤیا 🌙 حاصل کریں۔' },
  compare_separate:     { en: 'Buy separately',           ar: 'شراء منفصل',                    ur: 'الگ الگ خریدیں' },
  compare_bundle:       { en: 'Bundle now',               ar: 'الحزمة الآن',                   ur: 'ابھی بنڈل' },
  compare_save:         { en: 'Save 25%',                 ar: 'وفّر ٢٥٪',                      ur: '٢٥٪ بچائیں' },
  compare_vs:           { en: 'vs.',                      ar: 'مقابل',                         ur: 'بمقابلہ' },
  perk_trinity:         { en: 'Earns you the 🌙 Trinity + ⭐ Full Series badges',
                          ar: 'تحصل على شارتَي 🌙 الثلاثيّة و ⭐ السلسلة الكاملة',
                          ur: '🌙 ٹرینٹی + ⭐ فُل سیریز بیج ملیں گے' },
  perk_passport:        { en: 'One anonymous Passport across all 3 apps',
                          ar: 'جواز مجهول واحد لجميع التطبيقات الثلاثة',
                          ur: 'تینوں ایپس کے لیے ایک گمنام پاسپورٹ' },
  perk_dreams:          { en: 'Interpretation of Dreams — full library',
                          ar: 'تعبير الرؤى — المكتبة الكاملة',
                          ur: 'تعبیرِ رؤیا — مکمل لائبریری' },
  perk_qbs:             { en: 'Qurʾān · Bible · Science — every article',
                          ar: 'القرآن · الكتاب · العلم — كل مقال',
                          ur: 'قرآن · بائبل · سائنس — ہر مضمون' },
  perk_treasures:       { en: 'Treasures of the Sacred Qurʾān — full library',
                          ar: 'كنوز القرآن الكريم — المكتبة الكاملة',
                          ur: 'خزائنِ قرآن مجید — مکمل لائبریری' },
  // Store open labels
  store_appstore:       { en: 'App Store',                ar: 'آب ستور',                        ur: 'ایپ اسٹور' },
  store_playstore:      { en: 'Play Store',               ar: 'بلاي ستور',                      ur: 'پلے اسٹور' },
  // Alert titles + messages (BundleOfferModal + GiftInboxStrip)
  alert_unlock_failed:  { en: 'Bundle unlock failed',     ar: 'فشل فتح الحزمة',                ur: 'بنڈل اَن لاک ناکام' },
  alert_try_again:      { en: 'Please try again.',        ar: 'يُرجى المحاولة مرّة أخرى.',      ur: 'براہ کرم دوبارہ کوشش کریں۔' },
  alert_still_failed:   { en: 'Still could not confirm — please check your connection.',
                          ar: 'ما زلنا لم نتمكّن من التأكيد — يُرجى التحقّق من اتّصالك.',
                          ur: 'ابھی بھی کنفرم نہیں ہو سکا — براہ کرم اپنا کنکشن چیک کریں۔' },
  alert_copied_instead: { en: 'Copied instead',           ar: 'تم النسخ بدلاً من ذلك',          ur: 'اس کے بجائے کاپی ہو گیا' },
  alert_gift_copied:    { en: 'Your gift message has been copied to the clipboard.',
                          ar: 'تم نسخ رسالة الهديّة إلى الحافظة.',
                          ur: 'آپ کا تحفہ پیغام کلپ بورڈ پر کاپی ہو گیا ہے۔' },
  alert_could_open_store: { en: 'Could not open store',   ar: 'تعذّر فتح المتجر',              ur: 'اسٹور نہیں کھلا' },
  alert_copied:         { en: 'Copied',                   ar: 'تم النسخ',                      ur: 'کاپی ہو گیا' },
  alert_copy_failed:    { en: 'Copy failed',              ar: 'فشل النسخ',                     ur: 'کاپی ناکام' },
  alert_code_copied:    { en: 'Passport code {code} copied to clipboard.',
                          ar: 'تم نسخ رمز الجواز {code} إلى الحافظة.',
                          ur: 'پاسپورٹ کوڈ {code} کلپ بورڈ پر کاپی ہو گیا۔' },
  alert_gift_msg_copied: { en: 'Gift message copied to clipboard.',
                           ar: 'تم نسخ رسالة الهديّة إلى الحافظة.',
                           ur: 'تحفہ پیغام کلپ بورڈ پر کاپی ہو گیا۔' },
  alert_could_not_open: { en: 'Could not open',           ar: 'تعذّر الفتح',                    ur: 'نہیں کھلا' },
  // GiftInboxStrip row labels
  inbox_claimed_on:     { en: 'Claimed on {app}',         ar: 'تمّ الاستلام على {app}',         ur: '{app} پر وصول ہوا' },
  inbox_awaiting:       { en: 'Awaiting recipient',       ar: 'بانتظار المستلم',               ur: 'وصول کنندہ کا انتظار' },
  app_treasures:        { en: 'Treasures',                ar: 'كنوز',                          ur: 'خزائن' },
  app_dreams:           { en: 'Dreams',                   ar: 'تعبير الرؤى',                   ur: 'تعبیرِ رؤیا' },
  app_qbs:              { en: 'QBS',                      ar: 'القرآن · الكتاب · العلم',        ur: 'قرآن · بائبل · سائنس' },
  app_generic:          { en: 'a Divine Series app',      ar: 'أحد تطبيقات السلسلة الإلهيّة',   ur: 'ایک ڈوائن سیریز ایپ' },
  mode_self:            { en: 'For me',                   ar: 'لي',                            ur: 'میرے لیے' },
  mode_gift:            { en: 'As a gift 🎁',             ar: 'هديّة 🎁',                       ur: 'بطور تحفہ 🎁' },
  msg_label:            { en: 'OPTIONAL NOTE TO YOUR FRIEND', ar: 'ملاحظة اختياريّة لصديقك',   ur: 'دوست کے لیے اختیاری پیغام' },
  msg_placeholder:      { en: 'e.g. May Allāh reward you — enjoy 🌙',
                          ar: 'مثال: جزاك الله خيرًا — استمتع 🌙',
                          ur: 'مثال: اللہ آپ کو جزائے خیر دے — لطف اٹھائیں 🌙' },
  cta_self:             { en: 'Unlock other 2 for {price}',   ar: 'افتح التطبيقين الآخرين مقابل {price}', ur: '{price} میں دوسری ۲ اَن لاک کریں' },
  cta_gift:             { en: 'Gift the bundle for {price}',  ar: 'أهدِ الحزمة مقابل {price}',           ur: '{price} میں بنڈل بطور تحفہ' },
  skip:                 { en: 'No thanks — maybe later',  ar: 'لا شكرًا — ربّما لاحقًا',       ur: 'شکریہ — شاید بعد میں' },
  foot_self:            { en: "You'll download the other two apps from your app store separately. We'll give you a Passport code — paste it on each app's Passport screen to unlock them.",
                          ar: 'ستنزّل التطبيقين الآخرَين من متجرك بشكل منفصل. سنمنحك رمز جواز — الصقه على شاشة جواز الأمّة في كل تطبيق لفتحه.',
                          ur: 'دوسری دو ایپس آپ اپنے اسٹور سے الگ ڈاؤن لوڈ کریں گے۔ ہم آپ کو ایک پاسپورٹ کوڈ دیں گے — ہر ایپ کے پاسپورٹ اسکرین پر پیسٹ کریں۔' },
  foot_gift:            { en: "You'll get a shareable gift code. Send it to a friend — they paste it on any Divine Series app's Passport screen to unlock all 3 apps.",
                          ar: 'ستحصل على رمز هديّة قابل للمشاركة. أرسله لصديق — يلصقه على شاشة جواز أيّ تطبيق من السلسلة لفتح التطبيقات الثلاثة.',
                          ur: 'آپ کو ایک قابلِ اشتراک تحفہ کوڈ ملے گا۔ دوست کو بھیجیں — وہ کسی بھی ڈوائن سیریز ایپ کے پاسپورٹ اسکرین پر پیسٹ کر کے تینوں ایپس اَن لاک کر لے گا۔' },

  // Success step (self)
  headline_success:     { en: 'All Set',                  ar: 'اكتمل الإعداد',                 ur: 'سب تیار' },
  title_success:        { en: 'Your bundle is active',    ar: 'حزمتك مفعّلة',                  ur: 'آپ کا بنڈل فعال ہے' },
  success_body:         { en: "Your Passport code (below) is copied to the clipboard — it's yours forever. Download the other 2 apps from your store, then paste this code on each app's Passport screen to unlock them.",
                          ar: 'تم نسخ رمز جوازك (أدناه) إلى الحافظة — وهو لك للأبد. نزّل التطبيقين الآخرين من متجرك، ثم الصق هذا الرمز على شاشة جواز الأمّة في كلٍّ منهما لفتحهما.',
                          ur: 'آپ کا پاسپورٹ کوڈ (نیچے) کلپ بورڈ میں کاپی ہو گیا ہے — یہ ہمیشہ آپ کا ہے۔ دوسری ۲ ایپس اپنے اسٹور سے ڈاؤن لوڈ کریں، پھر ہر ایک کے پاسپورٹ اسکرین پر یہ کوڈ پیسٹ کر کے اَن لاک کریں۔' },
  code_cap:             { en: 'YOUR PASSPORT CODE · COPIED · PERMANENT',
                          ar: 'رمز جوازك · تم النسخ · دائم',
                          ur: 'آپ کا پاسپورٹ کوڈ · کاپی · مستقل' },
  code_hint_treasures:  { en: 'Save it somewhere safe. Paste on the Passport screen of Interpretation of Dreams and Qurʾān · Bible · Science whenever you install them.',
                          ar: 'احفظه في مكان آمن. الصقه على شاشة جواز الأمّة في تعبير الرؤى والقرآن · الكتاب · العلم عند تثبيتهما.',
                          ur: 'محفوظ جگہ رکھیں۔ تعبیرِ رؤیا اور قرآن · بائبل · سائنس انسٹال ہونے پر ان کے پاسپورٹ اسکرین پر پیسٹ کریں۔' },
  code_hint_dreams:     { en: 'Save it somewhere safe. Paste on the Passport screen of Treasures of the Sacred Qurʾān and Qurʾān · Bible · Science whenever you install them.',
                          ar: 'احفظه في مكان آمن. الصقه على شاشة جواز كنوز القرآن الكريم والقرآن · الكتاب · العلم عند تثبيتهما.',
                          ur: 'محفوظ جگہ رکھیں۔ خزائن اور قرآن · بائبل · سائنس انسٹال ہونے پر ان کے پاسپورٹ اسکرین پر پیسٹ کریں۔' },
  code_hint_qbs:        { en: 'Save it somewhere safe. Paste on the Passport screen of Treasures of the Sacred Qurʾān and Interpretation of Dreams whenever you install them.',
                          ar: 'احفظه في مكان آمن. الصقه على شاشة جواز كنوز القرآن الكريم وتعبير الرؤى عند تثبيتهما.',
                          ur: 'محفوظ جگہ رکھیں۔ خزائن اور تعبیرِ رؤیا انسٹال ہونے پر ان کے پاسپورٹ اسکرین پر پیسٹ کریں۔' },
  store_open:           { en: 'Open in {store}',          ar: 'افتح في {store}',               ur: '{store} میں کھولیں' },
  done:                 { en: 'Done',                     ar: 'تمّ',                           ur: 'مکمل' },

  // Gift success
  headline_gift:        { en: 'GIFT READY',               ar: 'الهديّة جاهزة',                 ur: 'تحفہ تیار' },
  title_gift:           { en: 'Send it to a friend',      ar: 'أرسلها لصديق',                  ur: 'دوست کو بھیجیں' },
  gift_success_body:    { en: "Your gift code (below) is copied to the clipboard — it's yours to keep forever until claimed. Share it with anyone who'd benefit from the Divine Series.",
                          ar: 'تم نسخ رمز الهديّة (أدناه) إلى الحافظة — احتفظ به إلى أن يُطالَب. شاركه مع من ينتفع بالسلسلة الإلهيّة.',
                          ur: 'آپ کا تحفہ کوڈ (نیچے) کلپ بورڈ میں کاپی ہو گیا — جب تک وصول نہ ہو تب تک آپ کے پاس رہے گا۔ ہر اس شخص کے ساتھ شیئر کریں جس کو ڈوائن سیریز سے فائدہ ہو۔' },
  gift_code_cap:        { en: '🎁 GIFT CODE · COPIED · PERMANENT',
                          ar: '🎁 رمز الهديّة · تم النسخ · دائم',
                          ur: '🎁 تحفہ کوڈ · کاپی · مستقل' },
  gift_code_hint:       { en: "When your friend pastes this on any Divine Series app's Passport screen, they'll unlock the bundle instantly.",
                          ar: 'عندما يلصق صديقك هذا على شاشة جواز أيّ تطبيق من السلسلة، ستُفتح لهم الحزمة فورًا.',
                          ur: 'جب آپ کا دوست یہ کوڈ کسی بھی ڈوائن سیریز ایپ کے پاسپورٹ اسکرین پر پیسٹ کرے گا، فوراً بنڈل اَن لاک ہو جائے گا۔' },
  share_gift:           { en: 'Share gift…',              ar: 'شارك الهديّة…',                 ur: 'تحفہ شیئر کریں…' },

  // Claim error
  headline_claim_error: { en: 'Almost There',             ar: 'اقتربنا',                       ur: 'تقریباً ہو گیا' },
  title_claim_error:    { en: "We're confirming your bundle", ar: 'نؤكّد حزمتك',                ur: 'ہم آپ کا بنڈل کنفرم کر رہے ہیں' },
  claim_error_body:     { en: "Your payment went through, but we couldn't reach our server to register the bundle yet. This is safe — you were charged only once. Tap Retry to confirm now.",
                          ar: 'تمّ تسديد الدفع، لكن لم نتمكّن من الوصول إلى الخادم لتسجيل الحزمة بعد. لا داعي للقلق — لم يُسحب منك سوى مرّة واحدة. اضغط إعادة المحاولة للتأكيد الآن.',
                          ur: 'آپ کی ادائگی مکمل ہو گئی، لیکن ہم ابھی سرور تک نہیں پہنچ سکے۔ فکر نہ کریں — آپ سے صرف ایک بار چارج ہوا ہے۔ کنفرم کرنے کے لیے دوبارہ کوشش کریں۔' },
  retry:                { en: 'Retry now',                ar: 'أعد المحاولة الآن',             ur: 'ابھی دوبارہ کوشش' },
  try_later:            { en: "I'll try later from Settings", ar: 'سأجرّب لاحقًا من الإعدادات',   ur: 'بعد میں سیٹنگز سے کوشش کروں گا' },
  claim_error_foot:     { en: 'Your receipt is safely on the device; re-opening this modal will keep the Retry available.',
                          ar: 'إيصالك محفوظ على الجهاز؛ إعادة فتح هذه النافذة تُبقي زرّ إعادة المحاولة متاحًا.',
                          ur: 'آپ کی رسید محفوظ ہے؛ اس ماڈل کو دوبارہ کھولنے پر ری ٹرائی دستیاب رہے گی۔' },

  // BundleUpsellCard
  card_cap:             { en: 'ONE-TIME OFFER',           ar: 'عرض لمرّة واحدة',              ur: 'ایک بار کا آفر' },
  card_title:           { en: 'Unlock the other two apps', ar: 'افتح التطبيقين الآخرين',        ur: 'دوسری دو ایپس اَن لاک کریں' },
  card_body_treasures:  { en: 'Add 🌙 Dreams and ✨ Qurʾān · Bible · Science for just {price} extra.',
                          ar: 'أضف 🌙 تعبير الرؤى و ✨ القرآن · الكتاب · العلم مقابل {price} إضافيّة فقط.',
                          ur: 'صرف {price} اضافی میں 🌙 تعبیرِ رؤیا اور ✨ قرآن · بائبل · سائنس شامل کریں۔' },
  card_body_dreams:     { en: 'Add 📖 Treasures and ✨ Qurʾān · Bible · Science for just {price} extra.',
                          ar: 'أضف 📖 كنوز و ✨ القرآن · الكتاب · العلم مقابل {price} إضافيّة فقط.',
                          ur: 'صرف {price} اضافی میں 📖 خزائن اور ✨ قرآن · بائبل · سائنس شامل کریں۔' },
  card_body_qbs:        { en: 'Add 📖 Treasures and 🌙 Dreams for just {price} extra.',
                          ar: 'أضف 📖 كنوز و 🌙 تعبير الرؤى مقابل {price} إضافيّة فقط.',
                          ur: 'صرف {price} اضافی میں 📖 خزائن اور 🌙 تعبیرِ رؤیا شامل کریں۔' },

  // GiftInboxStrip
  inbox_title:          { en: "Gifts you've sent",        ar: 'الهدايا التي أرسلتها',          ur: 'آپ کے بھیجے گئے تحفے' },
  inbox_summary:        { en: '{claimed} of {sent} claimed', ar: 'تمّ استلام {claimed} من {sent}', ur: '{sent} میں سے {claimed} وصول ہو گئے' },
  inbox_claimed:        { en: '✅ Claimed on {app}',       ar: '✅ تمّ الاستلام على {app}',      ur: '✅ {app} پر وصول ہوا' },
  inbox_waiting:        { en: '⏳ Awaiting recipient',    ar: '⏳ بانتظار المستلم',            ur: '⏳ وصول کنندہ کا انتظار' },

  // Passport paste-box (doLink alerts)
  gift_accepted:        { en: '🎁 Gift accepted',         ar: '🎁 قُبِلت الهديّة',             ur: '🎁 تحفہ قبول ہو گیا' },
  gift_msg_from_friend: { en: '\nMessage from your friend:\n"{msg}"', ar: '\nرسالة من صديقك:\n«{msg}»', ur: '\nآپ کے دوست کا پیغام:\n"{msg}"' },
  gift_paste_hint:      { en: "\nTo unlock your other 2 apps, open each app's Passport screen and paste this Passport code:\n\n    {code}",
                          ar: '\nلفتح تطبيقيك الآخرين، افتح شاشة جواز الأمّة في كلٍّ منهما والصق هذا الرمز:\n\n    {code}',
                          ur: '\nدوسری ۲ ایپس اَن لاک کرنے کے لیے، ہر ایپ کا پاسپورٹ اسکرین کھول کر یہ کوڈ پیسٹ کریں:\n\n    {code}' },
  gift_unlocked_treasures: { en: '🎁 Gift claimed — Treasures is now unlocked!',
                             ar: '🎁 تمّ استلام الهديّة — كنوز مفتوحة الآن!',
                             ur: '🎁 تحفہ وصول ہوا — خزائن اَن لاک ہو گئی!' },
  gift_unlocked_dreams: { en: '🎁 Gift claimed — Interpretation of Dreams is unlocked!',
                          ar: '🎁 تمّ استلام الهديّة — تعبير الرؤى مفتوح!',
                          ur: '🎁 تحفہ وصول ہوا — تعبیرِ رؤیا اَن لاک ہو گئی!' },
  gift_unlocked_qbs:    { en: '🎁 Gift claimed — Qurʾān · Bible · Science is unlocked!',
                          ar: '🎁 تمّ استلام الهديّة — القرآن · الكتاب · العلم مفتوح!',
                          ur: '🎁 تحفہ وصول ہوا — قرآن · بائبل · سائنس اَن لاک ہو گئی!' },
  gift_already_title:   { en: 'Already claimed',          ar: 'مُطالَب مسبقًا',                ur: 'پہلے وصول ہو چکا' },
  gift_already_body:    { en: 'This gift has already been claimed.', ar: 'تمّت المطالبة بهذه الهديّة مسبقًا.', ur: 'یہ تحفہ پہلے وصول ہو چکا ہے۔' },
  gift_self_title:      { en: "That's your own gift",     ar: 'هذه هديّتك أنت',                ur: 'یہ آپ کا اپنا تحفہ ہے' },
  gift_self_body:       { en: 'You cannot claim a gift you sent.', ar: 'لا يمكنك المطالبة بهديّة أرسلتها بنفسك.', ur: 'اپنی بھیجی گئی تحفہ آپ خود وصول نہیں کر سکتے۔' },

  // Bundle-linked auto-unlock alert
  bundle_unlocked_title:   { en: '🎁 Bundle unlocked',    ar: '🎁 تمّ فتح الحزمة',              ur: '🎁 بنڈل اَن لاک ہو گیا' },
  bundle_unlocked_treasures: { en: 'Treasures has been unlocked from your Passport bundle.',
                               ar: 'تمّ فتح كنوز من حزمة جوازك.',
                               ur: 'آپ کے پاسپورٹ بنڈل سے خزائن اَن لاک ہو گئی۔' },
  bundle_unlocked_dreams:  { en: 'Interpretation of Dreams has been unlocked from your Passport bundle.',
                             ar: 'تمّ فتح تعبير الرؤى من حزمة جوازك.',
                             ur: 'آپ کے پاسپورٹ بنڈل سے تعبیرِ رؤیا اَن لاک ہو گئی۔' },
  bundle_unlocked_qbs:     { en: 'Qurʾān · Bible · Science has been unlocked from your Passport bundle.',
                             ar: 'تمّ فتح القرآن · الكتاب · العلم من حزمة جوازك.',
                             ur: 'آپ کے پاسپورٹ بنڈل سے قرآن · بائبل · سائنس اَن لاک ہو گئی۔' },
};

function _resolveLang(): Lang {
  const raw = String(currentLang() || 'en');
  return (['en', 'ar', 'ur'] as const).includes(raw as Lang) ? (raw as Lang) : 'en';
}

/** Look up a localised bundle-string; substitute {token} placeholders. */
export function bs(key: keyof typeof S, params?: Record<string, string | number>): string {
  const row = S[key];
  if (!row) return String(key);
  const lang = _resolveLang();
  let s = row[lang] ?? row.en;
  if (params) {
    for (const k of Object.keys(params)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(params[k]));
    }
  }
  return s;
}

/** Convenience for the current lang code (for backend query strings). */
export function bsLang(): Lang {
  return _resolveLang();
}
