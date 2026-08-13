/**
 * A–Z tab — browse 17 scientific verse-readings (seed).
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../src/components/Card';
import { Empty } from '../../src/components/Empty';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { listAtozSeed, type AtozEntry } from '../../src/api';
import { useApp } from '../../src/store/useApp';
import { LockBanner, LockedTile, FREE_PREVIEW_LIMIT } from '../../src/iap/gate';
import { t } from '../../src/i18n/strings';
import { colors, radius, spacing, type as ty } from '../../src/theme';

export default function AtoZScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const lang = useApp((s) => s.lang);
  const rtl = lang === 'ar' || lang === 'ur';
  const [entries, setEntries] = useState<AtozEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    (async () => {
      const r = await listAtozSeed();
      setEntries(r.entries);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return entries;
    const q = query.toLowerCase();
    return entries.filter((e) =>
      (e.topic || '').toLowerCase().includes(q) ||
      (e.slug || '').toLowerCase().includes(q) ||
      (e.science_hook || '').toLowerCase().includes(q) ||
      (e.ref || '').toLowerCase().includes(q) ||
      // big-bang ↔ "big bang", "big bang theory" → match by hyphenated slug
      (e.slug || '').replace(/-/g, ' ').toLowerCase().includes(q) ||
      (e.translation_en || '').toLowerCase().includes(q) ||
      (e.hadith_en || '').toLowerCase().includes(q)
    );
  }, [entries, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, AtozEntry[]>();
    filtered.forEach((e) => {
      // Prefer a latin first-letter from slug or science_hook; otherwise the
      // first latin char in topic. Falls back to '#' for non-latin-only items.
      const candidates = `${e.slug || ''} ${e.science_hook || ''} ${e.topic || ''}`;
      const m = candidates.match(/[A-Za-z]/);
      const letter = (m ? m[0] : '#').toUpperCase();
      const k = /[A-Z]/.test(letter) ? letter : '#';
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(e);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  // Flat-index map so lock applies across letter groups, not within each group.
  const unlocked = useApp((s) => s.unlocked);
  const flatIndexBySlug = useMemo(() => {
    const m = new Map<string, number>();
    let i = 0;
    grouped.forEach(([, items]) => items.forEach((e, j) => {
      const key = e.slug || `${e.topic || 'idx'}-${j}`;
      m.set(key, i++);
    }));
    return m;
  }, [grouped]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title={t('atozTitle', lang)}
        subtitle={t('atozSub', lang)}
        rightAction={{ icon: 'settings-outline', onPress: () => router.push('/settings') }}
      />

      <View style={[styles.searchWrap, rtl && { flexDirection: 'row-reverse' }]}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { textAlign: rtl ? 'right' : 'left' }]}
          placeholder={t('searchPlaceholder', lang)}
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.silver} />
        </View>
      ) : filtered.length === 0 ? (
        <Empty icon="search-outline" title={t('noResults', lang)} />
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={([k]) => k}
          ListHeaderComponent={<LockBanner />}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 100 }}
          renderItem={({ item: [letter, items] }) => (
            <View style={{ marginBottom: spacing.lg }}>
              <View style={styles.letterRow}>
                <View style={styles.letterCircle}>
                  <Text style={styles.letter}>{letter}</Text>
                </View>
                <View style={styles.letterLine} />
              </View>
              {items.map((e) => {
                const idx = flatIndexBySlug.get(e.slug) ?? 0;
                const locked = !unlocked && idx >= FREE_PREVIEW_LIMIT;
                return (
                  <LockedTile
                    key={e.slug}
                    locked={locked}
                    onPress={() => router.push(`/entry/${e.slug}` as any)}
                    style={{ marginBottom: spacing.sm }}
                  >
                    <Card accent={colors.silver}>
                      <Text style={[styles.cardTopic, { textAlign: rtl ? 'right' : 'left' }]}>{e.topic}</Text>
                      <View style={[styles.refRow, rtl && { flexDirection: 'row-reverse' }]}>
                        <Ionicons name="book-outline" size={13} color={colors.gold} />
                        <Text style={styles.ref}>{e.ref}</Text>
                      </View>
                      {e.science_hook ? (
                        <Text style={[styles.hook, { textAlign: rtl ? 'right' : 'left' }]} numberOfLines={2}>{e.science_hook}</Text>
                      ) : null}
                    </Card>
                  </LockedTile>
                );
              })}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, marginHorizontal: spacing.lg, marginTop: spacing.md, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.cardBorder, gap: 8 },
  searchInput: { flex: 1, ...ty.body, color: colors.text, paddingVertical: 10 },
  letterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  letterCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.silver + '22', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.silver + '55' },
  letter: { color: colors.silverHi, fontWeight: '800', fontSize: 14 },
  letterLine: { flex: 1, height: 1, backgroundColor: colors.divider },
  cardTopic: { ...ty.h3, color: colors.silverHi, marginBottom: 6 },
  refRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  ref: { ...ty.small, color: colors.gold, fontWeight: '600' },
  hook: { ...ty.small, color: colors.textDim, lineHeight: 18 },
});
