/**
 * MilestoneModal — QBS
 *
 * A celebratory modal that surfaces the moment the user's Qur'an-reading
 * streak crosses 7 / 30 / 100 / 365 days.  Reads the pending milestone
 * from the app store, marks it as shown so it never re-surfaces, and
 * plays a subtle gold glow animation.
 *
 * Trilingual copy is centralised in `src/personalisation/streak.ts` so
 * the milestone message reads identically across every surface (modal,
 * push notification, share-card in future).
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing, useSharedValue, useAnimatedStyle, withRepeat,
  withSequence, withTiming, withDelay, cancelAnimation,
} from 'react-native-reanimated';
import { useApp } from '../store/useApp';
import { colors, spacing, type as ty } from '../theme';
import { milestoneCopy, pendingMilestone } from '../personalisation/streak';

export function MilestoneModal() {
  const router = useRouter();
  const lang = useApp((s) => s.lang);
  const streak = useApp((s) => s.streak);
  const markMilestoneShown = useApp((s) => s.markMilestoneShown);

  // Compute whether there's a milestone waiting to be celebrated —
  // memoised so we don't re-render on every unrelated store tick.
  const pending = useMemo(() => pendingMilestone(streak), [streak]);
  const visible = pending !== null;

  const copy = pending
    ? milestoneCopy(pending, (lang === 'ar' || lang === 'ur') ? lang : 'en')
    : null;

  // Subtle gold-glow pulse behind the milestone number.
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (!visible) return;
    pulse.value = 0;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }),
        withDelay(300, withTiming(0, { duration: 900, easing: Easing.in(Easing.cubic) }))
      ),
      -1, false
    );
    // Cleanup: stop the infinite repeat when the modal hides or the
    // Home tab unmounts, so the animation loop doesn't keep churning
    // CPU/battery for the rest of the app session.
    return () => { cancelAnimation(pulse); };
  }, [visible, pulse]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + pulse.value * 0.35,
    transform: [{ scale: 1 + pulse.value * 0.08 }],
  }));

  if (!visible || !copy || !pending) return null;

  const dismiss = () => markMilestoneShown(pending);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={dismiss}
      testID="milestone-modal"
    >
      <Pressable style={styles.backdrop} onPress={dismiss}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {/* Animated glow behind the emoji */}
          <View style={styles.glowWrap} pointerEvents="none">
            <Animated.View style={[styles.glow, glowStyle]} />
          </View>

          {/* Emoji + day number in an ornate circle */}
          <LinearGradient
            colors={['rgba(232,198,106,0.32)', 'rgba(212,175,55,0.08)']}
            style={styles.emojiRing}
          >
            <Text style={styles.emoji} allowFontScaling={false}>{copy.emoji}</Text>
            <View style={styles.dayBadge}>
              <Text style={styles.dayBadgeTxt}>{pending}</Text>
            </View>
          </LinearGradient>

          <Text style={styles.title} allowFontScaling={false}>{copy.title}</Text>
          <Text style={styles.body}>{copy.body}</Text>

          <View style={styles.actions}>
            <Pressable
              onPress={() => { dismiss(); router.push('/quran' as any); }}
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
            >
              <Ionicons name="book" size={16} color={colors.bg} />
              <Text style={styles.primaryBtnTxt}>
                {lang === 'ar' ? 'تابع القراءة' : lang === 'ur' ? 'پڑھنا جاری رکھیں' : 'Continue Reading'}
              </Text>
            </Pressable>
            <Pressable onPress={dismiss} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnTxt}>
                {lang === 'ar' ? 'شكراً' : lang === 'ur' ? 'شکریہ' : 'JazākAllāh'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center', justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%', maxWidth: 380,
    backgroundColor: colors.bgElevated,
    borderRadius: 22,
    paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.gold + '55',
    alignItems: 'center',
  },
  glowWrap: {
    position: 'absolute', top: -20, left: 0, right: 0,
    alignItems: 'center',
  },
  glow: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: colors.gold + '55',
  },
  emojiRing: {
    width: 108, height: 108, borderRadius: 54,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.gold + '77',
  },
  emoji: { fontSize: 44, color: colors.gold },
  dayBadge: {
    position: 'absolute', bottom: -6, right: -6,
    minWidth: 34, height: 30, paddingHorizontal: 8,
    borderRadius: 15,
    backgroundColor: colors.gold,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.bgElevated,
  },
  dayBadgeTxt: { color: colors.bg, fontWeight: '900', fontSize: 13, letterSpacing: 0.3 },
  title: { ...ty.h2, color: colors.parchment, textAlign: 'center', marginBottom: 8 },
  body: {
    ...ty.body, color: colors.textMuted, textAlign: 'center',
    lineHeight: 22, marginBottom: spacing.lg,
  },
  actions: { width: '100%', gap: 8 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 13, borderRadius: 999, backgroundColor: colors.gold,
  },
  primaryBtnTxt: { color: colors.bg, fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
  secondaryBtn: { paddingVertical: 10, alignItems: 'center' },
  secondaryBtnTxt: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
});
