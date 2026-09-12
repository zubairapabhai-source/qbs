/**
 * SacredCountdownCard — quietly appears on home in the last 10 days
 * before Ramadan or the first 10 of Dhul-Hijjah. Silent otherwise.
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, type as ty } from '../theme';
import { DUAS_BASE } from '../duasWallApi';

interface CountdownCard {
  kind: 'ramadan' | 'sacred_ten';
  days: number;
  title: string;
  body: string;
  emoji: string;
}

export function SacredCountdownCard() {
  const [card, setCard] = useState<CountdownCard | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 6000);
        const res = await fetch(`${DUAS_BASE}/api/community/sacred-countdown`, { signal: ctrl.signal });
        clearTimeout(t);
        if (!res.ok) return;
        const body = await res.json();
        if (!cancelled && body.card) setCard(body.card);
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!card) return null;

  return (
    <View style={styles.card} testID="sacred-countdown-card">
      <View style={styles.headerRow}>
        <Text style={styles.emoji}>{card.emoji}</Text>
        <Text style={styles.kicker}>{card.title}</Text>
      </View>
      <Text style={styles.body}>{card.body}</Text>
      <View style={styles.dotRow}>
        {Array.from({ length: 10 }).map((_, i) => (
          <View key={i} style={[styles.dot, i < 10 - card.days && styles.dotFilled]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(201,162,39,0.10)',
    borderWidth: 1, borderColor: colors.gold,
    gap: 6,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emoji: { fontSize: 20 },
  kicker: { ...ty.body, color: colors.gold, fontWeight: '800',},
  body: { ...ty.tiny, color: colors.text, lineHeight: 18 },
  dotRow: { flexDirection: 'row', gap: 4, marginTop: 6 },
  dot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(201,162,39,0.20)' },
  dotFilled: { backgroundColor: colors.gold },
});
