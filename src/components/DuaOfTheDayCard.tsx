/**
 * DuaOfTheDayCard — rotates each dawn. Ties the app opening to a soft
 * "the ummah is with you" moment. Falls back silently if empty.
 */
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, type as ty } from '../theme';
import { DUAS_BASE, CATEGORY_LABELS, type DuaCategory } from '../duasWallApi';

interface DuaOfDay {
  id: string;
  category: DuaCategory;
  text: string;
  lang: 'en' | 'ar' | 'ur';
  bless_count: number;
}

export function DuaOfTheDayCard() {
  const router = useRouter();
  const [dua, setDua] = useState<DuaOfDay | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 6000);
        const res = await fetch(`${DUAS_BASE}/api/duas/of-the-day`, { signal: ctrl.signal });
        clearTimeout(t);
        if (!res.ok) return;
        const body = await res.json();
        if (!cancelled && body.dua) setDua(body.dua);
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!dua) return null;
  const cat = CATEGORY_LABELS[dua.category];

  return (
    <Pressable
      onPress={() => router.push('/dua-wall' as any)}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
      testID="dua-of-day-card"
    >
      <View style={styles.headerRow}>
        <Ionicons name="rose" size={13} color={colors.gold} />
        <Text style={styles.kicker}>DUʿĀ OF THE DAY</Text>
        <View style={{ flex: 1 }} />
        <View style={styles.blessBadge}>
          <Text style={styles.blessEmoji}>🤲</Text>
          <Text style={styles.blessCount}>{dua.bless_count}</Text>
        </View>
      </View>
      <Text style={styles.text} numberOfLines={4}>{dua.text}</Text>
      <View style={styles.footRow}>
        <Text style={styles.category}>{cat.en}</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.cta}>Read on the wall →</Text>
      </View>
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
  blessBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: 'rgba(201,162,39,0.10)' },
  blessEmoji: { fontSize: 12 },
  blessCount: { color: colors.gold, fontWeight: '800', fontSize: 11 },
  text: { ...ty.body, color: colors.text, lineHeight: 22, fontStyle: 'italic' },
  footRow: { flexDirection: 'row', alignItems: 'center' },
  category: { color: colors.gold, fontSize: 10, letterSpacing: 0.5, fontWeight: '700', textTransform: 'uppercase' },
  cta: { color: colors.gold, fontSize: 11, fontWeight: '700' },
});
