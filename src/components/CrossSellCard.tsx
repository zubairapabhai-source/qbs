/**
 * CrossSellCard — QBS
 *
 * A gold-bordered Home tile that promotes the other two Divine Series
 * Mobile apps (Treasures + Dreams). Tapping a mini-tile opens the
 * relevant App Store or Google Play page.
 *
 * WHY THIS EXISTS
 *   Users of ANY of our 3 apps are the highest-intent audience for the
 *   OTHER 2. This house-ad is free cross-promotion — no third-party ad
 *   network, no revenue share, no ethics risk (no dating/alcohol/riba
 *   ads accidentally leaking to a Muslim audience).
 *
 * BEHAVIOUR
 *   • Opens Google Play on Android, App Store on iOS, App Store on web
 *   • Falls back gracefully if `Linking.openURL` rejects (rare)
 *   • Trilingual copy (EN / AR / UR), RTL-safe
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../store/useApp';
import { colors, radius, spacing, type as ty } from '../theme';

interface AppRef {
  key: 'treasures' | 'dreams';
  title: { en: string; ar: string; ur: string };
  arabic: string;
  pitch: { en: string; ar: string; ur: string };
  icon: any;
  iosUrl: string;
  androidUrl: string;
}

const APPS: AppRef[] = [
  {
    key: 'treasures',
    title: {
      en: 'Treasures of the Qurʾān',
      ar: 'كنوز القرآن',
      ur: 'قرآن کے خزانے',
    },
    arabic: 'كُنُوزُ الْقُرْآنِ',
    pitch: {
      en: '99 Names · Adhkār · Qurʾān · Prophetic Medicine',
      ar: 'الأسماء الحسنى · أذكار · قرآن · طب نبوي',
      ur: '۹۹ اسمائے الٰہی · اذکار · قرآن · طب نبویؐ',
    },
    icon: require('../../assets/cross-sell/treasures.png'),
    iosUrl: 'https://apps.apple.com/app/id6770721697',
    androidUrl: 'https://play.google.com/store/apps/details?id=com.divineseriesmobile.sacredtreasures',
  },
  {
    key: 'dreams',
    title: {
      en: 'Interpretation of Dreams',
      ar: 'تعبير الرؤيا',
      ur: 'تعبیرِ خواب',
    },
    arabic: 'تَعْبِيرُ الرُّؤْيَا',
    pitch: {
      en: 'Ibn Sīrīn symbols · AI reflection · Vision of the Beloved ﷺ',
      ar: 'رموز ابن سيرين · تأمل ذكي · رؤية الحبيب ﷺ',
      ur: 'ابن سیرین کی علامات · AI تعبیر · دیدارِ حبیب ﷺ',
    },
    icon: require('../../assets/cross-sell/dreams.png'),
    iosUrl: 'https://apps.apple.com/app/id6765926174',
    androidUrl: 'https://play.google.com/store/apps/details?id=com.divineseries.interpretationofdreams',
  },
];

function openStore(app: AppRef) {
  // On iOS + web open App Store; on Android open Google Play.
  // Wrapped in a Promise `.catch()` so a rejected openURL never crashes
  // the app (e.g. no browser on the device, or an ancient Android
  // without Play Store).
  const url = Platform.OS === 'android' ? app.androidUrl : app.iosUrl;
  Linking.openURL(url).catch(() => { /* silent fail */ });
}

export function CrossSellCard() {
  const lang = useApp((s) => s.lang);
  const rtl = lang === 'ar' || lang === 'ur';
  const L = <T,>(en: T, ar: T, ur: T): T =>
    lang === 'ar' ? ar : lang === 'ur' ? ur : en;

  return (
    <View style={styles.wrap} testID="cross-sell-card">
      <Text style={[styles.kicker, { textAlign: rtl ? 'right' : 'left' }]}>
        {L('◆ ALSO FROM DIVINE SERIES MOBILE ◆', '◆ أيضًا من ديفاين سيريز موبايل ◆', '◆ ڈوائن سیریز موبائل سے مزید ◆')}
      </Text>
      <Text style={[styles.sub, { textAlign: rtl ? 'right' : 'left' }]}>
        {L(
          'Two companion apps · £0.99 lifetime unlock · 10% to Ummah Welfare Trust',
          'تطبيقان مصاحبان · فتح مدى الحياة بـ ٠٫٩٩ · ١٠٪ لمؤسسة رفاهية الأمة',
          'دو تکمیلی ایپس · £0.99 تاحیات · ۱۰٪ اُمّہ ویلفیئر ٹرسٹ'
        )}
      </Text>
      <View style={styles.row}>
        {APPS.map((app) => (
          <Pressable
            key={app.key}
            onPress={() => openStore(app)}
            style={({ pressed }) => [styles.tile, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
            testID={`cross-sell-${app.key}`}
          >
            <View style={styles.iconWrap}>
              <Image source={app.icon} style={styles.icon} resizeMode="cover" />
            </View>
            <Text style={styles.title} numberOfLines={2}>{app.title[lang as 'en' | 'ar' | 'ur'] || app.title.en}</Text>
            <Text style={styles.arabic} numberOfLines={1}>{app.arabic}</Text>
            <Text style={styles.pitch} numberOfLines={2}>{app.pitch[lang as 'en' | 'ar' | 'ur'] || app.pitch.en}</Text>
            <View style={styles.cta}>
              <Ionicons
                name={Platform.OS === 'android' ? 'logo-google-playstore' : 'logo-apple'}
                size={12}
                color={colors.gold}
              />
              <Text style={styles.ctaTxt}>
                {L('Get it free', 'حمّله مجانًا', 'مفت ڈاؤن لوڈ')}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gold + '55',
    backgroundColor: colors.bgElevated,
  },
  kicker: {
    ...ty.label,
    color: colors.gold,
    fontSize: 10,
    letterSpacing: 2,
  },
  sub: {
    ...ty.tiny,
    color: colors.textDim,
    marginTop: 4,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
    alignItems: 'center',
    gap: 4,
    minHeight: 180,
  },
  iconWrap: {
    width: 56, height: 56,
    borderRadius: 14,
    borderWidth: 1, borderColor: colors.gold + '77',
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  icon: { width: '100%', height: '100%' },
  title: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.parchment,
    textAlign: 'center',
    lineHeight: 15,
  },
  arabic: {
    fontSize: 12,
    color: colors.gold,
    textAlign: 'center',
    marginTop: 1,
  },
  pitch: {
    fontSize: 10.5,
    lineHeight: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 3,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 'auto',
    paddingTop: spacing.xs,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.gold + '77',
    backgroundColor: colors.gold + '15',
  },
  ctaTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.gold,
    letterSpacing: 0.3,
  },
});
