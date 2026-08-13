/**
 * Verse detail page reached from the Recite tab match results.
 * Shows: Arabic ayah → 4-tafseer cards → optional Scientific reading.
 */
import { Ionicons } from '@expo/vector-icons';
import { t } from '../../src/i18n/strings';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../src/components/Card';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { VerseAudioButton } from '../../src/components/VerseAudioButton';
import { isBookmarked, toggleBookmark, useBookmarks } from '../../src/store/bookmarks';
import { useApp } from '../../src/store/useApp';
import { colors, spacing, type as ty } from '../../src/theme';

const BASE = process.env.EXPO_PUBLIC_QBS_API_URL || '';

interface VerseFull {
  found: boolean;
  key: string;
  surah: number;
  verse: number;
  surah_name_en: string;
  text: string;
  tafseers: { source: string; lang: string; paragraphs: string[] }[];
  scientific: null | { slug: string; ref: string; topic: string; science_hook?: string };
}

const SOURCE_LABEL: Record<string, string> = {
  'ibn-kathir': 'Tafsīr Ibn Kathīr',
  'ibn_kathir': 'Tafsīr Ibn Kathīr',
  'al-saadi': 'Tafsīr al-Saʿdī',
  'al_saadi': 'Tafsīr al-Saʿdī',
  'al-muyassar': 'Al-Tafsīr al-Muyassar',
  'al_muyassar': 'Al-Tafsīr al-Muyassar',
  'al-jalalayn': 'Tafsīr al-Jalālayn',
  'al_jalalayn': 'Tafsīr al-Jalālayn',
};

export default function VerseFullPage() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const lang = useApp((s) => s.lang);
  const rtl = lang === 'ar' || lang === 'ur';
  const [data, setData] = useState<VerseFull | null>(null);
  const [loading, setLoading] = useState(true);
  useBookmarks();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (!BASE) { setData(null); return; }
        const res = await fetch(`${BASE}/api/verse/${encodeURIComponent(String(key))}/full`);
        const body = (await res.json()) as VerseFull;
        setData(body);
      } catch {
        setData(null);
      } finally { setLoading(false); }
    })();
  }, [key]);

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
      <ActivityIndicator color={colors.silver} />
    </View>
  );
  if (!data || !data.found) return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title={t('a3_key_verseNotFound') || 'Verse not found'} showBack />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title={`${data.surah_name_en} · ${data.key}`}
        showBack
        rightAction={{
          icon: isBookmarked('verse', data.key) ? 'bookmark' : 'bookmark-outline',
          onPress: () => { toggleBookmark('verse', data.key); },
        }}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
        {/* Hero — the ayah itself */}
        <LinearGradient
          colors={[colors.silver + '22', colors.bg]}
          style={styles.hero}
        >
          <Text style={styles.kicker}>SŪRAH {data.surah} · ĀYAH {data.verse}</Text>
          <Text style={styles.arabic}>{data.text}</Text>
          <View style={{ alignItems: 'center', marginTop: 14 }}>
            <VerseAudioButton verseKey={data.key} size="md" showLabel label="🎧 Listen — Sh. Mishary al-‘Afāsy" />
          </View>
        </LinearGradient>

        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          {/* Ask Sheikh deep-link — keeps the Mic→Verse→Tafseer→Sheikh loop closed */}
          <Card accent={colors.rose} onPress={() => {
            const q = lang === 'en' ? `Please explain Qur'an ${data.key} — its tafseer and any modern scientific reading.` :
                     lang === 'ar' ? `اشرح لي القرآن ${data.key} — التفسير وأيّ قراءة علمية حديثة.` :
                     `قرآن ${data.key} کی وضاحت فرمائیں — تفسیر اور کوئی جدید سائنسی قراءت۔`;
            router.push({ pathname: '/(tabs)/sheikh', params: { prefill: q } } as any);
          }}>
            <View style={[styles.row, rtl && { flexDirection: 'row-reverse' }]}>
              <Ionicons name="sparkles" size={18} color={colors.rose} />
              <Text style={[styles.scienceLabel, { color: colors.rose, flex: 1 }]}>
                {lang === 'en' ? 'ASK THE SHEIKH ABOUT THIS VERSE' :
                 lang === 'ar' ? 'اسأل الشيخ عن هذه الآية' :
                 'اس آیت پر شیخ سے پوچھیں'}
              </Text>
              <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.silverDim} />
            </View>
          </Card>

          {/* Scientific link if present */}
          {data.scientific ? (
            <Card accent={colors.silver} onPress={() => router.push(`/entry/${data.scientific!.slug}` as any)}>
              <View style={[styles.row, rtl && { flexDirection: 'row-reverse' }]}>
                <Ionicons name="telescope" size={20} color={colors.silver} />
                <Text style={styles.scienceLabel}>
                  {lang === 'en' ? 'A POSSIBLE SCIENTIFIC READING'
                   : lang === 'ar' ? 'قراءة علمية محتملة'
                   : 'ممکنہ سائنسی قراءت'}
                </Text>
                <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.silverDim} />
              </View>
              <Text style={[styles.sciTopic, { textAlign: rtl ? 'right' : 'left' }]}>{data.scientific.topic}</Text>
              {data.scientific.science_hook ? (
                <Text style={[styles.sciBody, { textAlign: rtl ? 'right' : 'left' }]} numberOfLines={3}>
                  {data.scientific.science_hook}
                </Text>
              ) : null}
              <Text style={styles.tapMore}>
                {lang === 'en' ? 'Tap for full reading →' : lang === 'ar' ? '← انقر للقراءة الكاملة' : '← مکمل پڑھیں'}
              </Text>
            </Card>
          ) : null}

          {/* Tafseer cards */}
          {data.tafseers.length === 0 ? (
            <Card accent={colors.gold}>
              <Text style={styles.label}>TAFSEER</Text>
              <Text style={styles.body}>
                {lang === 'en' ? 'Tafseer paragraphs for this verse are being indexed. Please check back shortly.'
                 : lang === 'ar' ? 'يتم فهرسة فقرات التفسير لهذه الآية. يُرجى الرجوع لاحقاً.'
                 : 'اس آیت کی تفسیر تیار کی جا رہی ہے۔ تھوڑی دیر بعد دوبارہ دیکھیں۔'}
              </Text>
            </Card>
          ) : (
            data.tafseers.map((t) => (
              <Card key={t.source} accent={colors.gold}>
                <View style={[styles.row, rtl && { flexDirection: 'row-reverse' }]}>
                  <Ionicons name="library" size={16} color={colors.gold} />
                  <Text style={[styles.label, { color: colors.gold, flex: 1 }]}>
                    {SOURCE_LABEL[t.source] || t.source.toUpperCase()}
                  </Text>
                </View>
                {t.paragraphs.map((p, i) => (
                  <Text key={i} style={[
                    styles.tafseerText,
                    t.lang === 'ar' && { textAlign: 'right', fontSize: 16, lineHeight: 28 },
                    i > 0 && { marginTop: spacing.sm },
                  ]}>{p}</Text>
                ))}
              </Card>
            ))
          )}

          {/* Aqeedah footer */}
          <View style={{ paddingHorizontal: spacing.sm, paddingTop: spacing.md }}>
            <Text style={[styles.footer, { textAlign: rtl ? 'right' : 'center' }]}>
              {lang === 'en' ? 'The traditional tafseer holds primacy. The scientific reading, where shown, is an inference, not a doctrine. Allah knows best.'
               : lang === 'ar' ? 'التفسير الكلاسيكي هو الأصل، والقراءة العلمية إن وُجدت استنباطٌ لا عقيدة. والله أعلم.'
               : 'کلاسیکی تفسیر اصل ہے؛ سائنسی قراءت (اگر دکھائی گئی ہو) ایک اخذِ مفہوم ہے، نہ کہ عقیدہ۔ واللہ اعلم۔'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, alignItems: 'flex-end' },
  kicker: { ...ty.label, color: colors.silver, marginBottom: spacing.md, alignSelf: 'flex-start' },
  arabic: { fontSize: 28, lineHeight: 50, color: colors.parchment, textAlign: 'right' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  scienceLabel: { ...ty.label, color: colors.silver, flex: 1 },
  sciTopic: { ...ty.h3, color: colors.silverHi, marginTop: 4 },
  sciBody: { ...ty.small, color: colors.textDim, marginTop: 6, lineHeight: 19 },
  tapMore: { ...ty.tiny, color: colors.silver, marginTop: spacing.sm, fontWeight: '700' },
  label: { ...ty.label, color: colors.silverDim, marginBottom: 6, fontSize: 10 },
  body: { ...ty.small, color: colors.textDim, lineHeight: 19 },
  tafseerText: { ...ty.body, color: colors.text, lineHeight: 22 },
  footer: { ...ty.tiny, color: colors.textMuted, lineHeight: 16, fontStyle: 'italic' },
});
