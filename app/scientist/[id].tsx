/**
 * Scientist detail — full bio (or seed placeholder).
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../src/components/Card';
import { Chip } from '../../src/components/Chip';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { listScientists, type Scientist } from '../../src/api';
import { isBookmarked, toggleBookmark, useBookmarks } from '../../src/store/bookmarks';
import { useApp } from '../../src/store/useApp';
import { t } from '../../src/i18n/strings';
import { colors, spacing, type as ty } from '../../src/theme';

export default function ScientistDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const lang = useApp((s) => s.lang);
  const rtl = lang === 'ar' || lang === 'ur';
  const [s, setS] = useState<Scientist | null>(null);
  const [loading, setLoading] = useState(true);
  // subscribe to bookmark changes so the header icon re-renders on toggle
  useBookmarks();

  useEffect(() => {
    (async () => {
      const r = await listScientists(lang);
      setS(r.scientists.find((x) => x.id === id) || null);
      setLoading(false);
    })();
  }, [id, lang]);

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
      <ActivityIndicator color={colors.silver} />
    </View>
  );
  if (!s) return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title={t('a3_slug_notFound') || 'Not found'} showBack />
    </View>
  );

  const firstLetter = (s.name_en || '?').match(/[A-Za-zʿʻ]/)?.[0]?.toUpperCase() || '?';
  const bookmarked = isBookmarked('scientist', s.id);

  // Locale-aware field readers — prefer current language, fall back to English.
  const pick = <T,>(field: string): T | undefined => {
    const key = `${field}_${lang}` as keyof Scientist;
    const enKey = `${field}_en` as keyof Scientist;
    return (s[key] as T) ?? (s[enKey] as T);
  };
  const summary = pick<string>('summary');
  const discoveries = pick<string[]>('discoveries') || [];
  const quranLink = pick<string>('quran_sunnah_connection');
  const westernAck = pick<string[]>('western_acknowledgments') || [];
  const name = lang === 'ar' && s.name_ar ? s.name_ar : s.name_en;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title={s.name_en}
        showBack
        rightAction={{
          icon: bookmarked ? 'bookmark' : 'bookmark-outline',
          onPress: () => { toggleBookmark('scientist', s.id); },
        }}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
        {/* Hero */}
        <LinearGradient
          colors={[colors.amber + '22', colors.bg]}
          style={styles.hero}
        >
          <View style={[styles.avatar, { backgroundColor: colors.amber + '33', borderColor: colors.amber }]}>
            <Text style={styles.avatarTxt}>{firstLetter}</Text>
          </View>
          <Text style={[styles.name, { textAlign: rtl ? 'right' : 'left' }]}>{name}</Text>
          {s.name_ar && lang !== 'ar' ? <Text style={[styles.nameAr, { textAlign: rtl ? 'right' : 'left' }]}>{s.name_ar}</Text> : null}
          {s.name_western ? <Text style={[styles.nameWestern, { textAlign: rtl ? 'right' : 'left' }]}>({s.name_western})</Text> : null}
          <View style={[styles.metaRow, rtl && { flexDirection: 'row-reverse' }]}>
            {s.region ? <Text style={styles.meta}>{s.region}</Text> : null}
            {s.death_year_ce ? <Text style={styles.meta}> · {t('died', lang)} {s.death_year_ce} CE</Text> : null}
          </View>
        </LinearGradient>

        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          {/* Fields */}
          <View>
            <Text style={styles.sectionLabel}>{t('fields', lang).toUpperCase()}</Text>
            <View style={styles.fields}>
              {(s.fields || []).map((f) => (
                <Chip key={f} label={f.replace(/_/g, ' ')} tone="emerald" />
              ))}
            </View>
          </View>

          {/* Summary */}
          {summary ? (
            <Card>
              <Text style={styles.sectionLabel}>{t('summary', lang).toUpperCase()}</Text>
              <Text style={[styles.body, { textAlign: rtl ? 'right' : 'left' }]}>{summary}</Text>
            </Card>
          ) : (
            <Card accent={colors.silver}>
              <View style={[styles.iconRow, rtl && { flexDirection: 'row-reverse' }]}>
                <Ionicons name="hourglass-outline" size={18} color={colors.silver} />
                <Text style={styles.placeholderTitle}>{t('authoringInProgress', lang)}</Text>
              </View>
              <Text style={[styles.placeholderBody, { textAlign: rtl ? 'right' : 'left' }]}>
                {lang === 'en' ? 'Full Britannica-style biography — with discoveries, Quran/Sunnah connections, and Western acknowledgments — will appear here once authored.' :
                  lang === 'ar' ? 'ترجمة كاملة تتضمّن الاكتشافات وروابطها بالقرآن والسنّة، تجري تأليفها.' :
                  'پوری سوانح، دریافتیں، اور قرآن و سنت سے ربط پر کام جاری ہے۔'}
              </Text>
            </Card>
          )}

          {/* Discoveries */}
          {discoveries.length > 0 ? (
            <Card>
              <Text style={styles.sectionLabel}>{t('discoveries', lang).toUpperCase()}</Text>
              {discoveries.map((d, i) => (
                <View key={i} style={[styles.bullet, rtl && { flexDirection: 'row-reverse' }]}>
                  <View style={styles.dot} />
                  <Text style={[styles.body, { flex: 1, textAlign: rtl ? 'right' : 'left' }]}>{d}</Text>
                </View>
              ))}
            </Card>
          ) : null}

          {/* Quran connection */}
          {quranLink ? (
            <Card accent={colors.gold}>
              <Text style={[styles.sectionLabel, { color: colors.gold }]}>{t('quranLink', lang).toUpperCase()}</Text>
              <Text style={[styles.body, { textAlign: rtl ? 'right' : 'left' }]}>{quranLink}</Text>
            </Card>
          ) : null}

          {/* Western acknowledgments */}
          {westernAck.length > 0 ? (
            <Card>
              <Text style={styles.sectionLabel}>{t('westernAck', lang).toUpperCase()}</Text>
              {westernAck.map((w, i) => (
                <View key={i} style={[styles.bullet, rtl && { flexDirection: 'row-reverse' }]}>
                  <View style={[styles.dot, { backgroundColor: colors.cyan }]} />
                  <Text style={[styles.body, { flex: 1, textAlign: rtl ? 'right' : 'left' }]}>{w}</Text>
                </View>
              ))}
            </Card>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm, alignItems: 'flex-start' },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 2, marginBottom: spacing.md },
  avatarTxt: { ...ty.display, color: colors.amber, fontSize: 36 },
  name: { ...ty.h1, color: colors.silverHi },
  nameAr: { ...ty.arabic, color: colors.gold, fontSize: 22, marginTop: 4 },
  nameWestern: { ...ty.small, color: colors.textMuted, fontStyle: 'italic', marginTop: 2 },
  metaRow: { flexDirection: 'row', marginTop: spacing.sm, flexWrap: 'wrap' },
  meta: { ...ty.small, color: colors.textDim },
  sectionLabel: { ...ty.label, color: colors.silverDim, marginBottom: 8 },
  fields: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  body: { ...ty.body, color: colors.textDim, lineHeight: 22 },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  placeholderTitle: { ...ty.h3, color: colors.silverHi, fontSize: 14 },
  placeholderBody: { ...ty.small, color: colors.textMuted, lineHeight: 19 },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.silver, marginTop: 9 },
});
