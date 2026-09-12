/**
 * BundleOfferModal — shown after the £0.99 QBS unlock succeeds.
 * See /app/frontend/src/components/BundleOfferModal.tsx for the canonical
 * version. QBS theme uses `type` + `radius` + emerald palette.
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Modal, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { colors, radius, spacing, type } from '../theme';
import { bundleApi, storeUrlFor, STORE_LINKS, shareGiftMessage } from '../bundleApi';
import { bs } from '../bundleStrings';
import { fetchBundlePrice, purchaseBundle, isNativeIapAvailable, BUNDLE_PRODUCT_ID } from '../iap/bundleIap';
import { useApp } from '../store/useApp';
import { currentLang } from '../i18n/strings';

type Props = { visible: boolean; onClose: () => void };

export function BundleOfferModal({ visible, onClose }: Props) {
  const setEntitlement = useApp((s) => s.setEntitlement);
  const [price, setPrice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<'offer' | 'success' | 'gift_success' | 'claim_error'>('offer');
  const [mode, setMode] = useState<'self' | 'gift'>('self');
  const [passportCode, setPassportCode] = useState<string>('');
  const [giftCode, setGiftCode] = useState<string>('');
  const [buyerMsg, setBuyerMsg] = useState<string>('');
  const [lastReceipt, setLastReceipt] = useState<{ receipt: string; txn?: string; productId?: string } | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setStep('offer');
    setMode('self');
    setPassportCode('');
    setGiftCode('');
    setBuyerMsg('');
    setLastReceipt(null);
    setClaimError(null);
    let cancelled = false;
    (async () => {
      try {
        const p = await fetchBundlePrice();
        if (!cancelled) setPrice(p);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [visible]);

  const onBuy = async () => {
    if (busy) return;
    setBusy(true);
    setClaimError(null);
    try {
      let receiptData = { receipt: 'preview-bundle', txn: 'preview-txn', productId: BUNDLE_PRODUCT_ID };
      if (isNativeIapAvailable()) {
        const res = await purchaseBundle();
        receiptData = { receipt: res.receipt, txn: res.transactionId, productId: res.productId };
        // Bundle IS the QBS unlock for self-buyers.
        if (mode === 'self') setEntitlement({ unlocked: true });
      }
      setLastReceipt(receiptData);
      if (mode === 'gift') {
        try {
          const gr = await bundleApi.giftCreate(receiptData.receipt, receiptData.txn, receiptData.productId, buyerMsg.trim() || undefined);
          setGiftCode(gr.code || '');
          setStep('gift_success');
          if (gr.code) { try { await Clipboard.setStringAsync(gr.code); } catch {} }
        } catch (giftErr: any) {
          setClaimError(giftErr?.message || 'We could not create the gift with our server. Tap retry.');
          setStep('claim_error');
        }
        return;
      }
      try {
        const r = await bundleApi.claim(receiptData.receipt, receiptData.txn, receiptData.productId);
        setPassportCode(r?.code || '');
        setStep('success');
        if (r?.code) { try { await Clipboard.setStringAsync(r.code); } catch {} }
      } catch (claimErr: any) {
        setClaimError(claimErr?.message || 'We could not confirm your bundle with our server. Tap retry.');
        setStep('claim_error');
      }
    } catch (e: any) {
      if (e?.code !== 'E_USER_CANCELLED') {
        Alert.alert(bs('alert_unlock_failed'), e?.message || bs('alert_try_again'));
      }
    } finally { setBusy(false); }
  };

  const onRetryClaim = async () => {
    if (busy || !lastReceipt) return;
    setBusy(true);
    setClaimError(null);
    try {
      if (mode === 'gift') {
        const gr = await bundleApi.giftCreate(lastReceipt.receipt, lastReceipt.txn, lastReceipt.productId, buyerMsg.trim() || undefined);
        setGiftCode(gr.code || '');
        setStep('gift_success');
        if (gr.code) { try { await Clipboard.setStringAsync(gr.code); } catch {} }
      } else {
        const r = await bundleApi.claim(lastReceipt.receipt, lastReceipt.txn, lastReceipt.productId);
        setPassportCode(r?.code || '');
        setStep('success');
        if (r?.code) { try { await Clipboard.setStringAsync(r.code); } catch {} }
      }
    } catch (e: any) {
      setClaimError(e?.message || bs('alert_still_failed'));
    } finally { setBusy(false); }
  };

  const shareGift = async () => {
    if (!giftCode) return;
    const lang = currentLang();
    const message = shareGiftMessage(giftCode, buyerMsg.trim() || null, lang);
    const url = bundleApi.giftCardSvgUrl(giftCode, lang);
    try {
      await Clipboard.setStringAsync(message);
      const { Share } = require('react-native');
      await Share.share({ message, url });
    } catch { Alert.alert(bs('alert_copied_instead'), bs('alert_gift_copied')); }
  };

  const openStore = async (app: 'treasures' | 'dreams' | 'qbs') => {
    const url = storeUrlFor(app, Platform.OS === 'android' ? 'android' : 'ios');
    try { await Linking.openURL(url); } catch { Alert.alert(bs('alert_could_open_store'), url); }
  };

  const copyCode = async () => {
    if (!passportCode) return;
    try {
      await Clipboard.setStringAsync(passportCode);
      Alert.alert(bs('alert_copied'), bs('alert_code_copied', { code: passportCode }));
    } catch { Alert.alert(bs('alert_copy_failed'), passportCode); }
  };

  const priceLabel = price || '£1.50';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.card}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg }}>
            {step === 'offer' ? (
              <>
                <View style={styles.iconWrap}><Text style={styles.giftEmoji}>🎁</Text></View>
                <Text style={styles.headline}>{bs('headline_offer')}</Text>
                <Text style={styles.title}>{bs('title_offer')}</Text>
                <Text style={styles.subtitle}>{bs('subtitle_qbs', { price: priceLabel })}</Text>

                <View style={styles.compareRow}>
                  <View style={styles.compareCol}>
                    <Text style={styles.compareCap}>{bs('compare_separate')}</Text>
                    <Text style={styles.compareStrike}>£1.98</Text>
                  </View>
                  <View style={styles.compareVs}><Text style={styles.vsText}>{bs('compare_vs')}</Text></View>
                  <View style={[styles.compareCol, styles.compareBest]}>
                    <Text style={[styles.compareCap, styles.compareCapBest]}>{bs('compare_bundle')}</Text>
                    <Text style={styles.compareBig}>{priceLabel}</Text>
                    <Text style={styles.compareSave}>{bs('compare_save')}</Text>
                  </View>
                </View>

                <View style={styles.perks}>
                  <PerkRow emoji="📖" text={bs('perk_treasures')} />
                  <PerkRow emoji="🌙" text={bs('perk_dreams')} />
                  <PerkRow emoji="🕌" text={bs('perk_trinity')} />
                  <PerkRow emoji="📿" text={bs('perk_passport')} />
                </View>

                {/* For me / As a gift toggle */}
                <View style={styles.modeRow}>
                  <Pressable onPress={() => setMode('self')} style={[styles.modeBtn, mode === 'self' && styles.modeBtnActive]}>
                    <Ionicons name="person" size={14} color={mode === 'self' ? colors.bg : colors.textDim} />
                    <Text style={[styles.modeText, mode === 'self' && styles.modeTextActive]}>{bs('mode_self')}</Text>
                  </Pressable>
                  <Pressable onPress={() => setMode('gift')} style={[styles.modeBtn, mode === 'gift' && styles.modeBtnActive]}>
                    <Ionicons name="gift" size={14} color={mode === 'gift' ? colors.bg : colors.textDim} />
                    <Text style={[styles.modeText, mode === 'gift' && styles.modeTextActive]}>{bs('mode_gift')}</Text>
                  </Pressable>
                </View>

                {mode === 'gift' ? (
                  <View style={styles.msgWrap}>
                    <Text style={styles.msgLabel}>{bs('msg_label')}</Text>
                    <TextInput
                      value={buyerMsg}
                      onChangeText={setBuyerMsg}
                      placeholder={bs('msg_placeholder')}
                      placeholderTextColor={colors.textDim}
                      style={styles.msgInput}
                      maxLength={200}
                      multiline
                    />
                    <Text style={styles.msgCounter}>{buyerMsg.length} / 200</Text>
                  </View>
                ) : null}

                <Pressable onPress={onBuy} disabled={busy}
                  style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }, busy && styles.ctaDisabled]}>
                  {busy ? (
                    <ActivityIndicator color={colors.bg} />
                  ) : (
                    <>
                      <Ionicons name="gift" size={16} color={colors.bg} />
                      <Text style={styles.ctaText}>
                        {mode === 'gift'
                          ? bs('cta_gift', { price: priceLabel })
                          : bs('cta_self', { price: priceLabel })}
                      </Text>
                    </>
                  )}
                </Pressable>
                <Pressable onPress={onClose} disabled={busy} hitSlop={10} style={styles.skip}>
                  <Text style={styles.skipText}>{bs('skip')}</Text>
                </Pressable>
                <Text style={styles.footNote}>
                  {mode === 'gift' ? bs('foot_gift') : bs('foot_self')}
                </Text>
              </>
            ) : step === 'gift_success' ? (
              <>
                <View style={styles.iconWrap}><Text style={styles.giftEmoji}>🎁</Text></View>
                <Text style={styles.headline}>{bs('headline_gift')}</Text>
                <Text style={styles.title}>{bs('title_gift')}</Text>
                <Text style={styles.subtitle}>{bs('gift_success_body')}</Text>
                {giftCode ? (
                  <Pressable onPress={async () => { try { await Clipboard.setStringAsync(giftCode); Alert.alert(bs('alert_copied'), giftCode); } catch {} }} style={styles.codeBox}>
                    <Text style={styles.codeCap}>{bs('gift_code_cap')}</Text>
                    <Text style={styles.codeVal}>{giftCode}</Text>
                    <Text style={styles.codeHint}>{bs('gift_code_hint')}</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={shareGift} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}>
                  <Ionicons name="share-social" size={16} color={colors.bg} />
                  <Text style={styles.ctaText}>{bs('share_gift')}</Text>
                </Pressable>
                <Pressable onPress={onClose} style={({ pressed }) => [styles.skip, pressed && { opacity: 0.85 }]}>
                  <Text style={styles.skipText}>{bs('done')}</Text>
                </Pressable>
              </>
            ) : step === 'success' ? (
              <>
                <View style={styles.iconWrap}><Text style={styles.giftEmoji}>✨</Text></View>
                <Text style={styles.headline}>{bs('headline_success')}</Text>
                <Text style={styles.title}>{bs('title_success')}</Text>
                <Text style={styles.subtitle}>{bs('success_body')}</Text>

                {passportCode ? (
                  <Pressable onPress={copyCode} style={styles.codeBox}>
                    <Text style={styles.codeCap}>{bs('code_cap')}</Text>
                    <Text style={styles.codeVal}>{passportCode}</Text>
                    <Text style={styles.codeHint}>{bs('code_hint_qbs')}</Text>
                  </Pressable>
                ) : null}

                <View style={styles.appLinks}>
                  <Pressable onPress={() => openStore('treasures')} style={({ pressed }) => [styles.appLinkBtn, pressed && { opacity: 0.85 }]}>
                    <Text style={styles.appLinkEmoji}>{STORE_LINKS.treasures.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.appLinkTitle}>{STORE_LINKS.treasures.name}</Text>
                      <Text style={styles.appLinkStore}>{bs('store_open', { store: Platform.OS === 'android' ? bs('store_playstore') : bs('store_appstore') })}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.gold} />
                  </Pressable>

                  <Pressable onPress={() => openStore('dreams')} style={({ pressed }) => [styles.appLinkBtn, pressed && { opacity: 0.85 }]}>
                    <Text style={styles.appLinkEmoji}>{STORE_LINKS.dreams.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.appLinkTitle}>{STORE_LINKS.dreams.name}</Text>
                      <Text style={styles.appLinkStore}>{bs('store_open', { store: Platform.OS === 'android' ? bs('store_playstore') : bs('store_appstore') })}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.gold} />
                  </Pressable>
                </View>

                <Pressable onPress={onClose} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}>
                  <Text style={styles.ctaText}>{bs('done')}</Text>
                </Pressable>
              </>
            ) : (
              // claim_error — payment went through but backend claim failed.
              <>
                <View style={styles.iconWrap}>
                  <Ionicons name="warning" size={30} color={colors.gold} />
                </View>
                <Text style={styles.headline}>{bs('headline_claim_error')}</Text>
                <Text style={styles.title}>{bs('title_claim_error')}</Text>
                <Text style={styles.subtitle}>{bs('claim_error_body')}</Text>
                {claimError ? (
                  <Text style={styles.errorMsg}>{claimError}</Text>
                ) : null}
                <Pressable
                  onPress={onRetryClaim}
                  disabled={busy}
                  style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }, busy && styles.ctaDisabled]}
                >
                  {busy ? (
                    <ActivityIndicator color={colors.bg} />
                  ) : (
                    <>
                      <Ionicons name="refresh" size={16} color={colors.bg} />
                      <Text style={styles.ctaText}>{bs('retry')}</Text>
                    </>
                  )}
                </Pressable>
                <Pressable onPress={onClose} disabled={busy} hitSlop={10} style={styles.skip}>
                  <Text style={styles.skipText}>{bs('try_later')}</Text>
                </Pressable>
                <Text style={styles.footNote}>{bs('claim_error_foot')}</Text>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function PerkRow({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.perkRow}>
      <Text style={styles.perkEmoji}>{emoji}</Text>
      <Text style={styles.perkText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(3, 8, 24, 0.85)',
    alignItems: 'center', justifyContent: 'center', padding: spacing.md,
  },
  card: {
    width: '100%', maxWidth: 460, maxHeight: '92%',
    backgroundColor: colors.bgElevated, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.cardBorderHi, overflow: 'hidden',
  },
  iconWrap: {
    alignSelf: 'center', width: 66, height: 66, borderRadius: 33,
    borderWidth: 1.5, borderColor: colors.cardBorderHi,
    backgroundColor: 'rgba(232, 198, 106, 0.10)',
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  giftEmoji: { fontSize: 30 },
  headline: { ...type.micro, color: colors.gold, textAlign: 'center', marginBottom: 4 },
  title: { ...type.h2, color: colors.text, textAlign: 'center' },
  subtitle: { ...type.body, color: colors.textDim, textAlign: 'center', marginTop: spacing.sm, lineHeight: 22 },
  bold: { color: colors.text, fontWeight: '700' },
  emojiInline: { fontSize: 15 },
  priceInline: { color: colors.gold, fontWeight: '700' },
  compareRow: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.sm, marginTop: spacing.lg },
  compareCol: {
    flex: 1, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.cardBorder, padding: spacing.md,
    alignItems: 'center', justifyContent: 'center',
  },
  compareBest: { borderColor: colors.gold, backgroundColor: 'rgba(232, 198, 106, 0.08)' },
  compareCap: { ...type.micro, color: colors.textDim, marginBottom: 4 },
  compareCapBest: { color: colors.gold },
  compareStrike: { ...type.h2, color: colors.textDim, fontSize: 22, textDecorationLine: 'line-through' },
  compareBig: { ...type.h2, color: colors.gold, fontSize: 26 },
  compareSave: { ...type.micro, color: colors.gold, marginTop: 4 },
  compareVs: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  vsText: { ...type.small, color: colors.textDim, fontStyle: 'italic' },
  perks: { marginTop: spacing.lg, gap: 10 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  perkEmoji: { fontSize: 18, width: 22, textAlign: 'center' },
  perkText: { ...type.body, color: colors.text, flex: 1 },
  cta: {
    marginTop: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: colors.gold, paddingVertical: 14, paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { ...type.bodyLarge, color: colors.bg, fontWeight: '700' },
  skip: { marginTop: spacing.md, alignItems: 'center' },
  skipText: { ...type.small, color: colors.textDim, textDecorationLine: 'underline' },
  footNote: { ...type.small, color: colors.textDim, textAlign: 'center', marginTop: spacing.md, lineHeight: 18, opacity: 0.85 },
  codeBox: {
    marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.cardBorderHi,
    backgroundColor: 'rgba(232, 198, 106, 0.05)', alignItems: 'center',
  },
  codeCap: { ...type.micro, color: colors.gold, marginBottom: 4 },
  codeVal: { ...type.h2, color: colors.text, letterSpacing: 4, fontSize: 28 },
  codeHint: { ...type.small, color: colors.textDim, textAlign: 'center', marginTop: 6, lineHeight: 16 },
  appLinks: { marginTop: spacing.lg, gap: spacing.sm },
  appLinkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: spacing.md, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.cardBorder,
    backgroundColor: 'rgba(232, 198, 106, 0.03)',
  },
  appLinkEmoji: { fontSize: 22 },
  appLinkTitle: { ...type.body, color: colors.text, fontWeight: '700' },
  appLinkStore: { ...type.small, color: colors.textDim, marginTop: 2 },
  errorMsg: {
    ...type.small,
    color: colors.gold,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 18,
  },
  modeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.cardBorder,
    backgroundColor: 'rgba(232, 198, 106, 0.04)',
  },
  modeBtnActive: { borderColor: colors.gold, backgroundColor: colors.gold },
  modeText: { ...type.small, color: colors.textDim, fontWeight: '700' },
  modeTextActive: { color: colors.bg },
  msgWrap: { marginTop: spacing.md },
  msgLabel: { ...type.micro, color: colors.gold, marginBottom: 6 },
  msgInput: {
    ...type.body,
    color: colors.text,
    backgroundColor: 'rgba(232, 198, 106, 0.05)',
    borderWidth: 1,
    borderColor: colors.cardBorderHi,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 68,
    textAlignVertical: 'top',
  },
  msgCounter: { ...type.micro, color: colors.textDim, textAlign: 'right', marginTop: 4 },
});
