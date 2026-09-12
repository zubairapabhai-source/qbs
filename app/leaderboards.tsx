/**
 * QBS Leaderboards — Fastabiqu il-Khayrāt (port).
 *
 * Same shared Treasures backend, QBS-native theme, inline trilingual
 * strings. Registers appKind='qbs' so any Duʿā or Qurʾān event fires
 * against the shared scoreboard.
 */
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radius, type } from '../src/theme';
import { currentLang } from '../src/i18n/strings';
import {
  fetchRoster, fetchTop, fetchRewards, fetchPraiseInbox, sendPraise, registerUsername,
  type LbCategory, type LbTimeframe, type PraiseInboxItem, type PraiseSticker, type RosterEntry, type TopRow,
} from '../src/leaderboards/api';

const TR = {
  ayah_ref: { en: 'Al-Baqarah 2:148', ar: 'البقرة ٢:١٤٨', ur: 'البقرہ ۲:۱۴۸' },
  ayah_trans: { en: '"So compete with one another in good deeds."', ar: '«فَاسْتَبِقُوا الْخَيْرَاتِ»', ur: '«اور نیکیوں میں ایک دوسرے سے آگے بڑھو۔»' },
  gate_title: { en: 'Pick your anonymous name', ar: 'اختر اسمًا مستعارًا', ur: 'اپنا گمنام نام منتخب کریں' },
  gate_body: {
    en: 'Everyone in the leaderboard walks under the name of a great Muslim — from Hazrat Abū Bakr to Malcolm X. Choose yours to begin.',
    ar: 'كل مَن في اللوحة يسير باسم مسلم عظيم — من حضرت أبي بكر إلى مالكوم إكس. اختر اسمك لتبدأ.',
    ur: 'لیڈربورڈ میں ہر شخص کسی عظیم مسلمان کے نام سے چلتا ہے — حضرت ابو بکر سے مالکم ایکس تک۔',
  },
  gate_cta: { en: 'Choose a name →', ar: 'اختر اسمًا ←', ur: 'نام منتخب کریں ←' },
  unclaimed_rewards: { en: 'reward(s) — tap to open', ar: 'مكافأة — اضغط للفتح', ur: 'انعامات — دبا کر کھولیں' },
  praise_title: { en: 'Send a duʿā-sticker to {name}', ar: 'أرسل ملصق دعاء إلى {name}', ur: '{name} کو دعائیہ اسٹیکر بھیجیں' },
  praise_close: { en: 'Close', ar: 'إغلاق', ur: 'بند کریں' },
  sticker_barakallahu_feek: { en: 'Bārakallāhu fīk', ar: 'بارك الله فيك', ur: 'بارک اللّٰہ فیک' },
  sticker_masha_allah: { en: 'Māshāʾ Allāh', ar: 'ما شاء الله', ur: 'ماشاء اللّٰہ' },
  sticker_jazakallah_khair: { en: 'Jazākallāh khayr', ar: 'جزاك الله خيرًا', ur: 'جزاک اللّٰہ خیر' },
  sticker_subhanallah: { en: 'Subḥān Allāh', ar: 'سبحان الله', ur: 'سبحان اللّٰہ' },
  sticker_ameen: { en: 'Āmīn', ar: 'آمين', ur: 'آمین' },
  sticker_scale: { en: 'May your scale be heavy', ar: 'ثقّل الله ميزانك', ur: 'اللّٰہ آپ کا میزان بھاری کرے' },
  praise_received: { en: 'praise received — tap to see', ar: 'ثناء وارد — اضغط لعرضه', ur: 'تعریفیں موصول — دبا کر دیکھیں' },
  inbox_title: { en: 'Praise you received', ar: 'الثناء الذي تلقّيته', ur: 'آپ کو موصول تعریفیں' },
  inbox_empty: { en: 'No praise yet — spread yours to receive back.', ar: 'لا ثناء بعد — انشره لتحصل بالمثل.', ur: 'ابھی تعریف نہیں — پہلے دیں تاکہ ملے۔' },
  from_label: { en: 'From', ar: 'من', ur: 'از' },
  cat_duas: { en: 'Duʿās', ar: 'الأدعية', ur: 'دعائیں' },
  cat_tazkiyah: { en: 'Tazkiyah', ar: 'التزكية', ur: 'تزکیہ' },
  cat_worship: { en: 'Worship', ar: 'العبادة', ur: 'عبادت' },
  cat_quran: { en: 'Qurʾān', ar: 'القرآن', ur: 'قرآن' },
  cat_adhkar: { en: 'Adhkār', ar: 'الأذكار', ur: 'اذکار' },
  cat_salawat: { en: 'Ṣalawāt ﷺ', ar: 'الصلوات ﷺ', ur: 'درود ﷺ' },
  tf_day: { en: 'Today', ar: 'اليوم', ur: 'آج' },
  tf_week: { en: 'This week', ar: 'هذا الأسبوع', ur: 'اس ہفتے' },
  tf_month: { en: 'This month', ar: 'هذا الشهر', ur: 'اس مہینے' },
  tf_all: { en: 'All time', ar: 'الكلّ', ur: 'کل وقت' },
  you_are: { en: 'You are', ar: 'أنت', ur: 'آپ ہیں' },
  rank: { en: 'Rank', ar: 'الترتيب', ur: 'درجہ' },
  score: { en: 'Score', ar: 'النقاط', ur: 'اسکور' },
  empty: {
    en: 'No competitors yet. Be the first — Allāh loves a good deed done consistently.',
    ar: 'لا منافسون بعد. كن الأول — يحبّ الله العمل الصالح المستمرّ.',
    ur: 'ابھی کوئی حریف نہیں۔ سب سے پہلے آپ بنیں — اللہ کو مستقل نیکی محبوب ہے۔',
  },
  champion: { en: 'Champion', ar: 'بطل', ur: 'چیمپیئن' },
  picker_title: { en: 'Choose your name', ar: 'اختر اسمك', ur: 'اپنا نام منتخب کریں' },
  picker_search: { en: 'Search…', ar: 'ابحث…', ur: 'تلاش…' },
  picker_male: { en: 'Brother', ar: 'أخي', ur: 'بھائی' },
  picker_female: { en: 'Sister', ar: 'أختي', ur: 'بہن' },
  picker_confirm: { en: 'Confirm', ar: 'تأكيد', ur: 'تصدیق' },
};

function tr(key: keyof typeof TR): string {
  const lang = currentLang() as 'en' | 'ar' | 'ur';
  return TR[key]?.[lang] || TR[key]?.en || '';
}

const CATEGORIES: { key: LbCategory; icon: keyof typeof Ionicons.glyphMap; labelKey: keyof typeof TR }[] = [
  { key: 'duas', icon: 'hand-right-outline', labelKey: 'cat_duas' },
  { key: 'quran', icon: 'book-outline', labelKey: 'cat_quran' },
  { key: 'salawat', icon: 'heart-outline', labelKey: 'cat_salawat' },
  { key: 'tazkiyah', icon: 'sparkles-outline', labelKey: 'cat_tazkiyah' },
  { key: 'worship', icon: 'moon-outline', labelKey: 'cat_worship' },
  { key: 'adhkar', icon: 'flower-outline', labelKey: 'cat_adhkar' },
];
const TIMEFRAMES: { key: LbTimeframe; labelKey: keyof typeof TR }[] = [
  { key: 'day', labelKey: 'tf_day' }, { key: 'week', labelKey: 'tf_week' },
  { key: 'month', labelKey: 'tf_month' }, { key: 'all', labelKey: 'tf_all' },
];

const PRAISE_STICKERS: { key: PraiseSticker; emoji: string; labelKey: keyof typeof TR }[] = [
  { key: 'barakallahu_feek', emoji: '🌸', labelKey: 'sticker_barakallahu_feek' },
  { key: 'masha_allah', emoji: '✨', labelKey: 'sticker_masha_allah' },
  { key: 'jazakallah_khair', emoji: '🕊️', labelKey: 'sticker_jazakallah_khair' },
  { key: 'subhanallah', emoji: '🌙', labelKey: 'sticker_subhanallah' },
  { key: 'ameen', emoji: '🤲', labelKey: 'sticker_ameen' },
  { key: 'may_your_scale_be_heavy', emoji: '⚖️', labelKey: 'sticker_scale' },
];

const LOCAL_KEY = '@qbs:lb_username.v1';
interface LocalUser { slug: string; display: string; bio: string; }

export default function QbsLeaderboardsScreen() {
  const router = useRouter();
  const [user, setUser] = useState<LocalUser | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [cat, setCat] = useState<LbCategory>('duas');
  const [tf, setTf] = useState<LbTimeframe>('week');
  const [rows, setRows] = useState<TopRow[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myScore, setMyScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [unclaimed, setUnclaimed] = useState(0);
  const [praiseTarget, setPraiseTarget] = useState<TopRow | null>(null);
  const [praiseInbox, setPraiseInbox] = useState<PraiseInboxItem[]>([]);
  const [inboxOpen, setInboxOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(LOCAL_KEY);
      if (raw) try { setUser(JSON.parse(raw)); } catch {}
      setHydrated(true);
    })();
  }, []);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await fetchTop(cat, tf);
      setRows(data.rows); setMyRank(data.my_rank); setMyScore(data.my_score);
    } catch { setRows([]); }
    setLoading(false);
    fetchRewards().then((items) => {
      setUnclaimed(items.filter((r) => !r.claimed).length);
    }).catch(() => setUnclaimed(0));
    fetchPraiseInbox().then(setPraiseInbox).catch(() => setPraiseInbox([]));
  }, [cat, tf, user]);

  useEffect(() => { if (hydrated) load(); }, [hydrated, load]);

  const onRegistered = async (u: LocalUser) => {
    await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(u));
    setUser(u); setPickerOpen(false); load();
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Fastabiqu il-Khayrāt', headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.text }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.ayah}>
          <Text style={styles.ayahAr}>فَاسْتَبِقُوا الْخَيْرَاتِ</Text>
          <Text style={styles.ayahRef}>{tr('ayah_ref')}</Text>
          <Text style={styles.ayahTrans}>{tr('ayah_trans')}</Text>
        </View>

        {!user ? (
          <Pressable onPress={() => setPickerOpen(true)} style={styles.gate}>
            <Ionicons name="person-add-outline" size={26} color={colors.gold} />
            <Text style={styles.gateTitle}>{tr('gate_title')}</Text>
            <Text style={styles.gateBody}>{tr('gate_body')}</Text>
            <View style={styles.gateCta}><Text style={styles.gateCtaText}>{tr('gate_cta')}</Text></View>
          </Pressable>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
              {CATEGORIES.map((c) => {
                const active = c.key === cat;
                return (
                  <Pressable key={c.key} onPress={() => setCat(c.key)} style={[styles.catPill, active && styles.catPillActive]}>
                    <Ionicons name={c.icon} size={14} color={active ? colors.bg : colors.gold} />
                    <Text style={[styles.catPillText, active && styles.catPillTextActive]}>{tr(c.labelKey)}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={styles.tfRow}>
              {TIMEFRAMES.map((f) => {
                const active = f.key === tf;
                return (
                  <Pressable key={f.key} onPress={() => setTf(f.key)} style={[styles.tfTab, active && styles.tfTabActive]}>
                    <Text style={[styles.tfTabText, active && styles.tfTabTextActive]}>{tr(f.labelKey)}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.myCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.myLabel}>{tr('you_are')}</Text>
                <Text style={styles.myName}>{user.display}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.myLabel}>{tr('rank')}</Text>
                <Text style={styles.myScore}>{myRank ? `#${myRank}` : '—'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', marginLeft: spacing.md }}>
                <Text style={styles.myLabel}>{tr('score')}</Text>
                <Text style={styles.myScore}>{myScore ?? 0}</Text>
              </View>
            </View>
            {unclaimed > 0 && (
              <Pressable onPress={() => router.push('/rewards' as any)} style={styles.inboxPill}>
                <Text style={styles.inboxPillText}>
                  🎁 {unclaimed} {tr('unclaimed_rewards')}
                </Text>
              </Pressable>
            )}
            {praiseInbox.length > 0 && (
              <Pressable onPress={() => setInboxOpen(true)} style={styles.praiseInboxPill}>
                <Text style={styles.inboxPillText}>
                  💌 {praiseInbox.length} {tr('praise_received')}
                </Text>
              </Pressable>
            )}
            {loading ? <ActivityIndicator color={colors.gold} style={{ marginTop: spacing.xl }} /> :
             rows.length === 0 ? <Text style={styles.empty}>{tr('empty')}</Text> :
             rows.map((r) => (
              <View key={r.username_slug} style={[
                styles.row,
                r.username_slug === user.slug && styles.rowMe,
                r.is_champion && styles.rowChampion,
              ]}>
                <View style={styles.rankCol}>
                  <Text style={styles.rankNum}>#{r.rank}</Text>
                  {r.is_champion && <Text style={{ fontSize: 14 }}>👑</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Text style={styles.rowName}>{r.display}</Text>
                    {r.is_champion && <Text style={styles.champBadge}>{tr('champion')}</Text>}
                  </View>
                  <Text style={styles.rowBio} numberOfLines={1}>{r.bio_en}</Text>
                </View>
                <Text style={styles.rowScore}>{r.score}</Text>
                {r.rank <= 10 && r.username_slug !== user.slug && (
                  <Pressable onPress={() => setPraiseTarget(r)} hitSlop={10} style={{ marginLeft: 6 }}>
                    <Ionicons name="heart-outline" size={20} color={colors.gold} />
                  </Pressable>
                )}
              </View>
             ))}
          </>
        )}
      </ScrollView>

      <UsernamePickerModal visible={pickerOpen} onClose={() => setPickerOpen(false)} onRegistered={onRegistered} />

      {/* Praise sticker sheet */}
      <Modal
        visible={!!praiseTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setPraiseTarget(null)}
      >
        <Pressable style={styles.praiseBackdrop} onPress={() => setPraiseTarget(null)}>
          <Pressable style={styles.praiseCard} onPress={(e) => (e as any).stopPropagation?.()}>
            <Text style={styles.praiseTitle}>
              {tr('praise_title').replace('{name}', praiseTarget?.display ?? '')}
            </Text>
            <View style={styles.praiseGrid}>
              {PRAISE_STICKERS.map((s) => (
                <Pressable
                  key={s.key}
                  onPress={async () => {
                    const target = praiseTarget;
                    setPraiseTarget(null);
                    if (target) {
                      try { await sendPraise(target.username_slug, s.key); } catch {}
                    }
                  }}
                  style={styles.praiseSticker}
                >
                  <Text style={styles.praiseEmoji}>{s.emoji}</Text>
                  <Text style={styles.praiseLabel}>{tr(s.labelKey)}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={() => setPraiseTarget(null)} style={styles.praiseClose}>
              <Text style={styles.praiseCloseText}>{tr('praise_close')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Praise inbox sheet */}
      <Modal
        visible={inboxOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setInboxOpen(false)}
      >
        <Pressable style={styles.praiseBackdrop} onPress={() => setInboxOpen(false)}>
          <Pressable style={styles.praiseCard} onPress={(e) => (e as any).stopPropagation?.()}>
            <Text style={styles.praiseTitle}>{tr('inbox_title')}</Text>
            {praiseInbox.length === 0 ? (
              <Text style={{ color: colors.textDim, textAlign: 'center', paddingVertical: spacing.md }}>
                {tr('inbox_empty')}
              </Text>
            ) : (
              <ScrollView style={{ maxHeight: 380 }}>
                {praiseInbox.map((p) => {
                  const s = PRAISE_STICKERS.find((x) => x.key === p.sticker);
                  return (
                    <View key={p.id} style={styles.inboxRow}>
                      <Text style={styles.inboxEmoji}>{s?.emoji ?? '💌'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inboxSticker}>{s ? tr(s.labelKey) : p.sticker}</Text>
                        <Text style={styles.inboxSender}>
                          {tr('from_label')}: {p.sender_display}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
            <Pressable onPress={() => setInboxOpen(false)} style={styles.praiseClose}>
              <Text style={styles.praiseCloseText}>{tr('praise_close')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function UsernamePickerModal({ visible, onClose, onRegistered }: { visible: boolean; onClose: () => void; onRegistered: (u: LocalUser) => void }) {
  const insets = useSafeAreaInsets();
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [query, setQuery] = useState('');
  const [pick, setPick] = useState<RosterEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    fetchRoster(gender).then(setRoster).catch(() => setRoster([]));
  }, [visible, gender]);

  const filtered = query.trim()
    ? roster.filter(u => u.display.toLowerCase().includes(query.trim().toLowerCase()) ||
                         u.bio_en.toLowerCase().includes(query.trim().toLowerCase()))
    : roster;

  const doConfirm = async (r: RosterEntry) => {
    setSaving(true);
    try {
      const res = await registerUsername(r.slug);
      if (res.ok) {
        onRegistered({ slug: res.username_slug, display: res.display, bio: res.bio_en });
      } else if (res.conflict) {
        setBanner(`That name was just taken — meet ${res.display} instead.`);
        setPick({ slug: res.username_slug, display: res.display, bio_en: res.bio_en, gender, category: r.category });
      }
    } finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <View style={styles.grabber} />
          <Text style={styles.modalTitle}>{tr('picker_title')}</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.sm }}>
            <Pressable onPress={() => setGender('male')} style={[styles.catPill, gender === 'male' && styles.catPillActive]}>
              <Text style={[styles.catPillText, gender === 'male' && styles.catPillTextActive]}>{tr('picker_male')}</Text>
            </Pressable>
            <Pressable onPress={() => setGender('female')} style={[styles.catPill, gender === 'female' && styles.catPillActive]}>
              <Text style={[styles.catPillText, gender === 'female' && styles.catPillTextActive]}>{tr('picker_female')}</Text>
            </Pressable>
          </View>
          <TextInput value={query} onChangeText={setQuery} placeholder={tr('picker_search')} placeholderTextColor={colors.textMuted} style={styles.search} />
          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
            {filtered.map(entry => (
              <Pressable key={entry.slug} onPress={() => setPick(entry)} style={styles.pickRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickName}>{entry.display}</Text>
                  <Text style={styles.pickBio}>{entry.bio_en}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
          {pick && (
            <View style={styles.confirmBar}>
              {banner && <Text style={styles.banner}>{banner}</Text>}
              <Text style={styles.pickName}>{pick.display}</Text>
              <Text style={styles.pickBio}>{pick.bio_en}</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                <Pressable onPress={() => { setPick(null); setBanner(null); }} style={[styles.confirmBtn, styles.confirmCancel]}>
                  <Text style={{ color: colors.text }}>Back</Text>
                </Pressable>
                <Pressable onPress={() => doConfirm(pick)} disabled={saving} style={[styles.confirmBtn, styles.confirmOk]}>
                  {saving ? <ActivityIndicator color={colors.bg} /> :
                    <Text style={{ color: colors.bg, fontWeight: '700' }}>{tr('picker_confirm')}</Text>}
                </Pressable>
              </View>
            </View>
          )}
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.textDim} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.md, paddingBottom: 60 },

  ayah: {
    alignItems: 'center', padding: spacing.md, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.cardBorder,
    backgroundColor: colors.card, marginBottom: spacing.md,
  },
  ayahAr: { fontSize: 26, color: colors.gold, textAlign: 'center' },
  ayahRef: { ...type.micro, marginTop: 4, color: colors.textDim },
  ayahTrans: { ...type.small, color: colors.textDim, textAlign: 'center', marginTop: spacing.sm, fontStyle: 'italic', lineHeight: 20 },

  gate: {
    alignItems: 'center', padding: spacing.lg, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.gold, backgroundColor: colors.card, gap: spacing.sm,
  },
  gateTitle: { ...type.h2, color: colors.text, textAlign: 'center' },
  gateBody: { ...type.body, color: colors.textDim, textAlign: 'center', lineHeight: 22 },
  gateCta: {
    marginTop: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: 10,
    borderRadius: radius.pill, backgroundColor: colors.gold,
  },
  gateCtaText: { color: colors.bg, fontWeight: '700', fontSize: 15 },

  catRow: { paddingVertical: spacing.sm, gap: spacing.sm },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: 8,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  catPillActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  catPillText: { fontSize: 13, color: colors.text, fontWeight: '600' },
  catPillTextActive: { color: colors.bg, fontWeight: '700' },

  tfRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs, marginBottom: spacing.md },
  tfTab: {
    flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: radius.sm,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.card,
  },
  tfTabActive: { borderColor: colors.gold },
  tfTabText: { fontSize: 13, color: colors.textDim, fontWeight: '600' },
  tfTabTextActive: { color: colors.gold, fontWeight: '700' },

  myCard: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    borderRadius: radius.md, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.cardBorder, marginBottom: spacing.md,
  },
  myLabel: { fontSize: 10, color: colors.textMuted, letterSpacing: 1 },
  myName: { ...type.h3, color: colors.text, marginTop: 2 },
  myScore: { fontSize: 22, color: colors.gold, fontWeight: '700', marginTop: 2 },

  inboxPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md, paddingVertical: 8,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.gold,
    backgroundColor: colors.card,
    marginBottom: spacing.md,
  },
  inboxPillText: { fontSize: 13, color: colors.text, fontWeight: '700' },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.sm, borderRadius: radius.md,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.card, marginBottom: 6,
  },
  rowMe: { borderColor: colors.gold, backgroundColor: 'rgba(232, 198, 106, 0.10)' },
  rowChampion: { borderColor: colors.gold, shadowColor: colors.gold, shadowOpacity: 0.5, shadowRadius: 10, elevation: 6 },
  rankCol: { width: 44, alignItems: 'center' },
  rankNum: { color: colors.textDim, fontWeight: '700' },
  rowName: { color: colors.text, fontWeight: '600', fontSize: 15 },
  rowBio: { color: colors.textMuted, fontSize: 12, marginTop: 1 },
  rowScore: { color: colors.gold, fontWeight: '700', minWidth: 40, textAlign: 'right' },
  champBadge: { color: colors.bg, backgroundColor: colors.gold, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  empty: { color: colors.textDim, textAlign: 'center', padding: spacing.lg, fontStyle: 'italic', lineHeight: 22 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.bgElevated, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '90%', paddingTop: spacing.sm },
  grabber: { alignSelf: 'center', width: 44, height: 4, borderRadius: 2, backgroundColor: colors.textMuted, opacity: 0.5, marginBottom: spacing.md },
  modalTitle: { ...type.h2, color: colors.text, textAlign: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  search: {
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    color: colors.text, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 10,
  },
  pickRow: {
    flexDirection: 'row', paddingHorizontal: spacing.lg, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  pickName: { ...type.body, color: colors.text, fontWeight: '600' },
  pickBio: { ...type.small, color: colors.textMuted, marginTop: 2 },
  confirmBar: {
    borderTopWidth: 1, borderColor: colors.cardBorder,
    padding: spacing.lg, backgroundColor: colors.card,
  },
  banner: { color: colors.gold, fontSize: 13, marginBottom: spacing.sm, fontStyle: 'italic' },
  confirmBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: radius.md },
  confirmCancel: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  confirmOk: { backgroundColor: colors.gold },
  closeBtn: { position: 'absolute', top: spacing.md, right: spacing.md },

  // Praise sheet
  praiseBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: spacing.md },
  praiseCard: { width: '100%', maxWidth: 400, backgroundColor: colors.bgElevated, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.lg },
  praiseTitle: { ...type.h3, color: colors.text, textAlign: 'center', marginBottom: spacing.md },
  praiseGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.sm },
  praiseSticker: { width: '31%', aspectRatio: 1, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', padding: 6 },
  praiseEmoji: { fontSize: 26, marginBottom: 4 },
  praiseLabel: { fontSize: 10, color: colors.text, textAlign: 'center', fontWeight: '600' },
  praiseClose: { marginTop: spacing.md, alignSelf: 'center', paddingHorizontal: spacing.lg, paddingVertical: 10 },
  praiseCloseText: { color: colors.textMuted, fontWeight: '600' },

  // Praise inbox pill + rows
  praiseInboxPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md, paddingVertical: 8,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.cardBorder,
    backgroundColor: colors.card, marginBottom: spacing.md,
  },
  inboxRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  inboxEmoji: { fontSize: 24 },
  inboxSticker: { ...type.body, color: colors.text, fontWeight: '600' },
  inboxSender: { ...type.small, color: colors.textMuted, marginTop: 2 },
});
