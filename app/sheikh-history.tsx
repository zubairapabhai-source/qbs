/**
 * AI Sheikh — Question History Screen (QBS)
 *
 * A permanent, searchable, star-able archive of every question the user
 * has ever asked the AI Sheikh. Reached from the "history" icon in the
 * Sheikh tab header, or directly via `/sheikh-history`.
 *
 * UX ARCHITECTURE
 *   • Search bar (case-insensitive substring match across Q + A)
 *   • "Starred only" filter chip
 *   • Reverse-chronological list (newest first)
 *   • Each row: date badge · Q (2 lines) · ★ toggle · expand/collapse
 *   • Expanded row: full answer + tafseer citations (tap → verse)
 *                    action bar (Copy · Share · Re-ask · Delete)
 *   • Empty states written for both "no history yet" and "no match".
 *   • Trilingual (EN / AR / UR) — RTL-safe.
 *
 * PRIVACY POSTURE
 *   Everything lives on-device via AsyncStorage — no backend call, no
 *   analytics event. Deleting an entry deletes it forever, immediately.
 */
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Stack, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert, FlatList, Pressable, Share, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../src/store/useApp';
import { useSheikhHistory, type HistoryEntry } from '../src/personalisation/sheikhHistory';
import { colors, radius, spacing, type as ty } from '../src/theme';

function formatDate(ts: number, lang: 'en' | 'ar' | 'ur'): string {
  const d = new Date(ts);
  const locale = lang === 'ar' ? 'ar-EG' : lang === 'ur' ? 'ur-PK' : 'en-GB';
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

function relativeDay(ts: number, lang: 'en' | 'ar' | 'ur'): string {
  const now = Date.now();
  const diffH = (now - ts) / (1000 * 60 * 60);
  if (diffH < 24) {
    return lang === 'ar' ? 'اليوم' : lang === 'ur' ? 'آج' : 'Today';
  }
  if (diffH < 48) {
    return lang === 'ar' ? 'أمس' : lang === 'ur' ? 'کل' : 'Yesterday';
  }
  return formatDate(ts, lang);
}

export default function SheikhHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const lang = useApp((s) => s.lang);
  const rtl = lang === 'ar' || lang === 'ur';
  const history = useSheikhHistory((s) => s.history);
  const hydrated = useSheikhHistory((s) => s.hydrated);
  const toggleStar = useSheikhHistory((s) => s.toggleStar);
  const remove = useSheikhHistory((s) => s.remove);
  const clearAll = useSheikhHistory((s) => s.clearAll);

  const [query, setQuery] = useState('');
  const [starredOnly, setStarredOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const L = <T,>(en: T, ar: T, ur: T): T =>
    lang === 'ar' ? ar : lang === 'ur' ? ur : en;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return history.filter((e) => {
      if (starredOnly && !e.starred) return false;
      if (!needle) return true;
      return e.q.toLowerCase().includes(needle) || e.a.toLowerCase().includes(needle);
    });
  }, [history, query, starredOnly]);

  const totalStarred = useMemo(
    () => history.reduce((n, e) => n + (e.starred ? 1 : 0), 0),
    [history]
  );

  const onCopy = async (entry: HistoryEntry) => {
    const body = `Q: ${entry.q}\n\nA: ${entry.a}`;
    try { await Clipboard.setStringAsync(body); } catch {}
  };

  const onShare = async (entry: HistoryEntry) => {
    const cites = (entry.snippets || []).slice(0, 3)
      .map((sn) => `• ${sn.source} · ${sn.key} — ${sn.text}`).join('\n');
    const body =
      `Q: ${entry.q}\n\n` +
      `A: ${entry.a}\n\n` +
      (cites ? `— Citations —\n${cites}\n\n` : '') +
      `— Quran, Bible & Science (AI Sheikh)`;
    try { await Share.share({ message: body }); } catch {}
  };

  const onReask = (entry: HistoryEntry) => {
    // Deep-link back to Sheikh tab with the question pre-filled.
    // `_t` timestamp ensures the sheikh screen's prefill effect fires
    // even when the user re-asks the SAME question twice in a row.
    router.push({
      pathname: '/(tabs)/sheikh' as any,
      params: { prefill: entry.q, _t: String(Date.now()) },
    });
  };

  const onDelete = (entry: HistoryEntry) => {
    Alert.alert(
      L('Delete this question?', 'حذف هذا السؤال؟', 'یہ سوال حذف کریں؟'),
      L(
        'This removes the question and its answer from your device forever. This cannot be undone.',
        'سيؤدي هذا إلى حذف السؤال وإجابته من جهازك للأبد. لا يمكن التراجع.',
        'یہ سوال اور اس کا جواب آپ کے ڈیوائس سے ہمیشہ کے لیے حذف ہو جائے گا۔ واپسی ممکن نہیں۔'
      ),
      [
        { text: L('Cancel', 'إلغاء', 'منسوخ'), style: 'cancel' },
        {
          text: L('Delete', 'حذف', 'حذف'),
          style: 'destructive',
          onPress: () => {
            if (expandedId === entry.id) setExpandedId(null);
            remove(entry.id);
          },
        },
      ]
    );
  };

  const onClearAll = () => {
    if (history.length === 0) return;
    Alert.alert(
      L('Clear all history?', 'مسح كل السجل؟', 'تمام تاریخ صاف کریں؟'),
      L(
        `This deletes all ${history.length} questions and answers from your device forever, including your ${totalStarred} starred favourites. This cannot be undone.`,
        `سيؤدي هذا إلى حذف كل ${history.length} سؤالاً وإجابة من جهازك للأبد، بما فيها ${totalStarred} مفضلة. لا يمكن التراجع.`,
        `اس سے آپ کے ${history.length} سوالات اور جوابات ہمیشہ کے لیے حذف ہو جائیں گے، بشمول ${totalStarred} پسندیدہ۔ واپسی ممکن نہیں۔`
      ),
      [
        { text: L('Cancel', 'إلغاء', 'منسوخ'), style: 'cancel' },
        { text: L('Clear all', 'مسح الكل', 'سب صاف کریں'), style: 'destructive', onPress: clearAll },
      ]
    );
  };

  const renderItem = ({ item }: { item: HistoryEntry }) => {
    const isExpanded = expandedId === item.id;
    return (
      <View style={styles.card}>
        <Pressable
          onPress={() => setExpandedId(isExpanded ? null : item.id)}
          onLongPress={() => onDelete(item)}
          style={({ pressed }) => [styles.cardHead, pressed && { opacity: 0.85 }]}
        >
          <View style={[styles.metaRow, rtl && { flexDirection: 'row-reverse' }]}>
            <Text style={styles.date}>{relativeDay(item.ts, item.lang || lang)}</Text>
            <View style={{ flex: 1 }} />
            <Pressable onPress={() => toggleStar(item.id)} hitSlop={12} style={styles.starBtn}>
              <Ionicons
                name={item.starred ? 'star' : 'star-outline'}
                size={18}
                color={item.starred ? colors.gold : colors.silverDim}
              />
            </Pressable>
          </View>
          <Text
            style={[styles.q, { textAlign: rtl ? 'right' : 'left' }]}
            numberOfLines={isExpanded ? undefined : 2}
          >
            {item.q}
          </Text>
          {!isExpanded ? (
            <Text
              style={[styles.aPreview, { textAlign: rtl ? 'right' : 'left' }]}
              numberOfLines={2}
            >
              {item.a}
            </Text>
          ) : null}
        </Pressable>

        {isExpanded ? (
          <View style={styles.expanded}>
            <View style={styles.divider} />
            <Text style={[styles.aFull, { textAlign: rtl ? 'right' : 'left' }]}>{item.a}</Text>

            {item.snippets && item.snippets.length > 0 ? (
              <View style={styles.snippetsWrap}>
                <Text style={styles.snippetsLabel}>
                  {L('CITATIONS', 'المصادر', 'حوالہ جات')}
                </Text>
                {item.snippets.slice(0, 3).map((sn, j) => (
                  <Pressable
                    key={j}
                    onPress={() => router.push(`/verse/${encodeURIComponent(sn.key)}` as any)}
                    style={({ pressed }) => [styles.snippet, pressed && { opacity: 0.7 }]}
                  >
                    <View style={[styles.snippetHead, rtl && { flexDirection: 'row-reverse' }]}>
                      <Ionicons name="library" size={11} color={colors.gold} />
                      <Text style={styles.snippetSrc}>{sn.source} · {sn.key}</Text>
                      <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={12} color={colors.gold + '99'} />
                    </View>
                    <Text style={styles.snippetTxt} numberOfLines={3}>{sn.text}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <View style={[styles.actions, rtl && { flexDirection: 'row-reverse' }]}>
              <Pressable onPress={() => onReask(item)} style={({ pressed }) => [styles.actionBtn, styles.actionPrimary, pressed && { opacity: 0.85 }]}>
                <Ionicons name="arrow-redo" size={13} color={colors.bg} />
                <Text style={styles.actionPrimaryTxt}>{L('Re-ask', 'اسأل مجددًا', 'دوبارہ پوچھیں')}</Text>
              </Pressable>
              <Pressable onPress={() => onCopy(item)} style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}>
                <Ionicons name="copy-outline" size={13} color={colors.silverDim} />
                <Text style={styles.actionTxt}>{L('Copy', 'نسخ', 'کاپی')}</Text>
              </Pressable>
              <Pressable onPress={() => onShare(item)} style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}>
                <Ionicons name="share-outline" size={13} color={colors.silverDim} />
                <Text style={styles.actionTxt}>{L('Share', 'مشاركة', 'شیئر')}</Text>
              </Pressable>
              <Pressable onPress={() => onDelete(item)} style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}>
                <Ionicons name="trash-outline" size={13} color={colors.rose} />
                <Text style={[styles.actionTxt, { color: colors.rose }]}>{L('Delete', 'حذف', 'حذف')}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  // ── Empty states ────────────────────────────────────────────────
  const EmptyNoHistory = () => (
    <View style={styles.empty}>
      <Ionicons name="chatbubbles-outline" size={44} color={colors.gold + 'AA'} />
      <Text style={styles.emptyTitle}>
        {L('No questions yet', 'لا أسئلة بعد', 'ابھی کوئی سوال نہیں')}
      </Text>
      <Text style={styles.emptyBody}>
        {L(
          'Every question you ask the AI Sheikh will be saved here for you to revisit — search it, star your favourites, share the answers.',
          'كل سؤال تطرحه على الشيخ الذكي سيُحفظ هنا لتعود إليه — ابحث فيه، وضع نجمة على المفضلات، وشارك الإجابات.',
          'ہر سوال جو آپ AI شیخ سے کریں گے یہاں محفوظ ہو گا — تلاش کریں، پسندیدہ کو ستارہ دیں، جوابات شیئر کریں۔'
        )}
      </Text>
      <Pressable
        onPress={() => router.push('/(tabs)/sheikh' as any)}
        style={({ pressed }) => [styles.emptyCta, pressed && { opacity: 0.85 }]}
      >
        <Ionicons name="sparkles" size={14} color={colors.bg} />
        <Text style={styles.emptyCtaTxt}>{L('Ask your first question', 'اسأل سؤالك الأول', 'پہلا سوال کریں')}</Text>
      </Pressable>
    </View>
  );

  const EmptyNoMatch = () => (
    <View style={styles.empty}>
      <Ionicons name="search-outline" size={40} color={colors.silverDim} />
      <Text style={styles.emptyTitle}>
        {L('Nothing matched', 'لا مطابقات', 'کوئی نتیجہ نہیں')}
      </Text>
      <Text style={styles.emptyBody}>
        {L(
          'Try a shorter search, or turn off the ★ filter.',
          'جرّب بحثًا أقصر، أو أوقف تصفية ★.',
          'مختصر تلاش کریں یا ★ فلٹر بند کریں۔'
        )}
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.headerRow, rtl && { flexDirection: 'row-reverse' }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name={rtl ? 'chevron-forward' : 'chevron-back'} size={22} color={colors.gold} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.kicker, { textAlign: rtl ? 'right' : 'left' }]}>
            {L('YOUR JOURNEY', 'رحلتك', 'آپ کا سفر')}
          </Text>
          <Text style={[styles.title, { textAlign: rtl ? 'right' : 'left' }]}>
            {L('Question History', 'سجل الأسئلة', 'سوالات کی تاریخ')}
          </Text>
        </View>
        {history.length > 0 ? (
          <Pressable onPress={onClearAll} hitSlop={10} style={styles.clearBtn}>
            <Ionicons name="trash-outline" size={18} color={colors.rose} />
          </Pressable>
        ) : null}
      </View>

      {/* Search + filter row (only when we actually have entries) */}
      {hydrated && history.length > 0 ? (
        <View style={styles.controls}>
          <View style={[styles.searchBox, rtl && { flexDirection: 'row-reverse' }]}>
            <Ionicons name="search" size={16} color={colors.silverDim} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={L('Search your questions & answers…', 'ابحث في أسئلتك وإجاباتك…', 'اپنے سوالات و جوابات میں تلاش کریں…')}
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { textAlign: rtl ? 'right' : 'left' }]}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={colors.silverDim} />
              </Pressable>
            ) : null}
          </View>

          <Pressable
            onPress={() => setStarredOnly((v) => !v)}
            style={({ pressed }) => [
              styles.filterPill,
              starredOnly && styles.filterPillActive,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons name={starredOnly ? 'star' : 'star-outline'} size={14} color={starredOnly ? colors.bg : colors.gold} />
            <Text style={[styles.filterPillTxt, starredOnly && { color: colors.bg }]}>
              {starredOnly ? L('★ only', '★ فقط', 'صرف ★') : L('★ favourites', 'المفضلات', 'پسندیدہ')}
              {totalStarred > 0 ? ` · ${totalStarred}` : ''}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* List / empty */}
      {!hydrated ? (
        <View style={styles.empty}>
          <Text style={styles.emptyBody}>{L('Loading…', 'جارٍ التحميل…', 'لوڈ ہو رہا ہے…')}</Text>
        </View>
      ) : history.length === 0 ? (
        <EmptyNoHistory />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(e) => e.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: insets.bottom + spacing.xl,
            gap: spacing.sm,
          }}
          ListEmptyComponent={filtered.length === 0 ? <EmptyNoMatch /> : null}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Header
  headerRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.gold + '55',
    backgroundColor: colors.bgElevated,
  },
  clearBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.rose + '55',
    backgroundColor: colors.bgElevated,
  },
  kicker: { ...ty.label, color: colors.gold, fontSize: 10 },
  title: { ...ty.h2, color: colors.silverHi, marginTop: 2 },

  // Controls
  controls: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.cardBorder,
    backgroundColor: colors.bgElevated,
  },
  searchInput: {
    flex: 1, ...ty.body, color: colors.text, fontSize: 14, padding: 0,
  },
  filterPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.gold + '77',
    backgroundColor: colors.gold + '11',
  },
  filterPillActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  filterPillTxt: {
    color: colors.gold, fontSize: 12, fontWeight: '700', letterSpacing: 0.3,
  },

  // Card
  card: {
    borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.cardBorder,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  cardHead: {
    padding: spacing.md,
    gap: 6,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  date: {
    ...ty.tiny, color: colors.gold, fontWeight: '700',
    letterSpacing: 0.5, textTransform: 'uppercase', fontSize: 10,
  },
  starBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  q: {
    ...ty.bodyLarge, color: colors.text, fontWeight: '600',
    lineHeight: 20, marginTop: 2,
  },
  aPreview: {
    ...ty.small, color: colors.textDim, lineHeight: 18, marginTop: 4,
  },

  // Expanded
  expanded: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm },
  divider: { height: 1, backgroundColor: colors.cardBorder, marginTop: spacing.xs, marginBottom: spacing.sm },
  aFull: { ...ty.body, color: colors.text, lineHeight: 22 },

  snippetsWrap: { gap: 6, marginTop: spacing.sm },
  snippetsLabel: {
    ...ty.label, color: colors.gold, fontSize: 10, letterSpacing: 1.4, marginBottom: 4,
  },
  snippet: {
    backgroundColor: colors.bgElevated,
    padding: 8, borderRadius: radius.sm,
    borderLeftWidth: 2, borderLeftColor: colors.gold,
  },
  snippetHead: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  snippetSrc: {
    fontSize: 10, fontWeight: '700', color: colors.gold,
    letterSpacing: 0.5, textTransform: 'uppercase', flex: 1,
  },
  snippetTxt: { ...ty.small, color: colors.parchment, fontSize: 12.5, lineHeight: 17 },

  actions: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    marginTop: spacing.sm, paddingTop: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.cardBorder,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.bgElevated,
  },
  actionPrimary: {
    backgroundColor: colors.gold,
  },
  actionTxt: { ...ty.tiny, color: colors.silverDim, fontWeight: '600', fontSize: 11.5 },
  actionPrimaryTxt: { ...ty.tiny, color: colors.bg, fontWeight: '800', fontSize: 11.5 },

  // Empty
  empty: {
    alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.xl * 1.5,
    gap: spacing.md,
  },
  emptyTitle: { ...ty.h3, color: colors.silverHi, textAlign: 'center' },
  emptyBody: {
    ...ty.small, color: colors.textDim,
    textAlign: 'center', lineHeight: 20, maxWidth: 320,
  },
  emptyCta: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 22,
    borderRadius: radius.pill, backgroundColor: colors.gold,
    marginTop: spacing.sm,
  },
  emptyCtaTxt: { ...ty.small, color: colors.bg, fontWeight: '900', letterSpacing: 0.4 },
});
