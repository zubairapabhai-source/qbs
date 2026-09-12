/**
 * PassportEntryCard — home-screen discovery of the Ummah Passport.
 *
 * Small, dismissable card on the home screen inviting the user to link
 * their apps. Once linked, transforms into the "smart nudges" surface —
 * showing celebrations, return-invites, and un-linked app prompts sourced
 * from `/api/passport/nudges`.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, type as ty } from '../theme';
import { passportApi, type Nudge } from '../passportApi';

export function PassportEntryCard() {
  const router = useRouter();
  const [linked, setLinked] = useState<boolean | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [nudges, setNudges] = useState<Nudge[]>([]);

  const load = useCallback(async () => {
    try {
      const s = await passportApi.status();
      setLinked(s.linked);
      setCode(s.linked && s.passport ? s.passport.code : null);
      if (s.linked) {
        try {
          const n = await passportApi.nudges();
          setNudges(n.nudges || []);
        } catch { setNudges([]); }
      }
    } catch {
      setLinked(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (linked === null) return null;

  if (!linked) {
    return (
      <Pressable
        onPress={() => router.push('/passport' as any)}
        style={({ pressed }) => [styles.introCard, pressed && { opacity: 0.9 }]}
        testID="passport-entry-card"
      >
        <View style={styles.headerRow}>
          <Text style={styles.kickerEmoji}>🌙</Text>
          <Text style={styles.kicker}>UMMAH PASSPORT</Text>
          <View style={{ flex: 1 }} />
          <Ionicons name="chevron-forward" size={14} color={colors.gold} />
        </View>
        <Text style={styles.body}>
          Link your 3 Divine Series apps. Unified streak, cross-app milestones, and the 🌙 Trinity badge — free.
        </Text>
      </Pressable>
    );
  }

  return (
    <>
      {code ? (
        <Pressable
          onPress={() => router.push('/passport' as any)}
          style={({ pressed }) => [styles.introCard, pressed && { opacity: 0.9 }]}
          testID="passport-status-card"
        >
          <View style={styles.headerRow}>
            <Text style={styles.kickerEmoji}>🌙</Text>
            <Text style={styles.kicker}>PASSPORT LINKED</Text>
            <View style={{ flex: 1 }} />
            <Ionicons name="chevron-forward" size={14} color={colors.gold} />
          </View>
          <Text style={styles.body}>Your Divine Series apps are connected. Tap to see badges and the passport code.</Text>
        </Pressable>
      ) : null}
      {nudges.map((n, idx) => (
        <Pressable
          key={idx}
          onPress={() => router.push('/passport' as any)}
          style={({ pressed }) => [styles.nudgeCard, pressed && { opacity: 0.9 }]}
          testID={`passport-nudge-${n.kind}-${n.app}`}
        >
          <View style={styles.headerRow}>
            <Text style={styles.kickerEmoji}>{n.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.nudgeTitle}>{n.title}</Text>
              <Text style={styles.nudgeBody}>{n.body}</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={colors.gold} />
          </View>
        </Pressable>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  introCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.cardBorder,
    gap: 6,
  },
  nudgeCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(201,162,39,0.08)',
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kickerEmoji: { fontSize: 16 },
  kicker: { ...ty.tiny, color: colors.gold, letterSpacing: 1.5, fontSize: 10, fontWeight: '800' },
  body: { ...ty.tiny, color: colors.textDim, lineHeight: 18 },
  nudgeTitle: { color: colors.text, fontSize: 13, fontWeight: '700' },
  nudgeBody: { ...ty.tiny, color: colors.textDim, fontSize: 11, lineHeight: 15, marginTop: 2 },
});
