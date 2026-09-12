/**
 * UmmahLeaderboardCard — top-blessed duʿās of the month.
 * Anonymous, respectful, driving repeat visits and encouraging quality posts.
 */
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, type as ty } from '../theme';
import { DUAS_BASE, CATEGORY_LABELS, type DuaCategory } from '../duasWallApi';

interface LeaderItem {
  id: string;
  category: DuaCategory;
  text: string;
  lang: 'en' | 'ar' | 'ur';
  bless_count: number;
}

export function UmmahLeaderboardCard() {
  const router = useRouter();
  const [items, setItems] = useState<LeaderItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 6000);
        const res = await fetch(`${DUAS_BASE}/api/community/leaderboard?period=month&limit=3`, { signal: ctrl.signal });
        clearTimeout(t);
        if (!res.ok) return;
        const body = await res.json();
        if (!cancelled) setItems(body.items || []);
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!items.length) return null;

  return (
    <Pressable
      onPress={() => router.push('/dua-wall' as any)}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
      testID="ummah-leaderboard-card"
    >
      <View style={styles.headerRow}>
        <Ionicons name="trophy" size={13} color={colors.gold} />
        <Text style={styles.kicker}>MOST-BLESSED THIS MONTH</Text>
        <View style={{ flex: 1 }} />
        <Ionicons name="chevron-forward" size={14} color={colors.gold} />
      </View>
      {items.slice(0, 3).map((it, i) => (
        <View key={it.id} style={styles.row}>
          <Text style={styles.rank}>#{i + 1}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.text} numberOfLines={2}>{it.text}</Text>
            <Text style={styles.meta}>{CATEGORY_LABELS[it.category].en}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeEmoji}>🤲</Text>
            <Text style={styles.badgeCount}>{it.bless_count}</Text>
          </View>
        </View>
      ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.cardBorder,
    gap: spacing.sm,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  kicker: { ...ty.tiny, color: colors.gold, letterSpacing: 1.5, fontSize: 10, fontWeight: '800' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(201,162,39,0.10)',
  },
  rank: { color: colors.gold, fontWeight: '900', fontSize: 13, width: 24, textAlign: 'center' },
  text: { color: colors.text, fontSize: 12, lineHeight: 17 },
  meta: { color: colors.textDim, fontSize: 10, marginTop: 2 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(201,162,39,0.10)',
  },
  badgeEmoji: { fontSize: 12 },
  badgeCount: { color: colors.gold, fontWeight: '800', fontSize: 11 },
});
