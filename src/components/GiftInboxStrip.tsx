/**
 * GiftInboxStrip — QBS theme.
 * See /app/frontend/src/components/GiftInboxStrip.tsx for docs.
 */
import React, { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { colors, radius, spacing, type } from '../theme';
import { bundleApi, shareGiftMessage } from '../bundleApi';
import { bs } from '../bundleStrings';
import { currentLang } from '../i18n/strings';

type Gift = {
  code: string; created_at: string | null; claimed: boolean;
  claimed_at: string | null; claimed_by_app: 'treasures' | 'dreams' | 'qbs' | null;
  buyer_msg: string | null;
};

const appLabel = (app: string | null | undefined): string => {
  switch (app) {
    case 'treasures': return bs('app_treasures');
    case 'dreams':    return bs('app_dreams');
    case 'qbs':       return bs('app_qbs');
    default:          return bs('app_generic');
  }
};

export function GiftInboxStrip() {
  const [gifts, setGifts] = useState<Gift[] | null>(null);
  const [sent, setSent] = useState(0);
  const [claimed, setClaimed] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await bundleApi.giftsMine();
        if (cancelled) return;
        setGifts(r.gifts || []);
        setSent(r.sent || 0);
        setClaimed(r.claimed || 0);
      } catch { if (!cancelled) setGifts([]); }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!gifts || gifts.length === 0) return null;

  const shareGiftAgain = async (g: Gift) => {
    const lang = currentLang();
    const message = shareGiftMessage(g.code, g.buyer_msg, lang);
    const url = bundleApi.giftCardSvgUrl(g.code, lang);
    try {
      await Clipboard.setStringAsync(message);
      const { Share } = require('react-native');
      await Share.share({ message, url });
    } catch { Alert.alert(bs('alert_copied'), bs('alert_gift_msg_copied')); }
  };

  const previewGiftCard = async (g: Gift) => {
    const url = bundleApi.giftCardSvgUrl(g.code, currentLang());
    try { await Linking.openURL(url); } catch { Alert.alert(bs('alert_could_not_open'), url); }
  };

  return (
    <View style={styles.card}>
      <Pressable onPress={() => setExpanded((v) => !v)} style={styles.header}>
        <Text style={styles.headerEmoji}>🎁</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{bs('inbox_title')}</Text>
          <Text style={styles.subtitle}>{bs('inbox_summary', { claimed, sent })}</Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textDim} />
      </Pressable>
      {expanded ? (
        <View style={styles.list}>
          {gifts.map((g) => (
            <View key={g.code} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowCode}>{g.code}</Text>
                <Text style={styles.rowStatus}>
                  {g.claimed
                    ? `✅ ${bs('inbox_claimed_on', { app: appLabel(g.claimed_by_app) })}${g.claimed_at ? ` · ${new Date(g.claimed_at).toLocaleDateString()}` : ''}`
                    : `⏳ ${bs('inbox_awaiting')}`}
                </Text>
                {g.buyer_msg ? <Text style={styles.rowMsg} numberOfLines={2}>“{g.buyer_msg}”</Text> : null}
              </View>
              {!g.claimed ? (
                <View style={styles.actions}>
                  <Pressable hitSlop={8} onPress={() => shareGiftAgain(g)} style={styles.actionBtn}>
                    <Ionicons name="share-social" size={16} color={colors.gold} />
                  </Pressable>
                  <Pressable hitSlop={8} onPress={() => previewGiftCard(g)} style={styles.actionBtn}>
                    <Ionicons name="image" size={16} color={colors.gold} />
                  </Pressable>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md, marginBottom: spacing.md,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorderHi,
    backgroundColor: 'rgba(232, 198, 106, 0.04)', overflow: 'hidden',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.md },
  headerEmoji: { fontSize: 24 },
  title: { ...type.body, color: colors.text, fontWeight: '700' },
  subtitle: { ...type.small, color: colors.textDim, marginTop: 2 },
  list: {
    borderTopWidth: 1, borderTopColor: colors.cardBorder,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 8 },
  rowCode: { ...type.body, color: colors.text, fontWeight: '700', letterSpacing: 1.5 },
  rowStatus: { ...type.small, color: colors.textDim, marginTop: 2 },
  rowMsg: { ...type.small, color: colors.gold, fontStyle: 'italic', marginTop: 4, opacity: 0.85 },
  actions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 8, borderRadius: 6, borderWidth: 1, borderColor: colors.cardBorder },
});
