/**
 * A–Z entry detail — verse/topic page (seed view).
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../src/components/Card';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { VerseAudioButton } from '../../src/components/VerseAudioButton';
import { listAtozSeed, type AtozEntry } from '../../src/api';
import { isBookmarked, toggleBookmark, useBookmarks } from '../../src/store/bookmarks';
import { useApp } from '../../src/store/useApp';
import { t } from '../../src/i18n/strings';
import { colors, spacing, type as ty } from '../../src/theme';

export default function EntryDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const lang = useApp((s) => s.lang);
  const rtl = lang === 'ar' || lang === 'ur';
  const [e, setE] = useState<AtozEntry | null>(null);
  const [loading, setLoading] = useState(true);
  useBookmarks();

  useEffect(() => {
    (async () => {
      const r = await listAtozSeed();
      setE(r.entries.find((x) => x.slug === slug) || null);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
      <ActivityIndicator color={colors.silver} />
    </View>
  );
  if (!e) return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title={t('a3_slug_notFound') || 'Not found'} showBack />
    </View>
  );

  // Locale-aware field picker with EN fallback. New entries (fasting, ṣalāh,
  // dates, iftar) carry topic_ar/_ur, translation_ar/_ur, science_hook_ar/_ur,
  // hadith_en_ar/_ur, classical_anchor_ar/_ur, modern_link_ar/_ur — older
  // seed entries don't, so the English value is returned untouched for them.
  const pick = (field: string): string => {
    const anyE = e as any;
    if (lang === 'ar' || lang === 'ur') {
      const v = anyE[`${field}_${lang}`];
      if (typeof v === 'string' && v.length > 0) return v;
    }
    return (anyE[field] as string) || '';
  };
  const topic = pick('topic');
  const translation = pick('translation_en');           // verse meaning EN/AR/UR
  const scienceHook = pick('science_hook');
  const hadithText = pick('hadith_en') || (e as any).hadith_en || '';
  const classicalAnchor = pick('classical_anchor');
  const modernLink = pick('modern_link');

  // Extract Qur'ānic verseKey ("21:30") from the ref field so we can show the
  // audio recitation button. Supports refs like "Quran 21:30", "Qur'ān 16:68-69",
  // "Qur'ān 29:45 · 4:103 · 20:14" — uses the first match.
  const verseKey = (() => {
    const ref = (e.ref || '') as string;
    const m = ref.match(/(\d{1,3}):(\d{1,3})/);
    return m ? `${m[1]}:${m[2]}` : null;
  })();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title={e.topic}
        showBack
        rightAction={{
          icon: isBookmarked('entry', e.slug) ? 'bookmark' : 'bookmark-outline',
          onPress: () => { toggleBookmark('entry', e.slug); },
        }}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
        <LinearGradient colors={[colors.silver + '22', colors.bg]} style={styles.hero}>
          <View style={styles.refRow}>
            <Ionicons name="book" size={14} color={colors.gold} />
            <Text style={styles.ref}>{e.ref || (e as any).source || ''}</Text>
          </View>
          <Text style={[styles.title, { textAlign: rtl ? 'right' : 'left' }]}>{topic || e.topic}</Text>
        </LinearGradient>

        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          {/* Arabic verse (Qur'anic entries) */}
          {e.arabic ? (
            <Card>
              <Text style={styles.arabic}>{e.arabic}</Text>
              {translation ? (
                <Text style={[styles.translation, { textAlign: rtl ? 'right' : 'left' }]}>{translation}</Text>
              ) : null}
              {verseKey ? (
                <View style={{ alignItems: rtl ? 'flex-start' : 'flex-end', marginTop: spacing.sm }}>
                  <VerseAudioButton
                    verseKey={verseKey}
                    showLabel
                    size="md"
                    label={lang === 'en' ? 'Listen' : lang === 'ar' ? 'استمع' : 'سنیں'}
                  />
                </View>
              ) : null}
            </Card>
          ) : null}

          {/* Ḥadīth (Sunnah entries) */}
          {((e as any).hadith_ar || hadithText) ? (
            <Card>
              {(e as any).hadith_ar ? (
                <Text style={styles.arabic}>{(e as any).hadith_ar}</Text>
              ) : null}
              {hadithText ? (
                <Text style={[styles.translation, { textAlign: rtl ? 'right' : 'left' }]}>{hadithText}</Text>
              ) : null}
              {(e as any).grade ? (
                <Text style={[styles.secondary, { textAlign: rtl ? 'right' : 'left' }]}>
                  {lang === 'en' ? `Grade: ${(e as any).grade}` : lang === 'ar' ? `الدرجة: ${(e as any).grade}` : `درجہ: ${(e as any).grade}`}
                </Text>
              ) : null}
            </Card>
          ) : null}

          {/* Classical anchor (PRIMARY) */}
          <Card accent={colors.gold}>
            <View style={[styles.iconRow, rtl && { flexDirection: 'row-reverse' }]}>
              <Ionicons name="library" size={18} color={colors.gold} />
              <Text style={styles.classicalLabel}>
                {classicalAnchor
                  ? (lang === 'en' ? 'CLASSICAL ANCHOR' : lang === 'ar' ? 'الأصل الكلاسيكي' : 'کلاسیکی اصل')
                  : (lang === 'en' ? 'TRADITIONAL TAFSEER (PRIMARY)' : lang === 'ar' ? 'التفسير الكلاسيكي (الأصل)' : 'کلاسیکی تفسیر (اصل)')}
              </Text>
            </View>
            <Text style={[styles.body, { textAlign: rtl ? 'right' : 'left' }]}>
              {classicalAnchor || (
                lang === 'en' ? 'The traditional tafseer of this āyah — per the Prophet ﷺ, his Companions, and the classical scholars (Ibn Kathīr, al-Ṭabarī, al-Saʿdī, al-Jalālayn) — establishes its primary meaning. Full citations will be loaded here once content authoring is complete.' :
                lang === 'ar' ? 'التفسير الكلاسيكي لهذه الآية وفقًا للنبيّ ﷺ وصحابته والعلماء الكلاسيكيين (ابن كثير، الطبري، السعدي، الجلالين) هو الأصل. الاقتباسات الكاملة ستظهر عند اكتمال التأليف.' :
                'اس آیت کی روایتی تفسیر — جیسا کہ نبی ﷺ، صحابہ، اور کلاسیکی علماء (ابن کثیر، طبری، السعدی، الجلالین) سے ثابت ہے — اصل ہے۔ تحریر مکمل ہونے پر حوالے لگائے جائیں گے۔'
              )}
            </Text>
          </Card>

          {/* Modern scientific link / possible reading (SECONDARY) */}
          {(modernLink || scienceHook) ? (
            <Card accent={colors.silver}>
              <View style={[styles.iconRow, rtl && { flexDirection: 'row-reverse' }]}>
                <Ionicons name="telescope" size={18} color={colors.silver} />
                <Text style={styles.scienceLabel}>
                  {modernLink
                    ? (lang === 'en' ? 'MODERN SCIENTIFIC LINK' : lang === 'ar' ? 'الربط العلمي الحديث' : 'جدید سائنسی ربط')
                    : (lang === 'en' ? 'POSSIBLE SCIENTIFIC READING' : lang === 'ar' ? 'قراءة علمية محتملة' : 'ممکنہ سائنسی قراءت')}
                </Text>
              </View>
              <Text style={[styles.body, { textAlign: rtl ? 'right' : 'left' }]}>{modernLink || scienceHook}</Text>
              <Text style={[styles.secondary, { textAlign: rtl ? 'right' : 'left' }]}>
                {lang === 'en' ? 'Note: This is a SECONDARY inference, not a doctrine. It does not replace the traditional meaning.' :
                  lang === 'ar' ? 'ملحوظة: هذه استنباطات ثانوييّة وليست عقيدة، ولا تحلّ محلّ المعنى الكلاسيكي.' :
                  'نوٹ: یہ ثانوی قیاس ہے، عقیدہ نہیں۔ یہ کلاسیکی معنی کی جگہ نہیں لیتا۔'}
              </Text>
            </Card>
          ) : null}

          {/* Universal disclaimer */}
          <View style={styles.discWrap}>
            <Text style={[styles.discBody, { textAlign: rtl ? 'right' : 'center' }]}>{t('classicalPrimacy', lang)}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, paddingTop: spacing.md, gap: spacing.sm },
  refRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ref: { ...ty.small, color: colors.gold, fontWeight: '700' },
  title: { ...ty.h1, color: colors.silverHi, marginTop: 4 },
  arabic: { ...ty.arabicLarge, color: colors.parchment, textAlign: 'right', marginTop: 14, lineHeight: 44, fontSize: 26 },
  translation: { ...ty.body, color: colors.silverHi, fontStyle: 'italic', lineHeight: 24, marginTop: 12 },
  classicalLabel: { ...ty.label, color: colors.gold, flex: 1 },
  scienceLabel: { ...ty.label, color: colors.silver, flex: 1 },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  body: { ...ty.body, color: colors.textDim, lineHeight: 22 },
  secondary: { ...ty.tiny, color: colors.textMuted, marginTop: spacing.md, fontStyle: 'italic', lineHeight: 16 },
  discWrap: { paddingHorizontal: spacing.md, paddingVertical: spacing.lg, alignItems: 'center', marginTop: spacing.sm },
  discBody: { ...ty.small, color: colors.textMuted, lineHeight: 18, fontStyle: 'italic' },
});
