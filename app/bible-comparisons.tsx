/**
 * Bible comparisons screen — list + detail in one page.
 *
 * Surfaces /api/bible-comparisons[/{slug}] data with the QBS silver theme.
 */
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../src/components/Card';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { useApp } from '../src/store/useApp';
import { LockBanner, LockedTile, FREE_PREVIEW_LIMIT } from '../src/iap/gate';
import { colors, spacing, type as ty } from '../src/theme';

const API = process.env.EXPO_PUBLIC_QBS_API_URL || '';

interface Item { slug: string; topic: string; verdict: string }
interface SpecialTileLite { slug: string; title: string; icon: string; accent: string; intro: string; teaser?: string }
interface SpecialTileFull extends SpecialTileLite {
  sections: { heading: string; body: string }[];
  disclaimer?: string;
}
interface Detail extends Item {
  bible_claim: string;
  quran_account: string;
  modern_evidence: string;
  disclaimer?: string;
}

const ACCENTS: Record<string, string> = {
  gold: colors.gold,
  emerald: colors.emerald,
  rose: colors.rose,
  silver: colors.silver,
};

export default function BibleComparisonsScreen() {
  const insets = useSafeAreaInsets();
  const lang = useApp((s) => s.lang);
  const unlocked = useApp((s) => s.unlocked);
  const rtl = lang === 'ar' || lang === 'ur';
  const params = useLocalSearchParams<{ tile?: string }>();
  const [items, setItems] = useState<Item[]>([]);
  const [tiles, setTiles] = useState<SpecialTileLite[]>([]);
  const [disclaimer, setDisclaimer] = useState<string>('');
  const [active, setActive] = useState<Detail | null>(null);
  const [activeTile, setActiveTile] = useState<SpecialTileFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [r1, r2] = await Promise.all([
          fetch(`${API}/api/bible-comparisons/?lang=${lang}`).then((r) => r.json()),
          fetch(`${API}/api/bible-comparisons/special-tiles?lang=${lang}`).then((r) => r.json()),
        ]);
        setItems(r1?.items || []);
        setDisclaimer(r1?.disclaimer || '');
        setTiles(r2?.tiles || []);
        // Deep-link: if ?tile=slug was passed (from home page hero card),
        // auto-open that special tile.
        if (params.tile) {
          try {
            const tr = await fetch(`${API}/api/bible-comparisons/special-tiles/${params.tile}?lang=${lang}`);
            const tj = await tr.json();
            if (tj && tj.slug) setActiveTile(tj);
          } catch {}
        }
      } catch {}
      setLoading(false);
    })();
  }, [lang, params.tile]);

  const openDetail = async (slug: string) => {
    setActive({ slug, topic: '', verdict: '', bible_claim: '', quran_account: '', modern_evidence: '' } as Detail);
    setLoadingDetail(true);
    try {
      const r = await fetch(`${API}/api/bible-comparisons/${slug}?lang=${lang}`);
      const j = await r.json();
      setActive(j);
    } catch {}
    setLoadingDetail(false);
  };

  const openTile = async (slug: string) => {
    try {
      const r = await fetch(`${API}/api/bible-comparisons/special-tiles/${slug}?lang=${lang}`);
      const j = await r.json();
      setActiveTile(j);
    } catch {}
  };

  const title = lang === 'en' ? 'Qurʾān vs Bible' : lang === 'ar' ? 'القرآن مقابل الإنجيل' : 'قرآن بمقابل انجیل';
  const sub = lang === 'en' ? 'Corrective & vindicated accounts' :
              lang === 'ar' ? 'روايات تصحيحيّة وموثّقة' : 'تصحیحی اور تصدیق شدہ روایات';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title={title}
        subtitle={sub}
        showBack={!!active || !!activeTile}
        rightAction={(active || activeTile) ? { icon: 'close', onPress: () => { setActive(null); setActiveTile(null); } } : undefined}
      />
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.silver} /></View>
      ) : activeTile ? (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl, gap: spacing.md }}>
          {(() => {
            // Locale-aware field picker — backend returns the raw tile with
            // title_ar/_ur, intro_ar/_ur, sections[*].heading_ar/_ur, etc.
            // Falls back to the English value when a translation is missing.
            const pickT = (obj: any, field: string): string => {
              if (!obj) return '';
              if (lang === 'ar' || lang === 'ur') {
                const v = obj[`${field}_${lang}`];
                if (typeof v === 'string' && v.length > 0) return v;
              }
              return obj[field] || '';
            };
            return (
              <>
                <Text style={[styles.detailTitle, { textAlign: rtl ? 'right' : 'left' }]}>{pickT(activeTile, 'title')}</Text>
                {pickT(activeTile, 'intro') ? (
                  <Text style={[styles.intro, { textAlign: rtl ? 'right' : 'left' }]}>{pickT(activeTile, 'intro')}</Text>
                ) : null}
                {(activeTile.sections || []).map((sec: any, i: number) => (
                  <Card key={i} accent={ACCENTS[activeTile.accent] || colors.gold}>
                    <Text style={[styles.sectionHead, { color: ACCENTS[activeTile.accent] || colors.gold, textAlign: rtl ? 'right' : 'left' }]}>
                      {pickT(sec, 'heading')}
                    </Text>
                    <Text style={[styles.body, { textAlign: rtl ? 'right' : 'left' }]}>{pickT(sec, 'body')}</Text>
                  </Card>
                ))}
                {pickT(activeTile, 'disclaimer') ? (
                  <Text style={[styles.disclaimer, { textAlign: rtl ? 'right' : 'left' }]}>{pickT(activeTile, 'disclaimer')}</Text>
                ) : null}
              </>
            );
          })()}
        </ScrollView>
      ) : active ? (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl, gap: spacing.md }}>
          {(() => {
            const pickC = (field: string): string => {
              if (!active) return '';
              if (lang === 'ar' || lang === 'ur') {
                const v = (active as any)[`${field}_${lang}`];
                if (typeof v === 'string' && v.length > 0) return v;
              }
              return (active as any)[field] || '';
            };
            return (
              <>
                {loadingDetail ? <ActivityIndicator color={colors.silver} /> : null}
                <Text style={[styles.detailTitle, { textAlign: rtl ? 'right' : 'left' }]}>{pickC('topic')}</Text>
                <Text style={[styles.verdict, { textAlign: rtl ? 'right' : 'left' }]}>{pickC('verdict')}</Text>

                <Card accent={colors.rose}>
                  <View style={[styles.secHeader, rtl && { flexDirection: 'row-reverse' }]}>
                    <Ionicons name="book-outline" size={14} color={colors.rose} />
                    <Text style={[styles.secLabel, { color: colors.rose }]}>{lang === 'en' ? 'BIBLE ACCOUNT' : lang === 'ar' ? 'النصّ الإنجيلي' : 'بائبل بیان'}</Text>
                  </View>
                  <Text style={[styles.body, { textAlign: rtl ? 'right' : 'left' }]}>{pickC('bible_claim')}</Text>
                </Card>

                <Card accent={colors.emerald}>
                  <View style={[styles.secHeader, rtl && { flexDirection: 'row-reverse' }]}>
                    <Ionicons name="sparkles" size={14} color={colors.emerald} />
                    <Text style={[styles.secLabel, { color: colors.emerald }]}>{lang === 'en' ? 'QURʾĀN ACCOUNT' : lang === 'ar' ? 'النصّ القرآني' : 'قرآنی بیان'}</Text>
                  </View>
                  <Text style={[styles.body, { textAlign: rtl ? 'right' : 'left' }]}>{pickC('quran_account')}</Text>
                </Card>

                <Card accent={colors.gold}>
                  <View style={[styles.secHeader, rtl && { flexDirection: 'row-reverse' }]}>
                    <Ionicons name="flask-outline" size={14} color={colors.gold} />
                    <Text style={[styles.secLabel, { color: colors.gold }]}>{lang === 'en' ? 'MODERN EVIDENCE' : lang === 'ar' ? 'الأدلّة الحديثة' : 'جدید شواہد'}</Text>
                  </View>
                  <Text style={[styles.body, { textAlign: rtl ? 'right' : 'left' }]}>{pickC('modern_evidence')}</Text>
                </Card>

                {active.disclaimer ? (
                  <Text style={styles.disclaimer}>{active.disclaimer}</Text>
                ) : null}
              </>
            );
          })()}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl, gap: spacing.sm }}>
          <LockBanner />
          {tiles.length > 0 ? (
            <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
              <Text style={[styles.kicker, { textAlign: rtl ? 'right' : 'left' }]}>
                {lang === 'en' ? 'FEATURED INSIGHTS' : lang === 'ar' ? 'استبصارات مميّزة' : 'خاص بصیرتیں'}
              </Text>
              {tiles.map((tile, ti) => {
                const accent = ACCENTS[tile.accent] || colors.gold;
                // Special tiles all require unlock — they're the premium tease
                const locked = !unlocked && ti >= 0;
                return (
                  <LockedTile
                    key={tile.slug}
                    locked={locked}
                    onPress={() => openTile(tile.slug)}
                  >
                    <Card accent={accent}>
                      <View style={[styles.tileHeader, rtl && { flexDirection: 'row-reverse' }]}>
                        <Ionicons name={tile.icon as any} size={20} color={accent} />
                        <Text style={[styles.tileTitle, { color: accent, flex: 1, textAlign: rtl ? 'right' : 'left' }]}>{tile.title}</Text>
                        <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.silverDim} />
                      </View>
                      <Text style={[styles.tileIntro, { textAlign: rtl ? 'right' : 'left' }]} numberOfLines={3}>{tile.teaser || tile.intro}</Text>
                    </Card>
                  </LockedTile>
                );
              })}
            </View>
          ) : null}

          <Text style={[styles.kicker, { textAlign: rtl ? 'right' : 'left', marginTop: spacing.sm }]}>
            {lang === 'en' ? 'CORRECTIVE & VINDICATED ACCOUNTS' : lang === 'ar' ? 'روايات تصحيحيّة وموثّقة' : 'تصحیحی اور تصدیق شدہ روایات'}
          </Text>
          {disclaimer ? <Text style={styles.disclaimer}>{disclaimer}</Text> : null}
          {items.map((it, idx) => {
            const locked = !unlocked && idx >= FREE_PREVIEW_LIMIT;
            return (
              <LockedTile
                key={it.slug}
                locked={locked}
                onPress={() => openDetail(it.slug)}
              >
                <Card>
                  <Text style={[styles.itemTitle, { textAlign: rtl ? 'right' : 'left' }]}>{it.topic}</Text>
                  <View style={[styles.verdictRow, rtl && { flexDirection: 'row-reverse' }]}>
                    <Ionicons name="chevron-forward" size={14} color={colors.silver} />
                    <Text style={[styles.itemVerdict, { textAlign: rtl ? 'right' : 'left' }]}>{it.verdict}</Text>
                  </View>
                </Card>
              </LockedTile>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  kicker: { ...ty.label, color: colors.silverDim, fontSize: 11, marginBottom: 4 },
  itemTitle: { ...ty.bodyLarge, color: colors.text, fontWeight: '600' },
  itemVerdict: { ...ty.tiny, color: colors.silverDim, marginTop: 4, flex: 1 },
  verdictRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  detailTitle: { ...ty.h2, color: colors.silverHi },
  intro: { ...ty.body, color: colors.textDim, lineHeight: 22, fontStyle: 'italic', marginBottom: spacing.sm },
  verdict: { ...ty.small, color: colors.gold, fontStyle: 'italic', marginTop: -spacing.sm, marginBottom: spacing.sm },
  sectionHead: { ...ty.h3, fontSize: 15, marginBottom: 8, fontWeight: '700' },
  tileHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  tileTitle: { ...ty.bodyLarge, fontWeight: '700' },
  tileIntro: { ...ty.small, color: colors.textDim, lineHeight: 19 },
  secHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  secLabel: { ...ty.label, fontSize: 11 },
  body: { ...ty.body, color: colors.text, lineHeight: 22 },
  disclaimer: { ...ty.tiny, color: colors.textMuted, fontStyle: 'italic', lineHeight: 16, paddingHorizontal: spacing.xs },
});
