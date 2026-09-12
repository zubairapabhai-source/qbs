/**
 * Ummah Passport — QBS (Qurʾān · Bible · Science).
 *
 * Fully trilingual (EN / AR / UR). Anonymous cross-app link.
 * See /app/frontend/app/passport.tsx for the canonical implementation.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Linking, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../src/store/useApp';
import { colors, radius, spacing, type as ty } from '../src/theme';
import { passportApi, BADGE_META, type PassportView } from '../src/passportApi';
import { bundleApi, STORE_LINKS } from '../src/bundleApi';
import { bs } from '../src/bundleStrings';
import { GiftInboxStrip } from '../src/components/GiftInboxStrip';
import { TopGiftersCard } from '../src/components/TopGiftersCard';
import { pt } from '../src/passportStrings';

const APPS: ('treasures' | 'dreams' | 'qbs')[] = ['treasures', 'dreams', 'qbs'];
const APP_LABEL: Record<string, string> = {
  treasures: 'Treasures of the Sacred Qurʾān',
  dreams:    'Interpretation of Dreams',
  qbs:       'Qurʾān · Bible · Science',
};
const APP_ICON: Record<string, string> = {
  treasures: 'book', dreams: 'moon', qbs: 'sparkles',
};

const APP_SCHEME: Record<'treasures' | 'dreams' | 'qbs', string> = {
  treasures: 'sacredtreasures://',
  dreams:    'frontend://',
  qbs:       'qbs://',
};

async function openStoreFor(app: 'treasures' | 'dreams' | 'qbs', code?: string) {
  const links = STORE_LINKS[app];
  const storeUrl = Platform.OS === 'android' ? links.android : links.ios;
  const scheme = APP_SCHEME[app];
  if (code) {
    try { await Clipboard.setStringAsync(code); } catch {}
  }
  const openApp = async () => {
    try { await Linking.openURL(scheme); }
    catch {
      Alert.alert(
        `${links.name} not installed`,
        'It looks like the app isn\'t on this device yet. Tap "Get from App Store" to install it.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Get from App Store', onPress: () => Linking.openURL(storeUrl).catch(() => {}) },
        ],
      );
    }
  };
  const openStore = () => Linking.openURL(storeUrl).catch(async () => {
    try { await Clipboard.setStringAsync(storeUrl); } catch {}
    const lang = useApp.getState().lang;
    Alert.alert(
      lang === 'ar' ? 'تم نسخ رابط المتجر' : lang === 'ur' ? 'اسٹور لنک کاپی ہو گیا' : 'Store link copied',
      storeUrl,
    );
  });
  Alert.alert(
    code ? '✅ Code copied to clipboard' : `Open ${links.name}`,
    code
      ? `Your Passport code is on the clipboard.\n\nIf you already have ${links.name}, tap "Open it" — the code will auto-fill on the Ummah Passport screen. Otherwise, tap "Get from App Store".`
      : `Do you already have ${links.name} installed?`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Get from App Store', onPress: openStore },
      { text: 'Open it', onPress: openApp, isPreferred: true },
    ],
  );
}

export default function PassportScreen() {
  const langStore = useApp((z) => z.lang) as 'en' | 'ar' | 'ur';
  const L = <T,>(en: T, ar: T, ur: T): T => langStore === 'ar' ? ar : langStore === 'ur' ? ur : en;
  const rtl = langStore === 'ar' || langStore === 'ur'; void rtl;
  const router = useRouter();
  const routeParams = useLocalSearchParams<{ code?: string }>();
  const insets = useSafeAreaInsets();
  const [passport, setPassport] = useState<PassportView | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputCode, setInputCode] = useState('');
  const [busy, setBusy] = useState<'create' | 'link' | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const s = await passportApi.status();
      setPassport(s.linked ? s.passport : null);
    } catch { setPassport(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Auto-fill code from magic-link (?code=XX-XX-XX)
  useEffect(() => {
    const c = (routeParams?.code || '').toString().trim().toUpperCase();
    if (c && !inputCode) setInputCode(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeParams?.code]);

  // Clipboard auto-detect is TAP-GATED to avoid the iOS 16+ "pasted from"
  // banner every time the screen mounts (senior review, P2).
  const pasteFromClipboard = async () => {
    try {
      const raw = (await Clipboard.getStringAsync()) || '';
      const m = raw.toUpperCase().match(/\b[A-Z2-9]{2}-[A-Z2-9]{2}-[A-Z2-9]{2}\b/);
      if (m) setInputCode(m[0]);
      else setInputCode(raw.trim().slice(0, 10).toUpperCase());
    } catch {}
  };

  const doCreate = async () => {
    setBusy('create');
    try { setPassport(await passportApi.create()); }
    catch (e: any) { Alert.alert(pt('a_create_fail_title', langStore), e?.message || pt('a_create_fail_body', langStore)); }
    finally { setBusy(null); }
  };

  const doLink = async () => {
    if (!inputCode.trim() || inputCode.trim().length < 6) {
      Alert.alert(pt('a_enter_code_title', langStore), pt('a_enter_code_body', langStore));
      return;
    }
    setBusy('link');
    const code = inputCode.trim();
    const setEntitlement = useApp.getState().setEntitlement;
    try {
      let linked: any = null;
      let linkedMsg = '';
      try {
        linked = await passportApi.link(code);
        setPassport(linked);
        if (linked.newly_earned?.length) {
          const b = BADGE_META[linked.newly_earned[0]];
          if (b) linkedMsg = `${b.emoji} ${b.label} — ${b.criteria}.`;
        } else {
          linkedMsg = pt('a_linked_default', langStore);
        }
      } catch (linkErr: any) {
        if (linkErr?.detail?.reason === 'invalid_code' || linkErr?.status === 404) {
          try {
            const gr = await bundleApi.giftRedeem(code);
            try {
              const s = await passportApi.status();
              if (s.linked && s.passport) setPassport(s.passport);
            } catch {}
            setEntitlement({ unlocked: true });
            bundleApi.redeem().catch(() => {});
            setInputCode('');
            const msgLines = [bs('gift_unlocked_qbs')];
            if (gr.buyer_msg) msgLines.push(bs('gift_msg_from_friend', { msg: gr.buyer_msg }));
            if (gr.passport_code) {
              msgLines.push(bs('gift_paste_hint', { code: gr.passport_code }));
            }
            Alert.alert(bs('gift_accepted'), msgLines.join('\n'));
            return;
          } catch (giftErr: any) {
            const gr = giftErr?.detail?.reason;
            if (gr === 'already_claimed') { Alert.alert(bs('gift_already_title'), bs('gift_already_body')); return; }
            if (gr === 'self_claim') { Alert.alert(bs('gift_self_title'), bs('gift_self_body')); return; }
            throw linkErr;
          }
        }
        throw linkErr;
      }
      setInputCode('');
      try {
        const b = await bundleApi.status();
        if (b.should_unlock_here) {
          setEntitlement({ unlocked: true });
          bundleApi.redeem().catch(() => {});
          Alert.alert(bs('bundle_unlocked_title'), bs('bundle_unlocked_qbs'));
          return;
        }
      } catch {}
      if (linkedMsg) Alert.alert(pt('a_linked_title', langStore), linkedMsg);
    } catch (e: any) {
      const r = e?.detail?.reason || '';
      const msg = r === 'invalid_code' ? pt('a_not_linked_invalid', langStore)
        : r === 'code_expired' ? pt('a_not_linked_expired', langStore)
        : r === 'app_taken' ? pt('a_not_linked_taken', langStore)
        : (e?.message || pt('a_not_linked_generic', langStore));
      Alert.alert(pt('a_not_linked_title', langStore), msg);
    } finally { setBusy(null); }
  };

  const copyCode = async () => {
    if (!passport?.code) return;
    const code = passport.code;
    // Magic-link message that opens Treasures OR Dreams directly and
    // auto-fills the code. Recipient just taps Redeem.
    const text = L(
      `Assalāmu ʿalaykum! Let's link our Divine Series apps 🌙\n\nMy Passport code: ${code}\n\n📖 Tap to open Treasures: sacredtreasures://link?code=${code}\n🌙 Tap to open Dreams: frontend://link?code=${code}\n\n(Or open the app manually → Ummah Passport → paste ${code} → Redeem.)\n\nValid 24 hours.`,
      `السلام عليكم! لنربط تطبيقات Divine Series الثلاثة 🌙\n\nرمز جوازي: ${code}\n\n📖 افتح Treasures: sacredtreasures://link?code=${code}\n🌙 افتح Dreams: frontend://link?code=${code}\n\n(أو افتح التطبيق يدويًا ← جواز الأمّة ← ألصق ${code} ← استرداد.)\n\nصالح 24 ساعة.`,
      `السلام علیکم! ہمارے Divine Series ایپس جوڑیں 🌙\n\nمیرا پاسپورٹ کوڈ: ${code}\n\n📖 Treasures کھولیں: sacredtreasures://link?code=${code}\n🌙 Dreams کھولیں: frontend://link?code=${code}\n\n(یا ایپ کھولیں ← اُمّہ پاسپورٹ ← ${code} پیسٹ کریں ← Redeem دبائیں۔)\n\n24 گھنٹے تک درست۔`,
    );
    try {
      await Clipboard.setStringAsync(text);
      try { await Share.share({ message: text }); } catch {}
      Alert.alert(pt('a_copy_pw_toast', langStore), pt('a_copy_body', langStore));
    } catch {}
  };

  const allLinked = passport && APPS.every(k => passport.apps[k]);
  const missing = passport ? APPS.filter(k => !passport.apps[k]) : APPS;

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} testID="passport-back">
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.md }}>
        <Text style={styles.kicker}>{L('DIVINE SERIES', 'ديفاين سيريز', 'ڈیوائن سیریز')}</Text>
        <Text style={styles.title}>{L('Ummah Passport', 'جواز الأمّة', 'اُمّہ پاسپورٹ')}</Text>
        <Text style={styles.sub}>
          {pt('intro', langStore)}
        </Text>

        {/* ── How to link — 2-step, glanceable ── */}
        <View style={styles.howToCard}>
          <Text style={[styles.howToTitle, { textAlign: rtl ? 'right' : 'left' }]}>
            {L('✨ Link your 3 apps in 2 steps', '✨ اربط تطبيقاتك الثلاثة في خطوتين', '✨ 2 قدموں میں 3 ایپس جوڑیں')}
          </Text>
          <View style={[styles.howToRow, rtl && { flexDirection: 'row-reverse' }]}>
            <Text style={styles.howToNum}>1</Text>
            <Text style={[styles.howToStep, { textAlign: rtl ? 'right' : 'left' }]}>
              {L(
                'Copy your 6-character code below.',
                'انسخ رمزك المكوّن من 6 أحرف بالأسفل.',
                'نیچے دیا 6 حرفوں کا کوڈ کاپی کریں۔'
              )}
            </Text>
          </View>
          <View style={[styles.howToRow, rtl && { flexDirection: 'row-reverse' }]}>
            <Text style={styles.howToNum}>2</Text>
            <Text style={[styles.howToStep, { textAlign: rtl ? 'right' : 'left' }]}>
              {L(
                'Open Treasures & Dreams → Ummah Passport → paste → Redeem.',
                'افتح تريجرز و ديريمز → جواز الأمّة → الصق → استرداد.',
                'Treasures اور Dreams کھولیں → اُمّہ پاسپورٹ → پیسٹ → Redeem۔'
              )}
            </Text>
          </View>
          <Text style={[styles.howToFoot, { textAlign: rtl ? 'right' : 'left' }]}>
            {L(
              '💡 One code links all 3.',
              '💡 رمز واحد يربط الثلاثة.',
              '💡 ایک کوڈ تینوں کو جوڑتا ہے۔'
            )}
          </Text>
        </View>

        {loading ? (
          <View style={styles.centerBlock}><ActivityIndicator color={colors.gold} /></View>
        ) : passport ? (
          <>
            <GiftInboxStrip />
            <TopGiftersCard />
            {!allLinked ? (
              <View style={styles.card}>
                <Text style={styles.cardKicker}>{pt('your_passport_code', langStore)}</Text>
                <Text style={styles.bigCode} testID="passport-current-code">{passport.code}</Text>
                <Text style={styles.codeMeta}>
                  {pt('code_meta', langStore, { apps: missing.map(a => APP_LABEL[a]).join(' · ') })}
                </Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <Pressable onPress={copyCode} style={styles.secondaryBtn} testID="passport-share-code">
                    <Ionicons name="copy-outline" size={14} color={colors.gold} />
                    <Text style={styles.secondaryBtnText}>{pt('copy_share', langStore)}</Text>
                  </Pressable>
                  <Pressable onPress={doCreate} disabled={busy === 'create'} style={[styles.secondaryBtn, busy && { opacity: 0.6 }]}>
                    <Ionicons name="refresh" size={14} color={colors.gold} />
                    <Text style={styles.secondaryBtnText}>{pt('refresh', langStore)}</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.celebrateCard}>
                <Text style={styles.celebrateEmoji}>🌙</Text>
                <Text style={styles.celebrateTitle}>{pt('all_linked_title', langStore)}</Text>
                <Text style={styles.celebrateBody}>{pt('all_linked_body', langStore)}</Text>
              </View>
            )}

            <View style={styles.card}>
              <View style={styles.actionHeader}>
                <Ionicons name="key" size={18} color={colors.gold} />
                <Text style={styles.actionTitle}>{pt('got_code_title', langStore)}</Text>
              </View>
              <Text style={styles.actionBody}>
                {pt('got_code_body_a', langStore)}{' '}
                <Text style={{ color: colors.gold }}>🎁 {pt('got_code_body_b', langStore)}</Text>{' '}
                {pt('got_code_body_c', langStore)}
              </Text>
              <TextInput
                value={inputCode}
                onChangeText={setInputCode}
                placeholder="A7-KM-2X"
                placeholderTextColor={colors.textDim}
                autoCapitalize="characters"
                maxLength={10}
                style={styles.codeInput}
                testID="passport-code-input-linked"
              />
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Pressable onPress={pasteFromClipboard} style={styles.secondaryBtn} testID="passport-paste-linked">
                  <Ionicons name="clipboard-outline" size={14} color={colors.gold} />
                  <Text style={styles.secondaryBtnText}>{pt('paste_clipboard', langStore)}</Text>
                </Pressable>
                <Pressable onPress={doLink} disabled={busy === 'link'} style={[styles.primaryBtn, { flex: 1 }, busy === 'link' && { opacity: 0.7 }]} testID="passport-link-linked">
                  {busy === 'link' ? <ActivityIndicator color={colors.bg} size="small" /> : <Text style={styles.primaryBtnText}>{pt('redeem_code', langStore)}</Text>}
                </Pressable>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardKicker}>{pt('connected_apps', langStore)}</Text>
              {APPS.map((a) => {
                const on = passport.apps[a];
                return (
                  <View key={a} style={styles.appRow}>
                    <View style={[styles.appDot, on && { backgroundColor: colors.gold }]}>
                      <Ionicons name={APP_ICON[a] as any} size={13} color={on ? colors.bg : colors.gold} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.appName}>{APP_LABEL[a]}</Text>
                      <Text style={styles.appMeta}>{on ? pt('linked', langStore) : pt('not_linked', langStore)}</Text>
                    </View>
                    {on ? (
                      <Ionicons name="checkmark-circle" size={18} color={colors.gold} />
                    ) : a === 'qbs' ? null : (
                      <Pressable onPress={() => openStoreFor(a, passport.code)} style={styles.miniBtn} testID={`passport-get-${a}`}>
                        <Text style={styles.miniBtnText}>{pt('get', langStore)}</Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardKicker}>{pt('badges', langStore)}</Text>
              {Object.entries(BADGE_META).map(([key, meta]) => {
                const earned = passport.badges.includes(key);
                return (
                  <View key={key} style={[styles.badgeRow, !earned && { opacity: 0.45 }]}>
                    <Text style={styles.badgeEmoji}>{meta.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.badgeName}>{meta.label}</Text>
                      <Text style={styles.badgeCriteria}>{meta.criteria}</Text>
                    </View>
                    {earned ? <Ionicons name="checkmark-circle" size={16} color={colors.gold} /> : null}
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.actionHeader}>
                <Ionicons name="add-circle" size={18} color={colors.gold} />
                <Text style={styles.actionTitle}>{pt('create_a_code', langStore)}</Text>
              </View>
              <Text style={styles.actionBody}>{pt('create_body', langStore)}</Text>
              <Pressable onPress={doCreate} disabled={busy === 'create'} style={[styles.primaryBtn, busy === 'create' && { opacity: 0.7 }]} testID="passport-create">
                {busy === 'create' ? <ActivityIndicator color={colors.bg} size="small" /> : <Text style={styles.primaryBtnText}>{pt('generate_my_code', langStore)}</Text>}
              </Pressable>
            </View>
            <Text style={styles.orLine}>{pt('or', langStore)}</Text>
            <View style={styles.card}>
              <View style={styles.actionHeader}>
                <Ionicons name="key" size={18} color={colors.gold} />
                <Text style={styles.actionTitle}>{pt('enter_a_code', langStore)}</Text>
              </View>
              <Text style={styles.actionBody}>
                {pt('enter_body_a', langStore)}{' '}
                <Text style={{ color: colors.gold }}>🎁 {pt('enter_body_b', langStore)}</Text>{' '}
                {pt('enter_body_c', langStore)}
              </Text>
              <TextInput
                value={inputCode}
                onChangeText={setInputCode}
                placeholder="A7-KM-2X"
                placeholderTextColor={colors.textDim}
                autoCapitalize="characters"
                maxLength={10}
                style={styles.codeInput}
                testID="passport-code-input"
              />
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Pressable onPress={pasteFromClipboard} style={styles.secondaryBtn} testID="passport-paste">
                  <Ionicons name="clipboard-outline" size={14} color={colors.gold} />
                  <Text style={styles.secondaryBtnText}>{pt('paste_clipboard', langStore)}</Text>
                </Pressable>
                <Pressable onPress={doLink} disabled={busy === 'link'} style={[styles.primaryBtn, { flex: 1 }, busy === 'link' && { opacity: 0.7 }]} testID="passport-link">
                  {busy === 'link' ? <ActivityIndicator color={colors.bg} size="small" /> : <Text style={styles.primaryBtnText}>{pt('link_my_apps', langStore)}</Text>}
                </Pressable>
              </View>
            </View>
          </>
        )}

        <Text style={styles.disclaimer}>
          {pt('disclaimer', langStore)}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  iconBtn: {
    width: 40, height: 40, borderRadius: radius.full,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  kicker: { ...ty.tiny, marginBottom: 4 },
  title: { ...ty.h1, marginBottom: 6 },
  sub: { ...ty.body, lineHeight: 21 },
  centerBlock: { padding: spacing.xl, alignItems: 'center' },
  card: {
    padding: spacing.md, borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.cardBorder,
    gap: spacing.sm,
  },
  cardKicker: { color: colors.gold, letterSpacing: 1.5, fontSize: 10, fontWeight: '800' },
  actionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  actionBody: { fontSize: 12, color: colors.textDim, lineHeight: 18 },
  primaryBtn: {
    marginTop: 4, paddingVertical: 12, borderRadius: radius.full,
    backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnText: { color: colors.bg, fontWeight: '800', letterSpacing: 0.3 },
  codeInput: {
    borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.md,
    padding: spacing.md, fontSize: 22, letterSpacing: 4, textAlign: 'center', fontWeight: '800',
    color: colors.gold, backgroundColor: colors.card, textTransform: 'uppercase',
  },
  bigCode: {
    fontSize: 40, letterSpacing: 6, textAlign: 'center', fontWeight: '900',
    color: colors.gold, marginVertical: 4, fontVariant: ['tabular-nums'],
  },
  codeMeta: { fontSize: 11, color: colors.textDim, textAlign: 'center', lineHeight: 16 },
  secondaryBtn: {
    flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: 'rgba(212,175,55,0.06)',
  },
  secondaryBtnText: { color: colors.gold, fontWeight: '700', fontSize: 12, letterSpacing: 0.3 },
  celebrateCard: {
    padding: spacing.lg, alignItems: 'center', gap: 4,
    borderRadius: radius.lg, backgroundColor: 'rgba(212,175,55,0.06)',
    borderWidth: 1, borderColor: colors.gold,
  },
  celebrateEmoji: { fontSize: 40 },
  celebrateTitle: { ...ty.h3, color: colors.gold },
  celebrateBody: { ...ty.tiny, color: colors.textDim, textAlign: 'center', lineHeight: 18 },
  orLine: { textAlign: 'center', color: colors.textDim, fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  appRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.cardBorder,
  },
  appDot: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(212,175,55,0.06)',
  },
  appName: { color: colors.text, fontSize: 13, fontWeight: '600' },
  appMeta: { color: colors.textDim, fontSize: 11 },
  miniBtn: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.gold,
  },
  miniBtnText: { color: colors.gold, fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  badgeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.cardBorder,
  },
  badgeEmoji: { fontSize: 22 },
  badgeName: { color: colors.text, fontSize: 13, fontWeight: '700' },
  badgeCriteria: { color: colors.textDim, fontSize: 11, lineHeight: 15 },
  disclaimer: { fontSize: 11, color: colors.textDim, marginTop: spacing.md, fontStyle: 'italic', textAlign: 'center' },
  howToCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(212,175,55,0.06)',
    borderWidth: 1, borderColor: colors.gold,
    gap: 10,
  },
  howToTitle: { ...ty.h3, color: colors.gold, fontSize: 16, letterSpacing: 0.3 },
  howToRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  howToNum: {
    width: 22, height: 22, borderRadius: 11,
    textAlign: 'center', lineHeight: 22,
    fontSize: 12, fontWeight: '800',
    color: colors.bg, backgroundColor: colors.gold,
    overflow: 'hidden',
  },
  howToStep: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 18 },
  howToFoot: { color: colors.textDim, fontSize: 11, fontStyle: 'italic', lineHeight: 15, marginTop: 2 },
});
