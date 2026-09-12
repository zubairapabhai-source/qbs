/**
 * TopGiftersCard — anonymous monthly leaderboard of the most
 * generous Divine Series gift-buyers. Only rendered when at
 * least one gift has been CLAIMED this month.
 *
 * Buyer identities are reduced to a 4-char suffix hash so the
 * board is celebratory without doxxing.
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, type } from '../theme';
import { DUAS_BASE } from '../duasWallApi';

interface TopRow {
  buyer_short: string;
  buyer_app: 'treasures' | 'dreams' | 'qbs' | null;
  claimed: number;
  last_gift_at: string | null;
}

const APP_EMOJI: Record<string, string> = {
  treasures: '📖',
  dreams: '🌙',
  qbs: '✨',
};

const MEDAL = ['🥇', '🥈', '🥉'];

export function TopGiftersCard() {
  const [top, setTop] = useState<TopRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 6000);
        const res = await fetch(`${DUAS_BASE}/api/passport/gifts/top?window=month&limit=5`, { signal: ctrl.signal });
        clearTimeout(t);
        if (!res.ok) return;
        const body = await res.json();
        if (!cancelled) setTop(body.top || []);
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!top.length) return null;

  return (
    <View style={styles.card} testID="top-gifters-card">
      <View style={styles.headerRow}>
        <Ionicons name="gift" size={13} color={colors.gold} />
        <Text style={styles.kicker}>TOP GIFTERS · THIS MONTH</Text>
      </View>

      <View style={styles.list}>
        {top.map((row, i) => {
          const isTop3 = i < 3;
          const medal = isTop3 ? MEDAL[i] : `${i + 1}.`;
          const appEmoji = APP_EMOJI[row.buyer_app || ''] || '·';
          return (
            <View key={`${row.buyer_short}-${i}`} style={styles.row}>
              <Text style={styles.medal}>{medal}</Text>
              <Text style={styles.handle}>
                <Text style={styles.appEmoji}>{appEmoji} </Text>
                #{row.buyer_short}
              </Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.count}>
                {row.claimed} {row.claimed === 1 ? 'gift' : 'gifts'}
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.foot}>
        May Allāh accept every gift. Anonymous ranking · resets each month.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorderHi,
    backgroundColor: 'rgba(232, 198, 106, 0.05)',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  kicker: { ...type.micro, color: colors.gold, letterSpacing: 2 },
  list: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  medal: { fontSize: 16, width: 24, textAlign: 'center' },
  appEmoji: { fontSize: 13 },
  handle: { ...type.body, color: colors.text, fontWeight: '700', letterSpacing: 1 },
  count: { ...type.small, color: colors.gold, fontWeight: '700' },
  foot: { ...type.small, color: colors.textDim, marginTop: spacing.sm, textAlign: 'center', fontStyle: 'italic', opacity: 0.8 },
});
