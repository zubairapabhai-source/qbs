/**
 * Onboarding — user's mandatory introduction (verbatim).
 * Locked-in decision from /app/memory/APP3_DECISIONS_2026_06_16.md
 *
 * Shows on first launch (via _layout) and re-accessible from Settings.
 */
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../src/components/Card';
import { useApp } from '../src/store/useApp';
import { colors, radius, spacing, type as ty } from '../src/theme';

const ONBOARDING_KEY = '@qbs:onboarding_seen_v1';

const INTRO = {
  en: {
    title: 'Before You Begin',
    subtitle: 'Our covenant with the Qurʾān & Sunnah',
    body: [
      'Our primary aim is adherence to the Qurʾān and Sunnah, not necessarily science.',
      'Science is the building blocks that Allāh ﷻ has used in His creation — not that He needed to in any way or form, but He has done so in His infinite wisdom.',
      'Human intellect is fallible and imperfect, whereas the commandments of Allāh ﷻ are flawless and perfect.',
      'Much of science is actually theory (rather than fact), and theories sometimes lose prevalence.',
      'If science aligns itself with Islamic sources then that is fine, and if some Qurʾānic verses or Sunnah can be interpreted in a scientific way then that too is fine — and we will consider that scientific interpretation of the Qurʾānic / ḥadīth source as merely one possible interpretation.',
      'If, by chance, a scientific theory suddenly falls out of favour (having previously seemed aligned with Islamic teachings), that will have no bearing whatsoever upon the Islamic source — as the scientific reading was merely one elaboration of it.',
    ],
    reminder:
      'Throughout this app, scientific interpretations offered are one possible reading of the verse or ḥadīth, not its definitive meaning. The traditional Sunnī tafseer (Ibn Kathīr, al-Ṭabarī, al-Qurṭubī, al-Baghawī, Jalālayn) remains our primary lens — in accordance with the aqeedah of Ahl al-Sunnah wa\'l-Jamāʿah.',
    cta: 'I understand — begin',
  },
  ar: {
    title: 'قبل أن تبدأ',
    subtitle: 'عهدنا مع القرآن والسنة',
    body: [
      'هدفنا الأول هو الالتزام بالقرآن والسنة، وليس بالضرورة العلم.',
      'العلم هو اللبنات التي استخدمها الله ﷻ في خلقه — لا لأنه في حاجة إلى ذلك بأي شكل، ولكنه فعل ذلك بحكمته البالغة.',
      'العقل البشري فانٍ وناقص، بينما أوامر الله ﷻ كاملة ولا يعتريها خطأ.',
      'كثير من العلم هو في الحقيقة نظرية (لا حقيقة قاطعة)، والنظريات أحيانًا تفقد قبولها.',
      'إذا وافق العلم المصادر الإسلامية فذلك حسن، وإذا أمكن تفسير بعض الآيات القرآنية أو السنة تفسيرًا علميًا فذلك أيضًا حسن — ونحن نعتبر ذلك التفسير العلمي للمصدر القرآني/الحديثي مجرّد تفسير محتمل واحد.',
      'وإن جرى — لأمرٍ ما — أن سقطت نظرية علمية كانت من قبل تبدو متوافقة مع التعاليم الإسلامية، فذلك لا يمسّ المصدر الإسلامي على الإطلاق — لأن القراءة العلمية كانت مجرّد بيانٍ واحد من بيانات محتملة.',
    ],
    reminder:
      'التفسيرات العلمية المعروضة في هذا التطبيق هي قراءة محتملة واحدة للآية أو الحديث، لا معناها القاطع. ويظل التفسير السني التقليدي (ابن كثير، الطبري، القرطبي، البغوي، الجلالان) هو عدستنا الأولى — وفقًا لعقيدة أهل السنة والجماعة.',
    cta: 'فهمت — ابدأ',
  },
  ur: {
    title: 'شروع کرنے سے پہلے',
    subtitle: 'قرآن و سنت کے ساتھ ہمارا عہد',
    body: [
      'ہمارا بنیادی مقصد قرآن و سنت کی پیروی ہے، سائنس نہیں۔',
      'سائنس وہ اجزاء ہیں جو اللہ ﷻ نے اپنی تخلیق میں استعمال فرمائے ہیں — اس لیے نہیں کہ اسے کسی چیز کی حاجت تھی، بلکہ اس نے اپنی لامحدود حکمت سے ایسا کیا۔',
      'انسانی عقل خطا پذیر اور ناقص ہے، جب کہ اللہ ﷻ کے احکام ہر عیب سے پاک اور کامل ہیں۔',
      'زیادہ تر سائنس درحقیقت نظریہ (نہ کہ ٹھوس حقیقت) ہے، اور نظریات کبھی کبھی اپنی قبولیت کھو دیتے ہیں۔',
      'اگر سائنس اسلامی ماخذ سے ہم آہنگ ہو جائے تو یہ خوش آئند ہے، اور اگر بعض قرآنی آیات یا سنت کو سائنسی طور پر بھی سمجھا جا سکے تو یہ بھی ٹھیک ہے — مگر ہم اس سائنسی تفسیر کو قرآنی/حدیثی مأخذ کے کئی ممکن مطلوبہ معانی میں سے صرف ایک ممکنہ تشریح سمجھیں گے۔',
      'اور اگر کبھی کوئی سائنسی نظریہ جو پہلے اسلامی تعلیمات سے ملتا جلتا لگتا تھا، اچانک غیر مقبول ہو جائے، تو اس کا اسلامی مأخذ پر کوئی اثر نہیں پڑے گا — کیونکہ وہ سائنسی توجیہ اس کی ایک ممکنہ وضاحت تھی، نہ اس کی حتمی۔',
    ],
    reminder:
      'اس ایپ میں پیش کی گئی سائنسی تفسیرات آیت یا حدیث کی ایک ممکنہ قرأت ہیں، نہ کہ اس کا قطعی معنی۔ روایتی سنی تفسیر (ابن کثیر، طبری، قرطبی، بغوی، جلالین) ہمارا بنیادی عدسہ ہے — اہل السنّہ و الجماعہ کے عقیدے کے مطابق۔',
    cta: 'میں سمجھ گیا — شروع کریں',
  },
};

interface Props {
  fromSettings?: boolean;
}

export default function OnboardingScreen({ fromSettings }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const lang = useApp((s) => s.lang);
  const rtl = lang === 'ar' || lang === 'ur';
  const t = INTRO[lang];
  const [saving, setSaving] = useState(false);

  const dismiss = async () => {
    setSaving(true);
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    } catch {}
    if (fromSettings || router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.lg,
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + 100,
          gap: spacing.md,
        }}
      >
        <View style={styles.hero}>
          <Text style={styles.bismillah}>{'\uFDFD'}</Text>
          <Text style={[styles.title, { textAlign: rtl ? 'right' : 'center' }]}>{t.title}</Text>
          <Text style={[styles.subtitle, { textAlign: rtl ? 'right' : 'center' }]}>{t.subtitle}</Text>
        </View>

        <Card accent={colors.gold}>
          <View style={[styles.headerRow, rtl && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="shield-checkmark" size={18} color={colors.gold} />
            <Text style={[styles.badge, { color: colors.gold }]}>
              {lang === 'en' ? 'AQEEDAH · AHL AL-SUNNAH WA\'L-JAMĀʿAH' : lang === 'ar' ? 'العقيدة · أهل السنة والجماعة' : 'عقیدہ · اہل السنہ والجماعہ'}
            </Text>
          </View>
          {t.body.map((paragraph, i) => (
            <Text key={i} style={[styles.body, { textAlign: rtl ? 'right' : 'left' }, i < t.body.length - 1 && { marginBottom: spacing.md }]}>
              {paragraph}
            </Text>
          ))}
        </Card>

        <Card accent={colors.emerald}>
          <View style={[styles.headerRow, rtl && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="bookmark" size={18} color={colors.emerald} />
            <Text style={[styles.badge, { color: colors.emerald }]}>
              {lang === 'en' ? 'STANDING REMINDER' : lang === 'ar' ? 'تذكرة دائمة' : 'مستقل یاد دہانی'}
            </Text>
          </View>
          <Text style={[styles.body, { textAlign: rtl ? 'right' : 'left' }]}>{t.reminder}</Text>
        </Card>

        <Pressable onPress={dismiss} disabled={saving} style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.85 }]}>
          <Text style={styles.ctaLabel}>{t.cta}</Text>
          <Ionicons name={rtl ? 'arrow-back' : 'arrow-forward'} size={20} color={colors.bg} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  bismillah: { fontSize: 42, color: colors.gold, textAlign: 'center' },
  title: { ...ty.h1, color: colors.text, marginTop: spacing.sm },
  subtitle: { ...ty.body, color: colors.silverDim, fontStyle: 'italic' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  badge: { ...ty.label, fontSize: 11 },
  body: { ...ty.body, color: colors.text, lineHeight: 24 },
  ctaBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.gold,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaLabel: { ...ty.bodyLarge, color: colors.bg, fontWeight: '700' },
});

export { ONBOARDING_KEY };
