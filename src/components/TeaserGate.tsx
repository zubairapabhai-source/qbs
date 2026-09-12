/**
 * TeaserGate — QBS
 *
 * A reusable "read the first bite free, unlock the rest for £0.99" gate.
 * Used across Bible Comparisons, Bible Contradictions, A–Z entries,
 * scientist bios, etc. — any long-form article a locked user hits.
 *
 * BEHAVIOUR
 *   • unlocked = true → renders `children` in full, no gate
 *   • unlocked = false → renders `previewText` (first ~40 words) with a
 *     gold gradient fade at the bottom + a compact upgrade card:
 *       "Continue reading — £0.99 unlocks everything, forever · no ads"
 *   • Tapping the card opens `/unlock`.
 *
 * WHY A REUSABLE COMPONENT
 *   Before this, gated screens showed a full-block paywall — new users
 *   had NO idea what they were paying for. The teaser gives a real taste
 *   of the writing quality + scholarly tone, which is the #1 conversion
 *   lever for a paid religious app (users pay for the SUBSTANCE, not
 *   the promise). Muslim Pro, Quran.com Premium and Bayyinah use the
 *   same pattern.
 *
 * INPUT
 *   previewText: string  — the first paragraph(s) shown for free.
 *                          Pass a natural cut of ~30-60 words for best UX.
 *   locked: boolean      — usually `!unlocked` from useApp store.
 *   children: ReactNode  — the full content, shown when unlocked.
 *   compact?: boolean    — if true, uses a smaller CTA card (for tiles).
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../store/useApp';
import { colors, radius, spacing, type as ty } from '../theme';

interface Props {
  previewText: string;
  locked: boolean;
  children: React.ReactNode;
  compact?: boolean;
  testID?: string;
}

export function TeaserGate({ previewText, locked, children, compact, testID }: Props) {
  const router = useRouter();
  const lang = useApp((s) => s.lang);
  const rtl = lang === 'ar' || lang === 'ur';

  const L = <T,>(en: T, ar: T, ur: T): T =>
    lang === 'ar' ? ar : lang === 'ur' ? ur : en;

  if (!locked) return <>{children}</>;

  return (
    <View testID={testID ?? 'teaser-gate'}>
      {/* The free-taste preview — a real slice of the actual writing,
          not lorem ipsum. This is what converts skeptics. */}
      <View style={styles.previewWrap}>
        <Text style={[styles.previewText, { textAlign: rtl ? 'right' : 'left' }]}>
          {previewText}
        </Text>
        {/* Bottom-up fade that visually implies "there's more below". */}
        <LinearGradient
          colors={['rgba(14,42,34,0)', 'rgba(14,42,34,0.85)', 'rgba(14,42,34,1)']}
          locations={[0, 0.65, 1]}
          style={styles.fade}
          pointerEvents="none"
        />
      </View>

      {/* Upgrade CTA — deliberately non-modal so the user can keep
          scrolling past it if they're browsing multiple tiles. */}
      <Pressable
        onPress={() => router.push('/unlock' as any)}
        style={({ pressed }) => [
          compact ? styles.ctaCompact : styles.cta,
          pressed && { opacity: 0.85 },
        ]}
        testID="teaser-unlock-cta"
      >
        <View style={[styles.ctaRow, rtl && { flexDirection: 'row-reverse' }]}>
          <View style={styles.lockCircle}>
            <Ionicons name="lock-open" size={18} color={colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.ctaTitle, { textAlign: rtl ? 'right' : 'left' }]} numberOfLines={2}>
              {L(
                'Unlock the whole app — every gate opens for £0.99',
                'افتح التطبيق كاملاً — كل الأقسام بـ ٠٫٩٩ £',
                'پوری ایپ کھولیں — تمام سیکشنز £0.99 میں'
              )}
            </Text>
            <Text style={[styles.ctaSub, { textAlign: rtl ? 'right' : 'left' }]} numberOfLines={3}>
              {L(
                'One-time · lifetime · no ads · no subscriptions · unlocks every article, every AI question, every gated feature in this app.',
                'مرة واحدة · مدى الحياة · بدون إعلانات · بدون اشتراكات · يفتح كل مقال وكل سؤال ذكاء وكل ميزة مقفلة في التطبيق.',
                'ایک بار · تاحیات · نہ اشتہار · نہ سبسکرپشن · ہر مضمون، ہر AI سوال، اور ہر لاک شدہ فیچر انلاک کرتا ہے۔'
              )}
            </Text>
          </View>
          <Ionicons
            name={rtl ? 'chevron-back' : 'chevron-forward'}
            size={18}
            color={colors.gold}
          />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  previewWrap: {
    position: 'relative',
    maxHeight: 220, // caps how much of the preview we render
    overflow: 'hidden',
  },
  previewText: {
    ...ty.body,
    color: colors.text,
    lineHeight: 22,
  },
  fade: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: 90,
  },
  cta: {
    marginTop: -spacing.md, // sits UNDER the fade so it feels attached
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.gold + '15',
    borderWidth: 1.2, borderColor: colors.gold,
  },
  ctaCompact: {
    marginTop: -spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.gold + '15',
    borderWidth: 1, borderColor: colors.gold,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  lockCircle: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.gold + '22',
    borderWidth: 1, borderColor: colors.gold + '99',
  },
  ctaTitle: {
    ...ty.h3,
    color: colors.gold,
    fontSize: 14,
    letterSpacing: 0.2,
  },
  ctaSub: {
    ...ty.tiny,
    color: colors.parchment,
    marginTop: 3,
    letterSpacing: 0.2,
  },
});
