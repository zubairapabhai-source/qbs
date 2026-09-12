/**
 * Paywall gate helpers.
 *
 * Strategy: first N items of each browse list are FREE forever. Subsequent
 * items are visible but render a translucent padlock overlay; tapping them
 * routes the user to /unlock instead of opening the item.
 *
 * After the £0.99 lifetime unlock, all items behave normally.
 */
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../store/useApp';
import { colors, radius, spacing, type as ty } from '../theme';

/** Teaser size — first N items free across each major listing. */
export const FREE_PREVIEW_LIMIT = 3;

/** Hook: is the user fully unlocked? */
export function useUnlocked() {
  return useApp((s) => s.unlocked);
}

/** Returns true when this index in a list is locked behind the paywall. */
export function useIsLockedAt(index: number): boolean {
  const unlocked = useUnlocked();
  if (unlocked) return false;
  return index >= FREE_PREVIEW_LIMIT;
}

/**
 * LockedTile — wraps any child card. When `locked` is true, dims the child
 * and overlays a gold padlock. Tap is intercepted and routes to /unlock.
 *
 * When `previewable` is also true, the tile keeps the visual lock chip but
 * calls the caller's `onPress` instead — used by screens that show a full
 * TeaserGate preview inside their detail view. Lets us respect the freemium
 * "read a real slice before paying" pattern instead of dead-ending at /unlock.
 */
export function LockedTile({
  locked,
  onPress,
  children,
  style,
  previewable,
}: {
  locked: boolean;
  onPress: () => void;
  children: React.ReactNode;
  style?: any;
  previewable?: boolean;
}) {
  const router = useRouter();
  const lang = useApp((s) => s.lang);

  if (!locked) {
    return (
      <Pressable onPress={onPress} style={style}>
        {children}
      </Pressable>
    );
  }

  const label = lang === 'ar' ? 'يفتح الكل بـ ٠٫٩٩' : lang === 'ur' ? '£0.99 سب انلاک' : '£0.99 unlocks all';

  // Previewable path — keep tap opening the detail so TeaserGate can show
  // a real preview + gate. Chip stays as a subtle affordance.
  if (previewable) {
    return (
      <Pressable onPress={onPress} style={style}>
        <View style={{ opacity: 0.75 }}>{children}</View>
        <View style={lockStyles.overlay} pointerEvents="none">
          <View style={lockStyles.chip}>
            <Ionicons name="eye-outline" size={13} color={colors.gold} />
            <Text style={lockStyles.chipTxt}>{lang === 'ar' ? 'معاينة' : lang === 'ur' ? 'پیش نظارہ' : 'Preview'}</Text>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={() => router.push('/unlock' as any)} style={style}>
      <View style={{ opacity: 0.45 }} pointerEvents="none">
        {children}
      </View>
      <View style={lockStyles.overlay} pointerEvents="none">
        <View style={lockStyles.chip}>
          <Ionicons name="lock-closed" size={13} color={colors.gold} />
          <Text style={lockStyles.chipTxt}>{label}</Text>
        </View>
      </View>
    </Pressable>
  );
}

/**
 * LockBanner — the inline banner shown at the top of a list when the user is
 * locked. Click → /unlock.
 */
export function LockBanner() {
  const router = useRouter();
  const unlocked = useUnlocked();
  const lang = useApp((s) => s.lang);
  if (unlocked) return null;
  const L = (en: string, ar: string, ur: string) =>
    lang === 'ar' ? ar : lang === 'ur' ? ur : en;
  return (
    <Pressable onPress={() => router.push('/unlock' as any)} style={lockStyles.banner}>
      <Ionicons name="sparkles" size={16} color={colors.gold} />
      <Text style={lockStyles.bannerTxt}>
        {L(
          `£0.99 one-time · unlocks the whole app — every article, every AI question, every gate →`,
          `٠٫٩٩ £ مرة واحدة · تفتح التطبيق كاملاً — كل مقال، كل سؤال، كل قسم مقفل ←`,
          `£0.99 ایک بار · پوری ایپ کھولے — ہر مضمون، ہر AI سوال، ہر گیٹ ←`,
        )}
      </Text>
      <Ionicons name="lock-closed" size={14} color={colors.gold} />
    </Pressable>
  );
}

const lockStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.bg + 'F5',
    borderWidth: 1.5,
    borderColor: colors.gold,
    shadowColor: colors.gold,
    shadowOpacity: 0.5,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  chipTxt: { ...ty.small, color: colors.gold, fontWeight: '800', fontSize: 12, letterSpacing: 0.3 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.gold + '22',
    borderWidth: 1,
    borderColor: colors.gold + '88',
  },
  bannerTxt: { ...ty.small, color: colors.gold, fontWeight: '700', flex: 1, textAlign: 'center', fontSize: 12 },
});
