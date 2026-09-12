/**
 * StreakCard — Home-screen personal streak tile
 *
 * Trilingual, adaptive:
 *   • s = 0 (never read)        → warm invite
 *   • s ≥ 1                     → streak badge + "keep going" nudge
 *   • at 7/30/100/365 crossing  → celebratory copy (dispatched on Home
 *                                 the moment the milestone lands)
 *
 * Zero backend calls — reads directly from the app store.
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../../src/store/useApp';
import { colors, spacing, type as ty } from '../../src/theme';

export function StreakCard() {
  const router = useRouter();
  const lang = useApp((s) => s.lang);
  const streak = useApp((s) => s.streak);

  const s = streak?.current ?? 0;
  const longest = streak?.longest ?? 0;
  const L = (en: string, ar: string, ur: string) =>
    lang === 'ar' ? ar : lang === 'ur' ? ur : en;

  const isNew = s === 0;
  const isCelebration = s >= 7;

  const title = isNew
    ? L('Begin your Qur\'ān journey', 'ابدأ رحلتك مع القرآن', 'قرآن کا سفر شروع کریں')
    : L(
        `${s}-day streak`,
        `${s} أيام متواصلة`,
        `${s}-دن مسلسل`
      );

  const sub = isNew
    ? L(
        'One page a day builds noor for a lifetime. Tap to open the mushaf.',
        'صفحة واحدة يوميًا تبني نورًا للحياة. اضغط لفتح المصحف.',
        'روزانہ ایک صفحہ عمر بھر کا نور بناتا ہے۔ مصحف کھولنے کے لیے دبائیں۔'
      )
    : isCelebration
      ? L(
          `MashaAllah — longest: ${longest} days. Continue today?`,
          `ما شاء الله — أطول سلسلة: ${longest} يومًا. تابع اليوم؟`,
          `ماشاءاللہ — سب سے طویل: ${longest} دن۔ آج جاری رکھیں؟`
        )
      : L(
          `Keep the streak — one page today. Longest: ${longest}.`,
          `حافظ على السلسلة — صفحة اليوم. الأطول: ${longest}.`,
          `سلسلہ برقرار رکھیں — آج ایک صفحہ۔ سب سے طویل: ${longest}.`
        );

  return (
    <Pressable
      onPress={() => router.push('/quran' as any)}
      style={({ pressed }) => [styles.wrap, pressed && { opacity: 0.9 }]}
      testID="home-streak-card"
    >
      <LinearGradient
        colors={
          isNew
            ? ['rgba(212,175,55,0.14)', 'rgba(14,31,26,0.0)']
            : ['rgba(232,198,106,0.20)', 'rgba(212,175,55,0.05)']
        }
        style={styles.card}
      >
        <View style={styles.iconBubble}>
          <Ionicons
            name={isNew ? 'sparkles' : s >= 30 ? 'star' : s >= 7 ? 'flame' : 'leaf'}
            size={20}
            color={colors.gold}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.sub} numberOfLines={2}>{sub}</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillTxt}>{isNew ? 'START' : `${s}🔥`}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.md,
    marginTop: -spacing.xs,
    marginBottom: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gold + '44',
  },
  iconBubble: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(212,175,55,0.14)',
    borderWidth: 1, borderColor: colors.gold + '55',
  },
  title: { ...ty.body, color: colors.parchment, fontWeight: '800' },
  sub: { ...ty.small, color: colors.textDim, marginTop: 2 },
  pill: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
    backgroundColor: colors.gold,
  },
  pillTxt: { color: colors.bg, fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },
});
