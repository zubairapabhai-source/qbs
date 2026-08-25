/**
 * Qur'ān, Bible and Science — Share / Refer-a-Friend screen.
 *
 * Mirrors the Treasures share screen: a beautiful keepsake card with a
 * QR code that deep-links to the App Store, plus native share actions
 * (image, text, copy link). The shareable card is rendered with
 * `react-native-view-shot` so users can broadcast the same gold-on-navy
 * artwork to WhatsApp, Telegram, Instagram, etc.
 *
 * Honours the lineage of teachers whose work seeded this app:
 *   • Shaykh Wājid Ḥussain Deobandī (Raḥmatullāhi ʿalayhi) — comparative-Deen mentor
 *   • Hazrat Muftī Aḥmad Khānpūrī (ḥafiẓahullāh) — beloved Ustād at Jāmiʿa Islāmiyyah Taʿlīmuddīn, Dhabel
 *   • Hazrat Shaykh ʿAbdur Raḥīm Naqshbandī Chakwālī (Raḥmatullāhi ʿalayhi) — spiritual sheikh
 */
import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Share, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { colors, radius, spacing, type as typo } from '../src/theme';
import { useApp } from '../src/store/useApp';

// LIVE on App Store — Apple App ID 6801619940
const APP_STORE_URL = 'https://apps.apple.com/app/id6801619940';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.divineseriesmobile.quranbiblescience';

const SHARE_MESSAGE =
  `Assalāmu ʿalaykum 🌙\n\n` +
  `I've been using "Qur'ān, Bible and Science" — part of Divine Series Mobile (DSM) — built in the memory and on the inspiration of my late teacher Shaykh Wājid Ḥussain Deobandī (Raḥmatullāhi ʿalayhi), under whom I studied Ṣaḥīḥ Muslim and Tafsīr al-Jalālayn, and who first opened my eyes to the comparative study of Christianity and the wonders of modern science within the Qur'ān.\n\n` +
  `With deep gratitude also to my late spiritual Sheikh Hazrat Shaykh ʿAbdur Raḥīm Naqshbandī Chakwālī (Raḥmatullāhi ʿalayhi), and to my beloved Ustād Hadrat Muftī Aḥmad Khānpūrī (ḥafiẓahullāh) of Jāmiʿa Islāmiyyah Taʿlīmuddīn, Dhabel.\n\n` +
  `Features:\n` +
  `• 44 Qur'ānic verses paired with classical tafseer + modern science\n` +
  `• 40 Sunnah practices backed by peer-reviewed research\n` +
  `• 40 Qur'ān-vs-Bible corrective accounts + 4 featured insights (incl. Prophet ﷺ foretold in the Bible, the Gospel of Barnabas, Saul of Tarsus, Islam's reverence for ʿĪsā & Maryam)\n` +
  `• 40 Bible Contradictions cited verbatim to chapter & verse — opening with Qur'ān 4:82 and 15:9\n` +
  `• 50 Muslim scientists past & modern (incl. Dr Maurice Bucaille)\n` +
  `• Voice-recite verse search · AI Sheikh with citations · audio recitation by Shaykh Mishary al-ʿAfāsy\n\n` +
  `One-time £0.99 Lifetime Unlock — no ads, no subscriptions.\n\n` +
  `📱 iOS: ${APP_STORE_URL}\n` +
  `🤖 Android: ${PLAY_STORE_URL}\n\n` +
  `JazākumAllāhu khayran. Please share with anyone who'd benefit, and keep in your du'ās my late father Muhammad Amin (Raḥmatullāhi ʿalayhi), my late father-in-law Mahmood Tarajia (Raḥmatullāhi ʿalayhi), my late Shaykhs, my late asātidhah, and all my living teachers. 🤲`;

export default function ShareScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const lang = useApp((s) => s.lang);
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<View>(null);
  const rtl = lang === 'ar' || lang === 'ur';

  const bothLinks = `📱 iOS: ${APP_STORE_URL}\n🤖 Android: ${PLAY_STORE_URL}`;
  const L = (en: string, ar: string, ur: string) => (lang === 'ar' ? ar : lang === 'ur' ? ur : en);

  const onShareText = async () => {
    try { await Share.share({ message: SHARE_MESSAGE }); } catch {}
  };

  const onShareImage = async () => {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 0.95, result: 'tmpfile' });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { dialogTitle: 'Share Qur’ān, Bible and Science' });
      } else {
        await Share.share({ message: SHARE_MESSAGE, url: uri });
      }
    } catch (e: any) {
      Alert.alert('Could not share', e?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const onCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(bothLinks);
      Alert.alert(L('Copied', 'تم النسخ', 'کاپی ہو گیا'), L('Link copied to clipboard.', 'تم نسخ الرابط.', 'لنک کلپ بورڈ پر کاپی ہو گیا۔'));
    } catch (e: any) {
      Alert.alert('Could not copy', e?.message || 'Please try again.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]} testID="share-screen">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
        {/* Header */}
        <View style={[styles.headerRow, rtl && { flexDirection: 'row-reverse' }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.kicker, { textAlign: rtl ? 'right' : 'left' }]}>
              {L('RECOMMEND', 'أوصِ به', 'تجویز کریں')}
            </Text>
            <Text style={[styles.title, { textAlign: rtl ? 'right' : 'left' }]}>
              {L('Share with friends & family', 'شارك مع الأهل والأصحاب', 'دوستوں اور خاندان کے ساتھ شیئر کریں')}
            </Text>
            <Text style={[styles.sub, { textAlign: rtl ? 'right' : 'left' }]}>
              {L(
                'May Allāh ﷻ multiply the reward of every soul guided through your share — the app spreads, your reward grows. 🤲',
                'ضاعف الله أجر كل قلب يهتدي بسببك — تنتشر الفائدة، ويتضاعف الأجر. 🤲',
                'اللہ ﷻ ہر اُس روح کا اجر بڑھائے جو آپ کی شیئرنگ سے ہدایت پائے۔ ایپ پھیلے، اجر بڑھے۔ 🤲'
              )}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} testID="share-close">
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* The beautiful shareable card — gets rasterised as an image. */}
        <View ref={cardRef} collapsable={false} style={styles.card} testID="share-card">
          <LinearGradient
            colors={[colors.bg, '#13241f', '#0b1a14']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.cardOrnamentTop}>
            <Ionicons name="moon" size={18} color={colors.gold} />
            <Text style={styles.ornamentText}>DIVINE SERIES · DSM</Text>
            <Ionicons name="moon" size={18} color={colors.gold} />
          </View>

          <Text style={styles.cardTitle}>Qur’ān, Bible and Science</Text>
          <Text style={styles.cardSub}>
            Inspired by the comparative-Deen scholarship of Shaykh Wājid Ḥussain Deobandī (Raḥmatullāhi ʿalayhi) — and 4 generations of his lineage
          </Text>

          <View style={styles.qrRow}>
            <View style={styles.qrCol}>
              <View style={styles.qrInner}>
                <QRCode
                  value={APP_STORE_URL}
                  size={130}
                  color="#0e1f1a"
                  backgroundColor={colors.gold}
                  quietZone={6}
                />
              </View>
              <View style={styles.qrLabelRow}>
                <Ionicons name="logo-apple" size={12} color={colors.gold} />
                <Text style={styles.qrLabel}>iOS</Text>
              </View>
              <Text style={styles.qrCaption}>
                {L('Scan to download', 'امسح للتنزيل', 'ڈاؤن لوڈ کریں')}
              </Text>
            </View>

            <View style={styles.qrCol}>
              <View style={styles.qrInner}>
                <QRCode
                  value={PLAY_STORE_URL}
                  size={130}
                  color="#0e1f1a"
                  backgroundColor={colors.gold}
                  quietZone={6}
                />
              </View>
              <View style={styles.qrLabelRow}>
                <Ionicons name="logo-google-playstore" size={12} color={colors.gold} />
                <Text style={styles.qrLabel}>Android</Text>
              </View>
              <Text style={styles.qrCaption}>
                {L('Scan to download', 'امسح للتنزيل', 'ڈاؤن لوڈ کریں')}
              </Text>
            </View>
          </View>

          <View style={styles.priceChip}>
            <Ionicons name="diamond" size={12} color={colors.gold} />
            <Text style={styles.priceText}>£0.99 Lifetime Unlock · No ads</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={onShareImage} disabled={busy} style={styles.primaryBtn} testID="share-image-btn">
            {busy ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <>
                <Ionicons name="image" size={16} color={colors.bg} />
                <Text style={styles.primaryBtnText}>{L('Share this card', 'شارك البطاقة', 'یہ کارڈ شیئر کریں')}</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onShareText} style={styles.secondaryBtn} testID="share-text-btn">
            <Ionicons name="paper-plane" size={16} color={colors.gold} />
            <Text style={styles.secondaryBtnText}>{L('Share by message', 'شارك برسالة', 'پیغام سے شیئر کریں')}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onCopyLink} style={styles.secondaryBtn} testID="share-copy-btn">
            <Ionicons name="link" size={16} color={colors.gold} />
            <Text style={styles.secondaryBtnText}>{L('Copy link', 'انسخ الرابط', 'لنک کاپی کریں')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.foot}>
          {L(
            '“Whoever guides someone to good will have a reward like the one who does it.” — Ṣaḥīḥ Muslim, 1893',
            '«مَن دلَّ على خير فله مثل أجر فاعله» — صحيح مسلم 1893',
            '«جس نے کسی کو نیکی کی راہ دکھائی، اُسے کرنے والے کا سا اجر ملے گا» — صحیح مسلم 1893'
          )}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.lg },
  kicker: { ...typo.label, color: colors.gold, fontSize: 11, letterSpacing: 2 },
  title: { ...typo.h2, color: colors.silverHi, marginTop: 2 },
  sub: { ...typo.small, color: colors.textDim, marginTop: 6, lineHeight: 20 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.gold + '22', borderWidth: 1, borderColor: colors.gold + '55' },

  card: {
    borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.gold + '66', overflow: 'hidden',
  },
  cardOrnamentTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: spacing.sm },
  ornamentText: { ...typo.label, color: colors.gold, fontSize: 11, letterSpacing: 2 },
  cardTitle: { ...typo.h1, color: colors.silverHi, textAlign: 'center', fontWeight: '800', marginTop: 4 },
  cardSub: { ...typo.small, color: colors.text, textAlign: 'center', marginTop: 6, fontStyle: 'italic', lineHeight: 18 },

  qrWrap: { alignItems: 'center', marginTop: spacing.lg, gap: spacing.sm },
  qrRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginTop: spacing.lg,
    width: '100%',
    paddingHorizontal: spacing.xs,
  },
  qrCol: { flex: 1, alignItems: 'center' },
  qrLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  qrLabel: {
    color: colors.silverHi,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  qrInner: { padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.gold },
  qrCaption: { ...typo.label, color: colors.gold, fontSize: 10, letterSpacing: 1.2, marginTop: 4 },

  priceChip: {
    alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.gold, backgroundColor: colors.gold + '11',
    marginTop: spacing.lg,
  },
  priceText: { ...typo.label, color: colors.gold, fontSize: 11, letterSpacing: 1.5 },

  actions: { gap: spacing.sm },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: radius.pill, backgroundColor: colors.gold,
  },
  primaryBtnText: { color: colors.bg, fontWeight: '700' },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.gold + '88', backgroundColor: colors.gold + '11',
  },
  secondaryBtnText: { color: colors.gold, fontWeight: '600' },
  foot: { ...typo.tiny, color: colors.textMuted, fontStyle: 'italic', textAlign: 'center', marginTop: spacing.lg, paddingHorizontal: spacing.md, lineHeight: 17 },
});
