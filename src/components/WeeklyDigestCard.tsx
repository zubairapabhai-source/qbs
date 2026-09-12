/**
 * WeeklyDigestCard — one-line anonymous ummah recap of the last 7 days.
 * Appears on home screen alongside CommunityPulse. Rotates weekly server-side.
 */
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, type as ty } from '../theme';
import { DUAS_BASE } from '../duasWallApi';

interface Digest {
  headline: string;
  top_category?: string | null;
  stats: { emoji: string; value: number; label: string }[];
}

export function WeeklyDigestCard() {
  const router = useRouter();
  const [digest, setDigest] = useState<Digest | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 6000);
        const res = await fetch(`${DUAS_BASE}/api/community/weekly-digest`, { signal: ctrl.signal });
        clearTimeout(t);
        if (!res.ok) return;
        const body = await res.json();
        if (!cancelled) setDigest(body);
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!digest || !digest.headline) return null;

  return (
    <Pressable
      onPress={() => router.push('/dua-wall' as any)}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
      testID="weekly-digest-card"
    >
      <View style={styles.headerRow}>
        <Ionicons name="calendar" size={13} color={colors.gold} />
        <Text style={styles.kicker}>THIS WEEK IN THE UMMAH</Text>
      </View>
      <Text style={styles.headline}>{digest.headline}</Text>
      <View style={styles.statsRow}>
        {digest.stats.map((s, i) => (
          <View key={i} style={styles.stat}>
            <Text style={styles.statEmoji}>{s.emoji}</Text>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
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
  headline: { ...ty.body, color: colors.text, lineHeight: 22 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6, marginTop: 4 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statEmoji: { fontSize: 16 },
  statValue: { color: colors.gold, fontWeight: '800', fontSize: 18 },
  statLabel: { ...ty.tiny, color: colors.textDim, fontSize: 10, textAlign: 'center' },
});
