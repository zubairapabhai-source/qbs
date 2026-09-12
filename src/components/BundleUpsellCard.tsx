/**
 * BundleUpsellCard — QBS home fallback card.
 */
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, type } from '../theme';
import { useApp } from '../store/useApp';
import { bundleApi, type BundleView } from '../bundleApi';
import { bs } from '../bundleStrings';
import { BundleOfferModal } from './BundleOfferModal';

const DISMISS_KEY = '@qbs:bundle_card_dismissed_v1';

export function BundleUpsellCard() {
  const unlocked = useApp((s) => s.unlocked);
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [dismissed, setDismissed] = useState<boolean | null>(null);
  const [bundle, setBundle] = useState<BundleView | null>(null);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(DISMISS_KEY)
      .then((v) => { if (!cancelled) setDismissed(v === '1'); })
      .catch(() => { if (!cancelled) setDismissed(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    let cancelled = false;
    (async () => {
      try {
        const b = await bundleApi.status();
        if (!cancelled) setBundle(b);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [unlocked, modalOpen]);

  useEffect(() => {
    if (!unlocked || dismissed === null) return;
    setVisible(unlocked && bundle !== null && !bundle.claimed && !dismissed);
  }, [unlocked, dismissed, bundle]);

  const onDismiss = async () => {
    setVisible(false);
    try {
      await AsyncStorage.setItem(DISMISS_KEY, '1');
      setDismissed(true);
    } catch {}
  };

  if (!visible) return <BundleOfferModal visible={modalOpen} onClose={() => setModalOpen(false)} />;

  return (
    <>
      <Pressable onPress={() => setModalOpen(true)} style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}>
        <View style={styles.iconWrap}><Text style={styles.gift}>🎁</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cap}>{bs('card_cap')}</Text>
          <Text style={styles.title}>{bs('card_title')}</Text>
          <Text style={styles.body}>{bs('card_body_qbs', { price: '£1.50' })}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.gold} />
        <Pressable hitSlop={10} onPress={onDismiss} style={styles.close}>
          <Ionicons name="close" size={14} color={colors.textDim} />
        </Pressable>
      </Pressable>
      <BundleOfferModal visible={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: spacing.md,
    marginHorizontal: spacing.md, marginBottom: spacing.md,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.gold,
    backgroundColor: 'rgba(232, 198, 106, 0.10)',
    position: 'relative',
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1, borderColor: colors.cardBorderHi,
    backgroundColor: 'rgba(232, 198, 106, 0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  gift: { fontSize: 22 },
  cap: { ...type.micro, color: colors.gold, marginBottom: 2 },
  title: { ...type.body, color: colors.text, fontWeight: '700' },
  body: { ...type.small, color: colors.textDim, marginTop: 2, lineHeight: 17 },
  emoji: { fontSize: 13 },
  price: { color: colors.gold, fontWeight: '700' },
  close: { position: 'absolute', top: 4, right: 4, padding: 6 },
});
