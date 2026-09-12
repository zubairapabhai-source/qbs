/**
 * QBS Rewards Inbox — Fastabiqu il-Khayrāt.
 *
 * Mirrors Treasures/Dreams: 3 reward kinds (chest, discovery, crown).
 * Payload IS the content — zero fetches after mint (offline-safe).
 *
 * QBS doesn't own an /article/[slug] route yet, so tapping a chest just
 * marks it read; the article title is shown in the card so the user
 * knows the prize (unlockable inside Treasures when installed).
 */
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, type } from '../src/theme';
import { currentLang } from '../src/i18n/strings';
import { fetchRewards, claimReward, type RewardItem } from '../src/leaderboards/api';

const TR = {
  title: { en: 'My Rewards', ar: 'مكافآتي', ur: 'میرے انعامات' },
  header_pending: { en: '{n} unopened — tap each to claim.', ar: '{n} غير مفتوحة — اضغط لفتحها.', ur: '{n} کھلے نہیں — دبا کر کھولیں۔' },
  header_all_claimed: { en: 'All rewards opened. Māshāʾ Allāh.', ar: 'كل المكافآت مفتوحة. ما شاء الله.', ur: 'تمام انعامات کھولے گئے۔ ماشاء اللہ۔' },
  header_empty: { en: 'Compete in the good race to earn your first reward.', ar: 'تنافس في السباق الحسن لتكسب أوّل مكافأة.', ur: 'نیکی کی دوڑ میں شریک ہو کر پہلا انعام حاصل کریں۔' },
  empty_title: { en: 'No rewards yet', ar: 'لا مكافآت بعد', ur: 'ابھی کوئی انعام نہیں' },
  empty_body: { en: 'Top-3 each week receive a Treasure Chest + Qurʾānic scientific-discovery. Weekly champion gets 👑.', ar: 'أفضل 3 يحصلون على كنز + معجزة قرآنية. البطل يحصل أيضًا على 👑.', ur: 'ہر ہفتے ٹاپ 3 کو خزانہ + قرآنی سائنسی معجزہ ملتا ہے۔ چیمپیئن کو 👑۔' },
  empty_cta: { en: 'Enter the good race', ar: 'ادخل السباق للخير', ur: 'دوڑ میں شامل ہوں' },
  kind_discovery: { en: 'Qurʾānic Scientific Discovery', ar: 'معجزة علمية قرآنية', ur: 'قرآنی سائنسی معجزہ' },
  kind_chest: { en: 'Treasure Chest of Wisdom', ar: 'كنز من الحكمة', ur: 'دانائی کا خزانہ' },
  kind_crown: { en: 'Champion of the Week', ar: 'بطل الأسبوع', ur: 'ہفتے کا چیمپیئن' },
  new: { en: 'NEW', ar: 'جديد', ur: 'نیا' },
  chest_body: { en: 'A premium wisdom article awaits: {slug}', ar: 'مقالة حكمة مميّزة بانتظارك: {slug}', ur: 'ایک پریمیم مضمون منتظر ہے: {slug}' },
  crown_body: {
    en: 'You were last week\'s champion of {category}. Your name wears the crown across every leaderboard.',
    ar: 'كنت بطل الأسبوع الماضي في {category}. اسمك يرتدي التاج في كل لوحات الصدارة.',
    ur: 'آپ گزشتہ ہفتے {category} کے چیمپیئن تھے۔ آپ کا نام ہر لیڈربورڈ پر تاج پہنے ہے۔',
  },
  claim: { en: 'Claim', ar: 'استلم', ur: 'وصول کریں' },
  mark_read: { en: 'Mark as read', ar: 'حدد كمقروء', ur: 'پڑھا ہوا نشان لگائیں' },
  awarded_for: { en: 'Awarded for', ar: 'مُنِحَت في', ur: 'دیا گیا برائے' },
  week: { en: 'week', ar: 'أسبوع', ur: 'ہفتہ' },
  rank: { en: 'rank', ar: 'الترتيب', ur: 'درجہ' },
  cat_duas: { en: 'Duʿās', ar: 'الأدعية', ur: 'دعائیں' },
  cat_tazkiyah: { en: 'Tazkiyah', ar: 'التزكية', ur: 'تزکیہ' },
  cat_worship: { en: 'Worship', ar: 'العبادة', ur: 'عبادت' },
  cat_quran: { en: 'Qurʾān', ar: 'القرآن', ur: 'قرآن' },
  cat_adhkar: { en: 'Adhkār', ar: 'الأذكار', ur: 'اذکار' },
  cat_salawat: { en: 'Ṣalawāt ﷺ', ar: 'الصلوات ﷺ', ur: 'درود ﷺ' },
};
function tr(k: keyof typeof TR): string { const l = currentLang() as 'en'|'ar'|'ur'; return TR[k]?.[l] || TR[k]?.en || ''; }
function catLabel(c: string): string {
  const map: Record<string, keyof typeof TR> = {
    duas: 'cat_duas', tazkiyah: 'cat_tazkiyah', worship: 'cat_worship',
    quran: 'cat_quran', adhkar: 'cat_adhkar', salawat: 'cat_salawat',
  };
  return map[c] ? tr(map[c]) : c;
}

export default function QbsRewardsScreen() {
  const router = useRouter();
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { setRewards(await fetchRewards()); } catch { setRewards([]); }
  };
  useEffect(() => { (async () => { setLoading(true); await load(); setLoading(false); })(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const onClaim = async (r: RewardItem) => {
    try {
      const res = await claimReward(r.id);
      if (res?.ok) {
        setRewards((prev) => prev.map((x) => (x.id === r.id ? { ...x, claimed: true } : x)));
      }
    } catch { /* keep unclaimed on failure */ }
  };

  const unclaimed = rewards.filter((r) => !r.claimed).length;
  const headerSub = rewards.length === 0
    ? tr('header_empty')
    : unclaimed > 0
      ? tr('header_pending').replace('{n}', String(unclaimed))
      : tr('header_all_claimed');

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: tr('title'), headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.text }} />
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}>
        {/* Header strip */}
        <View style={styles.headerCard}>
          <Ionicons name="ribbon-outline" size={22} color={colors.gold} />
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{tr('title')}</Text>
            <Text style={styles.headerSub}>{headerSub}</Text>
          </View>
        </View>

        {loading ? <ActivityIndicator color={colors.gold} style={{ marginTop: spacing.xl }} /> :
         rewards.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{tr('empty_title')}</Text>
            <Text style={styles.emptyBody}>{tr('empty_body')}</Text>
            <Pressable onPress={() => router.push('/leaderboards' as any)} style={styles.emptyCta}>
              <Text style={{ color: colors.bg, fontWeight: '700' }}>{tr('empty_cta')}</Text>
            </Pressable>
          </View>
         ) : rewards.map(r => {
          if (r.kind === 'scientific_discovery') {
            return (
              <View key={r.id} style={[styles.card, r.claimed && styles.cardClaimed]}>
                <View style={styles.head}>
                  <Ionicons name="planet-outline" size={20} color={colors.gold} />
                  <Text style={styles.kind}>{tr('kind_discovery')}</Text>
                  {!r.claimed && <Text style={styles.newBadge}>{tr('new')}</Text>}
                </View>
                <Text style={styles.title}>{r.payload?.title}</Text>
                <Text style={styles.ref}>{r.payload?.ref}</Text>
                <Text style={styles.body}>{r.payload?.science}</Text>
                <Text style={styles.meta}>
                  {tr('awarded_for')}: {catLabel(r.category)} · {tr('week')} {r.week_key}
                </Text>
                {!r.claimed && (
                  <Pressable onPress={() => onClaim(r)} style={styles.claimBtn}>
                    <Ionicons name="bookmark-outline" size={16} color={colors.bg} />
                    <Text style={styles.claimText}>{tr('mark_read')}</Text>
                  </Pressable>
                )}
              </View>
            );
          }
          if (r.kind === 'treasure_chest') {
            return (
              <View key={r.id} style={[styles.card, r.claimed && styles.cardClaimed]}>
                <View style={styles.head}>
                  <Ionicons name="gift-outline" size={20} color={colors.gold} />
                  <Text style={styles.kind}>{tr('kind_chest')}</Text>
                  {!r.claimed && <Text style={styles.newBadge}>{tr('new')}</Text>}
                </View>
                <Text style={styles.body}>{tr('chest_body').replace('{slug}', r.payload?.article_slug || '')}</Text>
                <Text style={styles.meta}>
                  {tr('awarded_for')}: {catLabel(r.category)} · {tr('rank')} #{r.payload?.rank || '?'}
                </Text>
                {!r.claimed && (
                  <Pressable onPress={() => onClaim(r)} style={styles.claimBtn}>
                    <Ionicons name="lock-open-outline" size={16} color={colors.bg} />
                    <Text style={styles.claimText}>{tr('claim')}</Text>
                  </Pressable>
                )}
              </View>
            );
          }
          if (r.kind === 'champion_crown') {
            return (
              <View key={r.id} style={[styles.card, styles.crownCard]}>
                <View style={styles.head}>
                  <Text style={{ fontSize: 22 }}>👑</Text>
                  <Text style={styles.kind}>{tr('kind_crown')}</Text>
                </View>
                <Text style={styles.body}>{tr('crown_body').replace('{category}', catLabel(r.category))}</Text>
              </View>
            );
          }
          return null;
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    flexDirection: 'row', gap: spacing.md, alignItems: 'center',
    padding: spacing.md, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.cardBorder,
    backgroundColor: colors.card, marginBottom: spacing.md,
  },
  headerTitle: { ...type.body, fontWeight: '700', color: colors.text },
  headerSub: { ...type.small, color: colors.textDim, marginTop: 2, lineHeight: 18 },

  card: { borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card },
  cardClaimed: { opacity: 0.65 },
  crownCard: { backgroundColor: 'rgba(232, 198, 106, 0.12)', borderColor: colors.gold },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  kind: { fontSize: 11, color: colors.gold, letterSpacing: 1.4, fontWeight: '700', flex: 1 },
  newBadge: { fontSize: 10, color: colors.bg, backgroundColor: colors.gold, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontWeight: '800' },
  title: { ...type.h2, color: colors.text, marginBottom: 2 },
  ref: { ...type.caption, color: colors.gold, marginBottom: spacing.sm, fontWeight: '600' },
  body: { ...type.body, color: colors.text, lineHeight: 22 },
  meta: { ...type.small, color: colors.textMuted, marginTop: spacing.sm, fontStyle: 'italic' },
  claimBtn: {
    marginTop: spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.gold, paddingVertical: 10, borderRadius: radius.md, minHeight: 44,
  },
  claimText: { color: colors.bg, fontWeight: '700', fontSize: 15 },
  empty: { alignItems: 'center', padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, gap: spacing.sm, marginTop: spacing.md },
  emptyTitle: { ...type.h2, color: colors.text, textAlign: 'center' },
  emptyBody: { ...type.body, color: colors.textDim, textAlign: 'center', lineHeight: 22 },
  emptyCta: { marginTop: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.gold },
});
