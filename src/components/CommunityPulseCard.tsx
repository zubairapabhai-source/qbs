/**
 * CommunityPulseCard — QBS.
 *
 * Ummah-wide anonymous stats surfaced on the home screen. See Treasures
 * variant for design rationale (kept in sync).
 */
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, type as ty } from '../theme';
import { DUAS_BASE } from '../duasWallApi';

interface Pulse {
  total_duas: number;
  total_blessings: number;
  posted_24h: number;
  tazkiyah_journeys: number;
  active_devices_7d: number;
}

async function fetchPulse(): Promise<Pulse | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(`${DUAS_BASE}/api/community/pulse`, {
      signal: ctrl.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function CommunityPulseCard() {
  const router = useRouter();
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;
    (async () => {
      const p = await fetchPulse();
      if (!cancelled && mountedRef.current) setPulse(p);
    })();
    const iv = setInterval(async () => {
      const p = await fetchPulse();
      if (mountedRef.current) setPulse(p);
    }, 60000);
    return () => {
      cancelled = true;
      mountedRef.current = false;
      clearInterval(iv);
    };
  }, []);

  if (!pulse || (pulse.total_duas === 0 && pulse.tazkiyah_journeys === 0)) {
    return null;
  }

  return (
    <Pressable
      onPress={() => router.push('/dua-wall' as any)}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
      testID="community-pulse-card"
    >
      <View style={styles.headerRow}>
        <Ionicons name="pulse" size={14} color={colors.gold} />
        <Text style={styles.kicker}>COMMUNITY PULSE</Text>
        <View style={{ flex: 1 }} />
        <Ionicons name="chevron-forward" size={14} color={colors.gold} />
      </View>
      <View style={styles.statsRow}>
        <Stat count={pulse.total_duas} label="duʿās" />
        <Stat count={pulse.total_blessings} emoji="🤲" label="sent" />
        <Stat count={pulse.active_devices_7d} label="active" />
      </View>
      {pulse.posted_24h > 0 ? (
        <Text style={styles.subtle}>
          {pulse.posted_24h} shared today · anonymous · Shariyah-filtered
        </Text>
      ) : null}
    </Pressable>
  );
}

function Stat({ count, label, emoji }: { count: number; label: string; emoji?: string }) {
  return (
    <View style={styles.stat}>
      <View style={styles.statValueRow}>
        {emoji ? <Text style={styles.statEmoji}>{emoji}</Text> : null}
        <Text style={styles.statValue}>{count}</Text>
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kicker: { color: colors.gold, letterSpacing: 1.5, fontSize: 10, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  statEmoji: { fontSize: 14 },
  statValue: { color: colors.gold, fontWeight: '800', fontSize: 22, letterSpacing: -0.3 },
  statLabel: { ...ty.tiny, color: colors.textDim, fontSize: 10, textAlign: 'center' },
  subtle: { ...ty.tiny, color: colors.textDim, fontSize: 11, fontStyle: 'italic', textAlign: 'center' },
});
