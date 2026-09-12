/**
 * BadgeBloomModal — celebration overlay when the passport awards a new
 * badge. Reads the last "newly_earned" cursor from AsyncStorage and shows
 * a modal once per badge, ever. Auto-dismisses after 6s.
 *
 * Fired from anywhere the passport is refreshed — including the entry
 * card, the passport screen, and after `passportApi.link()` calls.
 */
import React, { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, type as ty } from '../theme';
import { BADGE_META, passportApi } from '../passportApi';

const SEEN_KEY = '@qbs.passport.seen_badges';

async function getSeen(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(SEEN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
async function markSeen(all: string[]) {
  try { await AsyncStorage.setItem(SEEN_KEY, JSON.stringify(all)); } catch {}
}

export function BadgeBloomModal() {
  const [visible, setVisible] = useState(false);
  const [badgeKey, setBadgeKey] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const s = await passportApi.status();
          if (cancelled || !s.linked || !s.passport) return;
          const earned = s.passport.badges || [];
          const seen = await getSeen();
          const fresh = earned.find(b => !seen.includes(b));
          if (fresh && BADGE_META[fresh]) {
            setBadgeKey(fresh);
            setVisible(true);
            await markSeen([...seen, fresh]);
            setTimeout(() => setVisible(false), 6000);
          }
        } catch { /* silent */ }
      })();
      return () => { cancelled = true; };
    }, []),
  );

  if (!badgeKey) return null;
  const meta = BADGE_META[badgeKey];
  if (!meta) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
      <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
        <View style={styles.card}>
          <Text style={styles.emoji}>{meta.emoji}</Text>
          <Text style={styles.title}>{meta.label}</Text>
          <Text style={styles.body}>{meta.criteria}</Text>
          <View style={styles.divider} />
          <Text style={styles.subtle}>
            You have earned a new Ummah Passport badge. May Allāh bless the journey.
          </Text>
          <Pressable onPress={() => setVisible(false)} style={styles.closeBtn} testID="badge-bloom-close">
            <Ionicons name="close" size={16} color={colors.gold} />
            <Text style={styles.closeText}>Tap anywhere to dismiss</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(6,14,36,0.85)',
    alignItems: 'center', justifyContent: 'center', padding: spacing.xl,
  },
  card: {
    padding: spacing.xl, borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.gold,
    alignItems: 'center', gap: spacing.sm,
    maxWidth: 340,
  },
  emoji: { fontSize: 64, marginBottom: 4 },
  title: { ...ty.h1, color: colors.gold, fontSize: 26,  textAlign: 'center' },
  body: { ...ty.body, color: colors.text, textAlign: 'center', lineHeight: 22 },
  divider: { height: 1, alignSelf: 'stretch', backgroundColor: colors.cardBorder, marginVertical: 8 },
  subtle: { ...ty.tiny, color: colors.textDim, textAlign: 'center', lineHeight: 18, fontStyle: 'italic' },
  closeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  closeText: { ...ty.tiny, color: colors.gold, fontSize: 10, letterSpacing: 0.5 },
});
