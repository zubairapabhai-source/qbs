/**
 * ShareButton — QBS
 *
 * A one-tap "share to WhatsApp / iMessage / etc." pill for any content
 * screen (verse tafseer, A–Z entry, Bible comparison, Sheikh answer,
 * scientist bio…). Turns a satisfied user into a distributor.
 *
 * WHY IT MATTERS
 *   Islamic-content apps that ship a well-designed share flow see
 *   20–40 % of installs arrive from user shares — bigger than any paid
 *   channel. It's a compounding, free growth loop.
 *
 * USAGE
 *   <ShareButton
 *     title="Signature verse · 41:53"
 *     body={ayahText + '\n\n' + tafseer}
 *     source="verse/41:53"
 *   />
 *
 * BEHAVIOUR
 *   • Falls back gracefully if `Share.share` rejects (rare, e.g. user
 *     dismissing the sheet).
 *   • Appends a beautiful trilingual signature with the App Store /
 *     Play Store link so recipients can install in one tap.
 *   • Trilingual "Share" label reads correctly in EN / AR / UR.
 *   • Bumps the review-prompt signal on a successful share — sharers
 *     are already happy users, they're highly likely to review too.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, Pressable, Share, StyleSheet, Text } from 'react-native';
import { useApp } from '../store/useApp';
import { colors, radius } from '../theme';
import { bumpReviewSignal } from '../personalisation/useReviewPrompt';

const IOS_URL = 'https://apps.apple.com/app/id6801619940';
const ANDROID_URL = 'https://play.google.com/store/apps/details?id=com.divineseriesmobile.quranbiblescience';

interface Props {
  title: string;              // heading of the content being shared
  body: string;               // the actual content (verse text + tafseer, etc.)
  source?: string;            // internal tag, e.g. "verse/41:53" (unused today,
                              // reserved for future share analytics)
  compact?: boolean;          // smaller pill for tight rows
  variant?: 'primary' | 'ghost';
  testID?: string;
}

export function ShareButton({ title, body, compact, variant = 'ghost', testID }: Props) {
  const lang = useApp((s) => s.lang);
  const L = <T,>(en: T, ar: T, ur: T): T =>
    lang === 'ar' ? ar : lang === 'ur' ? ur : en;

  const signatureLines = [
    '',
    L(
      '— Qurʾān, Bible & Science (a Divine Series Mobile app)',
      '— القُرآن والإِنجيل والعِلْم (تطبيق Divine Series Mobile)',
      '— قرآن، بائبل و سائنس (Divine Series Mobile ایپ)'
    ),
    L(
      '10% of net proceeds → Ummah Welfare Trust · UK Charity 1000851',
      '١٠٪ من صافي العائدات → مؤسسة رفاهية الأمة · الجمعية الخيرية بالمملكة المتحدة 1000851',
      '۱۰٪ خالص آمدنی → اُمّہ ویلفیئر ٹرسٹ · UK Charity 1000851'
    ),
    L(
      Platform.OS === 'android' ? `Get the app: ${ANDROID_URL}` : `Get the app: ${IOS_URL}`,
      Platform.OS === 'android' ? `حمِّل التطبيق: ${ANDROID_URL}` : `حمِّل التطبيق: ${IOS_URL}`,
      Platform.OS === 'android' ? `ایپ ڈاؤن لوڈ کریں: ${ANDROID_URL}` : `ایپ ڈاؤن لوڈ کریں: ${IOS_URL}`
    ),
  ].join('\n');

  const onShare = async () => {
    const message = `${title}\n\n${body}\n${signatureLines}`;
    try {
      const result = await Share.share({ message, title });
      // Successful sharers are among the happiest users — nudge review.
      if (result.action === Share.sharedAction) {
        bumpReviewSignal('shared_content').catch(() => {});
      }
    } catch {
      /* silent — sheet dismissal or platform quirk */
    }
  };

  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onShare}
      testID={testID ?? 'share-button'}
      hitSlop={6}
      style={({ pressed }) => [
        compact ? styles.compact : styles.pill,
        isPrimary ? styles.primary : styles.ghost,
        pressed && { opacity: 0.85 },
      ]}
    >
      <Ionicons
        name="share-social-outline"
        size={compact ? 13 : 15}
        color={isPrimary ? colors.bg : colors.gold}
      />
      <Text style={[
        compact ? styles.compactTxt : styles.txt,
        { color: isPrimary ? colors.bg : colors.gold },
      ]}>
        {L('Share', 'مشاركة', 'شیئر')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  compact: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  primary: { backgroundColor: colors.gold, borderColor: colors.gold },
  ghost: { backgroundColor: colors.gold + '15', borderColor: colors.gold + '77' },
  txt: { fontWeight: '800', fontSize: 13, letterSpacing: 0.3 },
  compactTxt: { fontWeight: '800', fontSize: 11, letterSpacing: 0.3 },
});
