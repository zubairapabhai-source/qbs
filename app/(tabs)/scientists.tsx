/**
 * Scientists tab — alphabetical list with era / field filters.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../src/components/Card';
import { Chip } from '../../src/components/Chip';
import { Empty } from '../../src/components/Empty';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { listScientists, type Scientist } from '../../src/api';
import { useApp } from '../../src/store/useApp';
import { LockBanner, LockedTile, FREE_PREVIEW_LIMIT } from '../../src/iap/gate';
import { t } from '../../src/i18n/strings';
import { colors, radius, spacing, type as ty } from '../../src/theme';

const ERA_LABELS_EN: Record<string, string> = {
  early_islam_7c: 'Early Islam (7c)',
  early_abbasid_8c_9c: 'Early Abbasid (8–9c)',
  golden_age_9c_10c: 'Golden Age (9–10c)',
  high_golden_age_10c_11c: 'High Golden Age (10–11c)',
  andalusian_11c_12c: 'Andalusian (11–12c)',
  post_mongol_13c_14c: 'Post-Mongol (13–14c)',
  late_classical_15c_16c: 'Late Classical (15–16c)',
  modern_20c_21c: 'Modern (20–21c)',
};

export default function ScientistsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const lang = useApp((s) => s.lang);
  const unlocked = useApp((s) => s.unlocked);
  const rtl = lang === 'ar' || lang === 'ur';
  const [data, setData] = useState<{ scientists: Scientist[]; eras: string[]; fields: string[] }>({ scientists: [], eras: [], fields: [] });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [era, setEra] = useState<string | null>(null);
  const [field, setField] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const r = await listScientists(lang);
      setData(r);
      setLoading(false);
    })();
  }, [lang]);

  const sorted = useMemo(() => {
    return [...data.scientists].sort((a, b) => (a.name_en || '').localeCompare(b.name_en || ''));
  }, [data.scientists]);

  const filtered = useMemo(() => {
    return sorted.filter((s) => {
      if (era && s.era !== era) return false;
      if (field && !(s.fields || []).includes(field)) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const inEn = (s.name_en || '').toLowerCase().includes(q);
        const inAr = (s.name_ar || '').includes(query);
        const inWestern = (s.name_western || '').toLowerCase().includes(q);
        const inRegion = (s.region || '').toLowerCase().includes(q);
        if (!inEn && !inAr && !inWestern && !inRegion) return false;
      }
      return true;
    });
  }, [sorted, era, field, query]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title={t('scientistsTitle', lang)}
        subtitle={t('scientistsSub', lang)}
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        <Chip label={t('allEras', lang)} selected={era == null} onPress={() => setEra(null)} tone="silver" size="sm" />
        {data.eras.map((e) => (
          <Chip key={e} label={ERA_LABELS_EN[e] || e} selected={era === e} onPress={() => setEra(era === e ? null : e)} tone="amber" size="sm" />
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        <Chip label={t('allFields', lang)} selected={field == null} onPress={() => setField(null)} tone="silver" size="sm" />
        {data.fields.slice(0, 18).map((f) => (
          <Chip key={f} label={f.replace(/_/g, ' ')} selected={field === f} onPress={() => setField(field === f ? null : f)} tone="emerald" size="sm" />
        ))}
      </ScrollView>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.silver} />
        </View>
      ) : filtered.length === 0 ? (
        <Empty icon="search-outline" title={t('noResults', lang)} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(s) => s.id}
          ListHeaderComponent={<LockBanner />}
          contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + 100 }}
          renderItem={({ item: s, index }) => {
            const locked = !unlocked && index >= FREE_PREVIEW_LIMIT;
            return (
              <LockedTile
                locked={locked}
                onPress={() => router.push(`/scientist/${s.id}` as any)}
                style={{ marginBottom: spacing.sm }}
              >
                <Card accent={colors.amber}>
                  <View style={[styles.row, rtl && { flexDirection: 'row-reverse' }]}>
                    <View style={[styles.avatar, { backgroundColor: colors.amber + '22', borderColor: colors.amber + '55' }]}>
                      <Text style={styles.avatarTxt}>{(s.name_en || '?').match(/[A-Za-zʿʻ]/)?.[0]?.toUpperCase() || '?'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.name, { textAlign: rtl ? 'right' : 'left' }]} numberOfLines={1}>{s.name_en}</Text>
                      {s.name_ar ? <Text style={[styles.nameAr, { textAlign: rtl ? 'right' : 'left' }]} numberOfLines={1}>{s.name_ar}</Text> : null}
                      <View style={[styles.metaRow, rtl && { flexDirection: 'row-reverse' }]}>
                        {s.region ? <Text style={styles.meta} numberOfLines={1}>{s.region}</Text> : null}
                        {s.death_year_ce ? <Text style={styles.meta}> · {t('died', lang)} {s.death_year_ce} CE</Text> : null}
                      </View>
                      <View style={styles.fields}>
                        {(s.fields || []).slice(0, 3).map((f) => (
                          <Chip key={f} label={f.replace(/_/g, ' ')} tone="emerald" size="sm" />
                        ))}
                      </View>
                    </View>
                    <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={20} color={colors.silverDim} />
                  </View>
                </Card>
              </LockedTile>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, marginHorizontal: spacing.lg, marginTop: spacing.md, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.cardBorder, gap: 8 },
  searchInput: { flex: 1, ...ty.body, color: colors.text, paddingVertical: 10 },
  filterScroll: { maxHeight: 40, marginTop: spacing.sm },
  filterContent: { paddingHorizontal: spacing.lg, gap: 6, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  avatarTxt: { ...ty.h2, color: colors.amber, fontSize: 20 },
  name: { ...ty.h3, color: colors.silverHi },
  nameAr: { ...ty.body, color: colors.gold, marginTop: 2 },
  metaRow: { flexDirection: 'row', marginTop: 4, flexWrap: 'wrap' },
  meta: { ...ty.small, color: colors.textMuted, fontSize: 12 },
  fields: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
});
