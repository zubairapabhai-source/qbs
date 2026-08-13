/**
 * Bookmarks screen — shows everything the user has saved across the app:
 * scientists, A–Z topics, and verses.  Tap a row to open the original page.
 *
 * Backed by the lightweight @qbs:bookmarks store (AsyncStorage).
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../src/components/Card';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { listAtozSeed, listScientists, type AtozEntry, type Scientist } from '../src/api';
import { toggleBookmark, useBookmarks } from '../src/store/bookmarks';
import { useApp } from '../src/store/useApp';
import { t } from '../src/i18n/strings';
import { colors, radius, spacing, type as ty } from '../src/theme';

interface VerseLite { key: string; surah_name?: string; }

export default function BookmarksScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const lang = useApp((s) => s.lang);
  const rtl = lang === 'ar' || lang === 'ur';
  const bm = useBookmarks();
  const [allSci, setAllSci] = useState<Scientist[]>([]);
  const [allEntries, setAllEntries] = useState<AtozEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [sci, atoz] = await Promise.all([listScientists(), listAtozSeed()]);
        setAllSci(sci.scientists || []);
        setAllEntries(atoz.entries || []);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const savedSci = (bm.scientist || []).map((id) => allSci.find((s) => s.id === id)).filter(Boolean) as Scientist[];
  const savedEntries = (bm.entry || []).map((slug) => allEntries.find((e) => e.slug === slug)).filter(Boolean) as AtozEntry[];
  const savedVerses: VerseLite[] = (bm.verse || []).map((k) => ({ key: k }));

  const total = savedSci.length + savedEntries.length + savedVerses.length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title={t('bookmarks', lang)} showBack />
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.silver} />
        </View>
      ) : total === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="bookmark-outline" size={56} color={colors.silverDim} />
          <Text style={[styles.emptyText, { textAlign: rtl ? 'right' : 'center' }]}>{t('bookmarksEmpty', lang)}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl, gap: spacing.lg }}>
          {savedSci.length > 0 ? (
            <Section
              title={`${t('bmScientists', lang)} · ${savedSci.length}`}
              icon="person-outline"
              accent={colors.amber}
            >
              {savedSci.map((s) => (
                <Row
                  key={s.id}
                  title={s.name_en}
                  subtitle={[s.region, s.death_year_ce ? `${t('died', lang)} ${s.death_year_ce} CE` : ''].filter(Boolean).join(' · ')}
                  onPress={() => router.push(`/scientist/${s.id}` as any)}
                  onRemove={() => toggleBookmark('scientist', s.id)}
                  rtl={rtl}
                />
              ))}
            </Section>
          ) : null}

          {savedEntries.length > 0 ? (
            <Section title={`${t('bmTopics', lang)} · ${savedEntries.length}`} icon="book-outline" accent={colors.gold}>
              {savedEntries.map((e) => (
                <Row
                  key={e.slug}
                  title={e.topic}
                  subtitle={e.ref}
                  onPress={() => router.push(`/entry/${e.slug}` as any)}
                  onRemove={() => toggleBookmark('entry', e.slug)}
                  rtl={rtl}
                />
              ))}
            </Section>
          ) : null}

          {savedVerses.length > 0 ? (
            <Section title={`${t('bmVerses', lang)} · ${savedVerses.length}`} icon="bookmark" accent={colors.silver}>
              {savedVerses.map((v) => (
                <Row
                  key={v.key}
                  title={`Qurʾān ${v.key}`}
                  subtitle={lang === 'en' ? 'Tap to open verse + tafseer' : lang === 'ar' ? 'افتح الآية والتفسير' : 'آیت اور تفسیر کھولیں'}
                  onPress={() => router.push(`/verse/${encodeURIComponent(v.key)}` as any)}
                  onRemove={() => toggleBookmark('verse', v.key)}
                  rtl={rtl}
                />
              ))}
            </Section>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

function Section({ title, icon, accent, children }: { title: string; icon: keyof typeof Ionicons.glyphMap; accent: string; children: React.ReactNode }) {
  return (
    <Card accent={accent}>
      <View style={styles.secHeader}>
        <Ionicons name={icon} size={16} color={accent} />
        <Text style={[styles.secTitle, { color: accent }]}>{title.toUpperCase()}</Text>
      </View>
      <View style={{ gap: 4 }}>{children}</View>
    </Card>
  );
}

function Row({ title, subtitle, onPress, onRemove, rtl }: { title: string; subtitle?: string; onPress: () => void; onRemove: () => void; rtl: boolean }) {
  return (
    <View style={[styles.rowWrap, rtl && { flexDirection: 'row-reverse' }]}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.rowMain, pressed && { opacity: 0.6 }]}>
        <Text style={[styles.rowTitle, { textAlign: rtl ? 'right' : 'left' }]} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={[styles.rowSub, { textAlign: rtl ? 'right' : 'left' }]} numberOfLines={1}>{subtitle}</Text> : null}
      </Pressable>
      <Pressable onPress={onRemove} hitSlop={10} style={({ pressed }) => [styles.removeBtn, pressed && { opacity: 0.6 }]}>
        <Ionicons name="close-circle" size={22} color={colors.silverDim} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  emptyText: { ...ty.body, color: colors.textMuted, lineHeight: 22, maxWidth: 320 },
  secHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  secTitle: { ...ty.label, fontSize: 11 },
  rowWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.xs, gap: spacing.sm },
  rowMain: { flex: 1, paddingVertical: 4 },
  rowTitle: { ...ty.body, color: colors.text, fontWeight: '600' },
  rowSub: { ...ty.tiny, color: colors.textMuted, marginTop: 2 },
  removeBtn: { padding: 4 },
});
