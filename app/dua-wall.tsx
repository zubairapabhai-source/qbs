/**
 * Duā Request Wall — QBS.
 *
 * Anonymous, category-only wall shared across all 3 Divine Series apps.
 * See /app/frontend/app/dua-wall.tsx for design rationale (kept in sync).
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform,
  Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { useApp } from '../src/store/useApp';
import { colors, radius, spacing, type as ty } from '../src/theme';
import {
  wallApi, CATEGORY_LABELS, REACTION_LABELS,
  type WallDua, type DuaCategory, type DuaReaction, type WallStats,
} from '../src/duasWallApi';

const CATS: DuaCategory[] = [
  'family', 'health', 'guidance', 'forgiveness',
  'provision', 'protection', 'ummah', 'deceased', 'personal',
];
const REACTIONS: DuaReaction[] = [
  'ameen', 'may_allah_answer', 'in_sha_allah', 'sending_dua', 'allah_hafiz',
];

export default function DuaWallScreen() {
  const lang = useApp((s) => s.lang);
  const rtl = lang === 'ar' || lang === 'ur';
  const [items, setItems] = useState<WallDua[]>([]);
  const [stats, setStats] = useState<WallStats | null>(null);
  const [filter, setFilter] = useState<DuaCategory | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showComposer, setShowComposer] = useState(false);

  const L = <T,>(en: T, ar: T, ur: T): T =>
    lang === 'ar' ? ar : lang === 'ur' ? ur : en;

  const load = useCallback(async () => {
    try {
      const [list, s] = await Promise.all([
        wallApi.list(filter === 'all' ? undefined : filter, 40, 0),
        wallApi.stats(),
      ]);
      setItems(list.items);
      setStats(s);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const title = L('Duā Wall', 'حائط الدعاء', 'دعا وال');
  const sub = L('Anonymous, Shariyah-filtered', 'مجهول، مراجَع شرعيًّا', 'گمنام، شرعی فلٹر شدہ');

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title={title} subtitle={sub} />
      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        onRefresh={() => { setRefreshing(true); load(); }}
        refreshing={refreshing}
        ListHeaderComponent={
          <View>
            <View style={styles.hero}>
              <Text style={[styles.heroBody, { textAlign: rtl ? 'right' : 'left' }]}>
                {L(
                  'Post a short, anonymous duʿā. Every reader who taps 🤲 makes one for you — a silent chain of mercy across the ummah.',
                  'انشر دعاءً قصيرًا مجهولاً. كل من يضغط 🤲 يدعو لك — سلسلة رحمة صامتة.',
                  'ایک مختصر گمنام دعا شیئر کریں۔ ہر قاری جو 🤲 چھوئے آپ کے لیے دعا کرتا ہے۔'
                )}
              </Text>
              {stats ? (
                <View style={styles.statsRow}>
                  <StatChip icon="rose" count={stats.total_duas} label={L('duʿās', 'دعاء', 'دعائیں')} />
                  <StatChip icon="heart" count={stats.total_blessings} label={L('🤲 sent', '🤲 مرسلة', '🤲 بھیجی گئیں')} />
                  <StatChip icon="time" count={stats.posted_24h} label={L('today', 'اليوم', 'آج')} />
                </View>
              ) : null}
              <Pressable
                onPress={() => setShowComposer((v) => !v)}
                style={({ pressed }) => [styles.composeBtn, pressed && { opacity: 0.85 }]}
                testID="dua-wall-compose-toggle"
              >
                <Ionicons name={showComposer ? 'close-circle' : 'add-circle'} size={20} color={colors.bg} />
                <Text style={styles.composeBtnText}>
                  {showComposer
                    ? L('Cancel', 'إلغاء', 'منسوخ')
                    : L('Post a duʿā (1 per day)', 'انشر دعاءً (١ يوميًّا)', 'دعا شیئر کریں (روزانہ ۱)')}
                </Text>
              </Pressable>
            </View>

            {showComposer ? (
              <Composer onPosted={() => { setShowComposer(false); setRefreshing(true); load(); }} L={L} lang={lang as any} />
            ) : null}

            <View style={styles.filterRow}>
              <Chip active={filter === 'all'} onPress={() => setFilter('all')} label={L('All', 'الكل', 'سب')} />
              {CATS.map((c) => (
                <Chip
                  key={c}
                  active={filter === c}
                  onPress={() => setFilter(c)}
                  icon={CATEGORY_LABELS[c].icon}
                  label={CATEGORY_LABELS[c][lang as 'en' | 'ar' | 'ur']}
                />
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <DuaCard
            dua={item}
            lang={lang as 'en' | 'ar' | 'ur'}
            onUpdate={(updated) => setItems((prev) => prev.map((x) => x.id === updated.id ? updated : x))}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyWrap}>
              <ActivityIndicator color={colors.gold} />
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <Ionicons name="rose-outline" size={40} color={colors.textDim} />
              <Text style={styles.emptyTitle}>{L('The wall is quiet.', 'الحائط هادئ.', 'وال خاموش ہے۔')}</Text>
              <Text style={styles.emptyBody}>
                {L('Be the first to share a duʿā tonight.',
                   'كن أوّل من ينشر دعاءً الليلة.',
                   'آج رات دعا شیئر کرنے والے پہلے بنیں۔')}
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

function Composer({ onPosted, L, lang }: {
  onPosted: () => void;
  L: <T,>(en: T, ar: T, ur: T) => T;
  lang: 'en' | 'ar' | 'ur';
}) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState<DuaCategory>('personal');
  const [posting, setPosting] = useState(false);

  const submit = async () => {
    const trimmed = text.trim();
    if (trimmed.length < 3 || trimmed.length > 300) {
      Alert.alert(
        lang === 'ar' ? 'الطول' : lang === 'ur' ? 'لمبائی' : 'Length',
        lang === 'ar' ? 'اجعل دعاءك بين 3 و300 حرفًا.' : lang === 'ur' ? 'اپنی دعا 3 سے 300 حروف کے درمیان رکھیں۔' : 'Keep your duʿā between 3 and 300 characters.',
      );
      return;
    }
    setPosting(true);
    try {
      await wallApi.create(category, trimmed, lang);
      setText('');
      onPosted();
    } catch (e: any) {
      const reason = e?.detail?.reason || '';
      const msg = reason.startsWith('rate_limit')
        ? L('You\u2019ve already posted today. Come back tomorrow, in shāʾ Allāh.',
            'لقد نشرت اليوم — عد غدًا إن شاء الله.',
            'آپ آج پوسٹ کر چکے ہیں — کل تشریف لائیں۔')
        : reason.startsWith('flagged') || reason.startsWith('blacklisted') || reason === 'url_not_allowed' || reason === 'phone_not_allowed'
        ? L('Please rewrite your duʿā more gently and try again.',
            'الرجاء إعادة صياغة الدعاء بلطف.',
            'براہ کرم دعا کو نرمی سے دوبارہ لکھیں۔')
        : (e?.message || 'Something went wrong.');
      Alert.alert(L('Not posted', 'لم يُنشَر', 'پوسٹ نہیں ہوئی'), msg);
    } finally {
      setPosting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.composer}>
        <Text style={styles.composerLabel}>{L('Category', 'الفئة', 'زمرہ')}</Text>
        <View style={styles.filterRow}>
          {CATS.map((c) => (
            <Chip
              key={c}
              active={category === c}
              onPress={() => setCategory(c)}
              icon={CATEGORY_LABELS[c].icon}
              label={CATEGORY_LABELS[c][lang]}
            />
          ))}
        </View>

        <Text style={[styles.composerLabel, { marginTop: spacing.md }]}>
          {L('Your duʿā', 'دعاؤك', 'آپ کی دعا')}
        </Text>
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          maxLength={300}
          placeholder={L('Please make duʿā for …', 'الرجاء الدعاء من أجل …', '… کے لیے دعا کریں')}
          placeholderTextColor={colors.textDim}
          style={styles.textInput}
        />
        <View style={styles.composerFooter}>
          <Text style={styles.charCount}>{text.length}/300</Text>
          <Pressable
            onPress={submit}
            disabled={posting}
            style={({ pressed }) => [styles.submitBtn, (pressed || posting) && { opacity: 0.7 }]}
            testID="dua-wall-submit"
          >
            {posting ? (
              <ActivityIndicator color={colors.bg} size="small" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={16} color={colors.bg} />
                <Text style={styles.submitText}>{L('Post', 'نشر', 'شیئر')}</Text>
              </>
            )}
          </Pressable>
        </View>
        <Text style={styles.privacyLine}>
          {L('🔒 Anonymous · no name, no photo · one duʿā per device per day.',
             '🔒 مجهول · بلا اسم أو صورة · دعاء واحد يوميًّا لكل جهاز.',
             '🔒 گمنام · روزانہ فی ڈیوائس ۱ دعا۔')}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

function DuaCard({
  dua, lang, onUpdate,
}: { dua: WallDua; lang: 'en' | 'ar' | 'ur'; onUpdate: (d: WallDua) => void }) {
  const [busy, setBusy] = useState(false);
  const cat = CATEGORY_LABELS[dua.category];

  const bless = async () => {
    setBusy(true);
    try {
      const r = await wallApi.bless(dua.id);
      onUpdate({ ...dua, bless_count: r.bless_count });
    } catch {}
    finally { setBusy(false); }
  };
  const react = async (reaction: DuaReaction) => {
    try {
      const r = await wallApi.react(dua.id, reaction);
      onUpdate({ ...dua, reactions: r.reactions as any });
    } catch {}
  };

  const timeLabel = useMemo(() => {
    try {
      const d = new Date(dua.created_at);
      const diffH = (Date.now() - d.getTime()) / 3600000;
      if (diffH < 1) return `${Math.max(1, Math.floor(diffH * 60))}m`;
      if (diffH < 24) return `${Math.floor(diffH)}h`;
      return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
    } catch { return ''; }
  }, [dua.created_at]);

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.catChip}>
          <Ionicons name={cat.icon as any} size={11} color={colors.gold} />
          <Text style={styles.catChipText}>{cat[lang]}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <Text style={styles.timeText}>{timeLabel}</Text>
      </View>
      <Text style={[styles.cardText, { textAlign: (lang === 'ar' || lang === 'ur') ? 'right' : 'left' }]}>
        {dua.text}
      </Text>
      <View style={styles.reactionRow}>
        {REACTIONS.slice(0, 3).map((r) => {
          const count = dua.reactions?.[r] || 0;
          return (
            <Pressable
              key={r}
              onPress={() => react(r)}
              style={({ pressed }) => [styles.reactBtn, pressed && { opacity: 0.75 }]}
              testID={`dua-react-${r}-${dua.id}`}
            >
              <Text style={styles.reactText}>{REACTION_LABELS[r][lang]}</Text>
              {count > 0 ? <Text style={styles.reactCount}>{count}</Text> : null}
            </Pressable>
          );
        })}
      </View>
      <Pressable
        onPress={bless}
        disabled={busy}
        style={({ pressed }) => [styles.blessBtn, (pressed || busy) && { opacity: 0.8 }]}
        testID={`dua-bless-${dua.id}`}
      >
        <Text style={styles.blessEmoji}>🤲</Text>
        <Text style={styles.blessText}>
          {lang === 'ar' ? 'أدعو لك' : lang === 'ur' ? 'دعا کر دی' : 'I made duʿā'}
        </Text>
        <View style={{ flex: 1 }} />
        <View style={styles.blessCountWrap}>
          <Text style={styles.blessCount}>{dua.bless_count}</Text>
        </View>
      </Pressable>
    </View>
  );
}

function Chip({ active, onPress, label, icon }: { active: boolean; onPress: () => void; label: string; icon?: string }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      {icon ? (
        <Ionicons name={icon as any} size={12} color={active ? colors.bg : colors.gold} />
      ) : null}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function StatChip({ icon, count, label }: { icon: any; count: number; label: string }) {
  return (
    <View style={styles.statChip}>
      <Ionicons name={icon} size={13} color={colors.gold} />
      <Text style={styles.statChipCount}>{count}</Text>
      <Text style={styles.statChipLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
  },
  heroBody: { ...ty.body, color: colors.text, lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  statChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill,
    backgroundColor: colors.bg,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  statChipCount: { color: colors.gold, fontWeight: '800', fontSize: 13 },
  statChipLabel: { ...ty.tiny, color: colors.textDim },
  composeBtn: {
    marginTop: spacing.sm,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.gold, paddingVertical: 12, borderRadius: radius.pill,
  },
  composeBtnText: { ...ty.body, color: colors.bg, fontWeight: '800', letterSpacing: 0.3 },

  composer: {
    padding: spacing.lg, gap: spacing.sm,
    backgroundColor: 'rgba(212,175,55,0.05)',
    borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
  },
  composerLabel: { ...ty.tiny, color: colors.gold, letterSpacing: 1, textTransform: 'uppercase' },
  textInput: {
    minHeight: 80,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.cardBorder,
    padding: spacing.md,
    color: colors.text,
    ...ty.body,
    textAlignVertical: 'top',
  },
  composerFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: 4 },
  charCount: { ...ty.tiny, color: colors.textDim },
  submitBtn: {
    marginLeft: 'auto',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: radius.pill, backgroundColor: colors.gold,
  },
  submitText: { color: colors.bg, fontWeight: '800', letterSpacing: 0.3 },
  privacyLine: { ...ty.tiny, color: colors.textDim, marginTop: 4, fontStyle: 'italic' },

  filterRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { ...ty.tiny, color: colors.textDim },
  chipTextActive: { color: colors.bg, fontWeight: '800' },

  card: {
    marginHorizontal: spacing.lg, marginTop: spacing.md,
    padding: spacing.md, borderRadius: radius.md,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder,
    gap: spacing.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(212,175,55,0.10)',
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  catChipText: { color: colors.gold, fontSize: 10, letterSpacing: 0.5, fontWeight: '700' },
  timeText: { ...ty.tiny, color: colors.textDim },
  cardText: { ...ty.body, color: colors.text, lineHeight: 22 },
  reactionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  reactBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill,
    backgroundColor: 'rgba(212,175,55,0.06)',
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  reactText: { color: colors.gold, fontSize: 11, fontWeight: '600' },
  reactCount: { color: colors.gold, fontSize: 11, fontWeight: '800' },
  blessBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.gold, marginTop: 4,
  },
  blessEmoji: { fontSize: 18 },
  blessText: { color: colors.bg, fontWeight: '800', fontSize: 12, letterSpacing: 0.3 },
  blessCountWrap: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: colors.bg },
  blessCount: { color: colors.gold, fontWeight: '800', fontSize: 12 },

  emptyWrap: { alignItems: 'center', gap: spacing.sm, padding: spacing.xl },
  emptyTitle: { ...ty.h3, color: colors.text },
  emptyBody: { ...ty.tiny, color: colors.textDim, textAlign: 'center', maxWidth: 300, lineHeight: 18 },
});
