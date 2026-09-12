/**
 * Sources & Tafseer Library — pushed as an OTA update (JS-only).
 *
 * Explains to end users which classical tafseer works power the AI Sheikh,
 * the 44 signature verses, the A-Z classical anchors, and every verbatim
 * citation across the app. Rooted in Ahl al-Sunnah wa'l-Jamāʿah ʿaqīdah.
 *
 * Reachable from:
 *   - Sheikh tab welcome card ("View sources")
 *   - (future) About / Settings page
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../src/components/Card';
import { useApp } from '../src/store/useApp';
import { colors, spacing, type as ty } from '../src/theme';

type TafseerWork = {
  id: string;
  name_en: string;
  name_ar: string;
  author_en: string;
  author_ar: string;
  languages: string[];       // 3-letter codes we cover in-app
  era: string;                 // shortened Hijri/Gregorian
  desc_en: string;
  desc_ar: string;
  desc_ur: string;
};

const WORKS: TafseerWork[] = [
  {
    id: 'ibn-kathir',
    name_en: 'Tafsīr Ibn Kathīr',
    name_ar: 'تفسير ابن كثير',
    author_en: 'Ismāʿīl Ibn Kathīr al-Dimashqī',
    author_ar: 'إسماعيل بن كثير الدمشقي',
    languages: ['ar', 'en', 'ur'],
    era: '774 AH / 1373 CE',
    desc_en:
      "The most widely respected classical Sunni tafseer. Grounded in tafsīr bi'l-ma'thūr — meaning-by-transmission from the Prophet ﷺ, the Companions, and the Successors — with careful hadith isnād analysis. In this app, we include the full Arabic, an abridged English edition, and the Urdu translation.",
    desc_ar:
      'من أشهر التفاسير الكلاسيكية عند أهل السنة والجماعة، وأصله في التفسير بالمأثور من النبي ﷺ والصحابة والتابعين مع تحرير أسانيد الأحاديث. متوفر في التطبيق بالعربية والإنجليزية (مختصرة) والأردية.',
    desc_ur:
      'اہلِ سنت والجماعت کی سب سے معروف کلاسیکی تفسیر، جو نبی ﷺ، صحابہ اور تابعین سے منقول تفسیر بالمأثور پر مبنی ہے۔ اس ایپ میں عربی، مختصر انگریزی، اور اردو میں دستیاب ہے۔',
  },
  {
    id: 'saadi',
    name_en: 'Tafsīr al-Saʿdī',
    name_ar: 'تيسير الكريم الرحمن (السعدي)',
    author_en: 'Shaykh ʿAbd al-Raḥmān al-Saʿdī',
    author_ar: 'الشيخ عبد الرحمن السعدي',
    languages: ['ar'],
    era: '1376 AH / 1956 CE',
    desc_en:
      'A twentieth-century Najdi Sunni tafseer known for exceptional clarity and ease of access. Al-Saʿdī balances explanation of āyāt with pastoral guidance and heart-softening reflection. Our AI cites this work when the verse touches ʿaqīdah or spiritual states.',
    desc_ar:
      'تفسير معاصر عرف بوضوحه وسهولته. يمزج بين التفسير والوعظ وأحوال القلب. يستشهد به الذكاء الاصطناعي في مسائل العقيدة والأحوال الروحية.',
    desc_ur:
      'ایک جدید سنی تفسیر جو اپنی وضاحت اور آسانی کے لیے مشہور ہے۔ الشیخ السعدی تفسیر کے ساتھ روحانی رہنمائی بھی فراہم کرتے ہیں۔ عقیدے اور روحانی موضوعات پر AI اسی کا حوالہ دیتی ہے۔',
  },
  {
    id: 'muyassar',
    name_en: 'Tafsīr al-Muyassar',
    name_ar: 'التفسير الميسر',
    author_en: 'King Fahd Complex for Printing the Holy Qur\u02BEan',
    author_ar: 'مجمع الملك فهد لطباعة المصحف الشريف',
    languages: ['ar'],
    era: 'Contemporary Saudi committee edition',
    desc_en:
      'A single-volume Saudi committee-edited tafseer designed to give one clear, authoritative meaning per āyah without theological digressions. Ideal for quick verse-level explanations — used by the AI when the answer needs a single crisp classical reading.',
    desc_ar:
      'تفسير مختصر بلجنة سعودية، يعطي معنى واحدًا واضحًا لكل آية بدون تشعبات كلامية. مثالي للشرح السريع، ويستخدمه الذكاء الاصطناعي عند الحاجة إلى معنى كلاسيكي واحد ودقيق.',
    desc_ur:
      'ایک مختصر سعودی کمیٹی تفسیر جو ہر آیت کا واضح اور مستند مفہوم پیش کرتی ہے۔ AI اسے فوری اور واضح کلاسیکی وضاحت کے لیے استعمال کرتی ہے۔',
  },
  {
    id: 'jalalayn',
    name_en: 'Tafsīr al-Jalālayn',
    name_ar: 'تفسير الجلالين',
    author_en: 'Jalāl al-Dīn al-Maḥallī & Jalāl al-Dīn al-Suyūṭī',
    author_ar: 'جلال الدين المحلي وجلال الدين السيوطي',
    languages: ['ar'],
    era: '864-911 AH / 1459-1505 CE',
    desc_en:
      'A concise, phrase-by-phrase classical tafseer completed by two of the most influential Shāfiʿī scholars of the 15th century. Loved for its economy: it fits alongside the muṣḥaf on a single page. Used by the AI when the user asks for a tight, word-level gloss.',
    desc_ar:
      'تفسير كلاسيكي مختصر يشرح الآيات كلمة بكلمة، أكمله جلال الدين المحلي والسيوطي في القرن التاسع الهجري. معروف بإيجازه ودقته. يستخدم في التطبيق للشرح الحرفي المختصر.',
    desc_ur:
      'ایک مختصر کلاسیکی تفسیر جو آیات کی لفظی وضاحت کرتی ہے۔ 9ویں صدی ہجری میں امام محلی اور امام سیوطی نے مکمل کی۔ AI مختصر لفظی وضاحت کے لیے اسے استعمال کرتی ہے۔',
  },
];

const LANG_LABELS: Record<string, { en: string; ar: string; ur: string; emoji: string }> = {
  ar: { en: 'Arabic', ar: 'العربية', ur: 'عربی', emoji: '🇸🇦' },
  en: { en: 'English', ar: 'الإنجليزية', ur: 'انگریزی', emoji: '🇬🇧' },
  ur: { en: 'Urdu', ar: 'الأردية', ur: 'اردو', emoji: '🇵🇰' },
};

export default function SourcesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const lang = useApp((s) => s.lang);
  const rtl = lang !== 'en';

  const L = (en: string, ar: string, ur: string) => (lang === 'ar' ? ar : lang === 'ur' ? ur : en);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ paddingTop: insets.top }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <Ionicons name={rtl ? 'chevron-forward' : 'chevron-back'} size={22} color={colors.creamSubtle || colors.silver} />
          </Pressable>
          <Text style={[styles.headerTitle, rtl && { textAlign: 'right' }]}>
            {L('Sources & Tafseer Library', 'المصادر ومكتبة التفسير', 'ذرائع اور تفسیر لائبریری')}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Intro */}
        <Card accent={colors.gold}>
          <View style={[styles.iconRow, rtl && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="library-outline" size={20} color={colors.gold} />
            <Text style={styles.introTitle}>
              {L('Rooted in the Classical Tradition', 'مؤسّس على التراث الكلاسيكي', 'کلاسیکی روایت پر مبنی')}
            </Text>
          </View>
          <Text style={[styles.introBody, { textAlign: rtl ? 'right' : 'left' }]}>
            {L(
              "Every AI answer, verse anchor, and A-Z entry in this app cites the classical Sunni tafseer verbatim. Scientific readings are always presented as a secondary inference — never as a replacement for the tafseer of the Prophet \u{FDFA}, his Companions, and the classical scholars. Below are the four tafāsīr that ground everything you see.",
              'كل إجابة من الذكاء الاصطناعي، ومرساة الآيات، ومداخل الحروف الأبجدية في هذا التطبيق تستشهد بالتفسير السني الكلاسيكي حرفيًّا. القراءات العلمية تُطرح دائمًا كاحتمال ثانوي، ولا تحلّ محل تفسير النبي ﷺ وصحابته والعلماء الكلاسيكيين. فيما يلي التفاسير الأربعة التي يستند إليها كل ما تراه.',
              'اس ایپ میں AI کے ہر جواب، آیت کے مرکز، اور A-Z اندراج میں کلاسیکی سنی تفسیر کا حوالہ لفظی طور پر دیا جاتا ہے۔ سائنسی قراءات ہمیشہ ثانوی اشارے کے طور پر پیش کی جاتی ہیں — نبی ﷺ، صحابہ اور کلاسیکی علما کی تفسیر کا متبادل نہیں۔ ذیل میں چار تفاسیر ہیں جن پر پورا مواد قائم ہے۔'
            )}
          </Text>
        </Card>

        {/* Tafseer cards */}
        {WORKS.map((w, idx) => {
          const name = lang === 'ar' ? w.name_ar : w.name_en;
          const author = lang === 'ar' ? w.author_ar : w.author_en;
          const desc = lang === 'ar' ? w.desc_ar : lang === 'ur' ? w.desc_ur : w.desc_en;
          return (
            <Card key={w.id} style={{ marginTop: spacing.md }} accent={idx === 0 ? colors.rose : colors.silver}>
              <View style={[styles.workRow, rtl && { flexDirection: 'row-reverse' }]}>
                <View style={styles.numberDisc}>
                  <Text style={styles.numberTxt}>{idx + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.workName, { textAlign: rtl ? 'right' : 'left' }]}>{name}</Text>
                  <Text style={[styles.workNameAlt, { textAlign: rtl ? 'right' : 'left' }]}>
                    {lang === 'ar' ? w.name_en : w.name_ar}
                  </Text>
                </View>
              </View>
              <Text style={[styles.workAuthor, { textAlign: rtl ? 'right' : 'left' }]}>
                {L('by', 'بقلم', 'مصنف')} <Text style={{ color: colors.cream || colors.silver }}>{author}</Text>
              </Text>
              <Text style={[styles.workEra, { textAlign: rtl ? 'right' : 'left' }]}>{w.era}</Text>
              <Text style={[styles.workDesc, { textAlign: rtl ? 'right' : 'left' }]}>{desc}</Text>

              <View style={[styles.langRow, rtl && { flexDirection: 'row-reverse' }]}>
                <Text style={styles.langLabel}>{L('In-app languages:', 'اللغات المتوفرة:', 'ایپ میں زبانیں:')}</Text>
                <View style={[styles.langPills, rtl && { flexDirection: 'row-reverse' }]}>
                  {w.languages.map((lc) => (
                    <View key={lc} style={styles.langPill}>
                      <Text style={styles.langEmoji}>{LANG_LABELS[lc].emoji}</Text>
                      <Text style={styles.langPillTxt}>
                        {lang === 'ar' ? LANG_LABELS[lc].ar : lang === 'ur' ? LANG_LABELS[lc].ur : LANG_LABELS[lc].en}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </Card>
          );
        })}

        {/* Aqeedah footer */}
        <Card accent={colors.gold} style={{ marginTop: spacing.md, backgroundColor: 'rgba(212,175,55,0.06)' }}>
          <Text style={styles.aqLabel}>{L('ʿAQĪDAH SAFEGUARD', 'ضابط عقدي', 'عقیدہ حفاظت')}</Text>
          <Text style={[styles.aqBody, { textAlign: rtl ? 'right' : 'left' }]}>
            {L(
              'The traditional tafseer holds primacy. The scientific reading is an inference, not a doctrine. All content in this app is rooted in the ʿaqīdah of Ahl al-Sunnah wa\'l-Jamāʿah. Despite our grounding effort, an AI is NOT a replacement for a real, qualified, living scholar — for any serious religious matter, please consult a living shaykh. Allāh knows best.',
              'التفسير الكلاسيكي هو الأصل، والقراءة العلمية استنباط ثانوي وليست عقيدة. كل محتوى التطبيق يقوم على عقيدة أهل السنة والجماعة. رغم عنايتنا بالمصادر، لا يعوض الذكاء الاصطناعي عن العالم الحي المؤهل — يُرجع في المسائل الجادة إلى الشيخ الحي. والله أعلم.',
              'کلاسیکی تفسیر بنیاد ہے۔ سائنسی قراءت ایک ثانوی اشارہ ہے، عقیدہ نہیں۔ ایپ کا سب مواد اہلِ سنت والجماعت کے عقیدے پر قائم ہے۔ ہماری کوششوں کے باوجود AI کسی زندہ، اہل عالم کا متبادل نہیں — سنجیدہ دینی معاملات کے لیے کسی زندہ شیخ سے رجوع کریں۔ واللہ اعلم۔'
            )}
          </Text>
        </Card>

        <Text style={styles.footerNote}>
          {L(
            'Also referenced across the app: al-Ṭabarī, al-Qurṭubī, al-Baghawī on select verses. Modern comparative material is cited with author + edition + page reference.',
            'كما يُستشهد في التطبيق بـ الطبري والقرطبي والبغوي في آيات مختارة. المراجع الحديثة تُذكر بالمؤلف والطبعة والصفحة.',
            'ایپ میں منتخب آیات پر طبری، قرطبی، اور بغوی کا بھی حوالہ دیا گیا ہے۔ جدید تقابلی مواد مصنف، ایڈیشن، اور صفحہ کے حوالے کے ساتھ درج ہے۔'
          )}
        </Text>
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.bg,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    ...(ty as any).h3,
    color: colors.cream || colors.silver,
    flex: 1,
    fontWeight: '700',
    fontSize: 18,
  },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl || 48 },

  iconRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  introTitle: { fontSize: 16, fontWeight: '700', color: colors.gold },
  introBody: { fontSize: 14, lineHeight: 22, color: colors.cream || colors.silver, opacity: 0.92 },

  workRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  numberDisc: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.gold + '22',
    borderWidth: 1, borderColor: colors.gold + '66',
    alignItems: 'center', justifyContent: 'center',
  },
  numberTxt: { color: colors.gold, fontSize: 15, fontWeight: '800' },
  workName: { fontSize: 17, fontWeight: '700', color: colors.cream || colors.silver, letterSpacing: 0.2 },
  workNameAlt: { fontSize: 13, color: colors.silver, opacity: 0.75, marginTop: 2 },
  workAuthor: { fontSize: 13, color: colors.silver, marginTop: spacing.xs },
  workEra: { fontSize: 12, color: colors.silver, opacity: 0.7, marginTop: 2, fontStyle: 'italic' },
  workDesc: { fontSize: 14, lineHeight: 21, color: colors.cream || colors.silver, opacity: 0.9, marginTop: spacing.sm },

  langRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  langLabel: { fontSize: 12, color: colors.silver, opacity: 0.75 },
  langPills: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  langPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(212,175,55,0.10)',
    borderWidth: 1, borderColor: colors.gold + '55',
  },
  langEmoji: { fontSize: 12 },
  langPillTxt: { fontSize: 11, fontWeight: '600', color: colors.gold },

  aqLabel: { fontSize: 10, letterSpacing: 2, color: colors.gold, fontWeight: '800' },
  aqBody: { fontSize: 13, lineHeight: 20, color: colors.cream || colors.silver, opacity: 0.9, marginTop: spacing.xs },

  footerNote: {
    fontSize: 11, lineHeight: 17,
    color: colors.silver, opacity: 0.6,
    textAlign: 'center',
    marginTop: spacing.lg, marginHorizontal: spacing.sm,
    ...(Platform.OS === 'ios' ? { fontStyle: 'italic' } : {}),
  },
});
