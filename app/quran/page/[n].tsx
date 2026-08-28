/**
 * Beautiful Mushaf page — /app/quran/page/[n]
 *
 * Traditional Saudi/Madani mushaf layout:
 *   ┌──────────────────────────────┐
 *   │  Sūrah name  ◆  Juz  ◆  ٢٥   │  ← ornate header
 *   ├──────────────────────────────┤
 *   │       [basmala on verse 1]   │
 *   │  ...RTL Arabic Uthmani with   │
 *   │  full harakaat, tajweed       │
 *   │  colours (Amiri Quran Coloured)│
 *   │  ...◯...◯...                 │  ← round verse markers
 *   ├──────────────────────────────┤
 *   │            ‧ ٢٥ ‧             │  ← ornamental page #
 *   └──────────────────────────────┘
 *
 * Gestures: horizontal swipe → prev/next page (RTL: swipe left = next).
 * Long-press ayah → menu (bookmark · copy · tafseer £0.99 · listen).
 * Translations: toggle in top-right (AR only → AR+EN → AR+UR → AR+both).
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Dimensions, Modal, Pressable, ScrollView,
  StyleSheet, Text, View,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchPage, type AyahTri } from '../../../src/quran/api';
import { useQuranReader } from '../../../src/quran/store';
import { useApp } from '../../../src/store/useApp';
import { colors, radius, type as ty } from '../../../src/theme';
import { VerseAudioButton } from '../../../src/components/VerseAudioButton';

const SCREEN = Dimensions.get('window');

type TransMode = 'none' | 'en' | 'ur' | 'both';

/** Convert 25 → "٢٥" for verse markers / page numbers. */
function toArabicNumerals(n: number): string {
  const map = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(n).split('').map((d) => map[parseInt(d, 10)] || d).join('');
}

/** True if this is verse 1 of the surah AND we should draw the basmala
 *  header on top (all surahs except sūrah 1 which starts WITH basmala,
 *  and sūrah 9 al-Tawba which has no basmala). */
function shouldShowBasmalaHeader(surah: number, verse: number): boolean {
  return verse === 1 && surah !== 1 && surah !== 9;
}

export default function MushafPageScreen() {
  const { n } = useLocalSearchParams<{ n: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const lang = useApp((s) => s.lang);
  const unlocked = useApp((s) => s.unlocked === true);
  const {
    setLastPage, addBookmark, removeBookmark, isBookmarked, bookmarksForPage,
  } = useQuranReader();

  const pageNum = Math.max(1, Math.min(604, parseInt(String(n), 10) || 1));

  const [page, setPage] = useState<Awaited<ReturnType<typeof fetchPage>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [trans, setTrans] = useState<TransMode>('en');  // Default: show English translation like Glorious Quran
  const [longPressed, setLongPressed] = useState<AyahTri | null>(null);

  // Persist "last page read" the moment we're viewing something valid.
  useEffect(() => {
    if (page && page.page) setLastPage(page.page);
  }, [page, setLastPage]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const p = await fetchPage(pageNum);
      if (!cancelled) { setPage(p); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [pageNum]);

  const goPrev = useCallback(() => {
    if (pageNum > 1) router.replace(`/quran/page/${pageNum - 1}` as any);
  }, [pageNum, router]);
  const goNext = useCallback(() => {
    if (pageNum < 604) router.replace(`/quran/page/${pageNum + 1}` as any);
  }, [pageNum, router]);

  // Horizontal swipe: RTL mushaf pages advance when the finger goes LEFT (like
  // flipping a physical mushaf from right to left). Threshold: 60 px + fast fling.
  const pan = Gesture.Pan()
    .activeOffsetX([-16, 16])
    .onEnd((e) => {
      'worklet';
      const { translationX, velocityX } = e;
      const fastEnough = Math.abs(velocityX) > 400;
      const farEnough = Math.abs(translationX) > 60;
      if (!fastEnough && !farEnough) return;
      if (translationX < 0) runOnJS(goNext)();
      else runOnJS(goPrev)();
    });

  const bookmarkedIds = useMemo(
    () => new Set(bookmarksForPage(pageNum).map((b) => b.id)),
    [bookmarksForPage, pageNum]
  );

  // ── Long-press action sheet ──
  const openTafseer = (a: AyahTri) => {
    setLongPressed(null);
    if (!unlocked) {
      Alert.alert(
        lang === 'en' ? 'Unlock Tafseer for £0.99' :
        lang === 'ar' ? 'افتح التفسير بـ ٠٫٩٩ جنيه' :
        'تفسیر £0.99 میں انلاک کریں',
        lang === 'en' ? 'Lifetime access to all 6 tafseer sources across all 6,236 verses. Ask Sheikh included.' :
        lang === 'ar' ? 'وصول مدى الحياة لجميع التفاسير الستة عبر آيات القرآن الكريم كافّة، مع «اسأل الشيخ».' :
        'ہمیشہ کی رسائی: تمام ۶ تفاسیر و "شیخ سے پوچھیں" کی سہولت۔',
        [
          { text: lang === 'en' ? 'Not now' : lang === 'ar' ? 'ليس الآن' : 'ابھی نہیں', style: 'cancel' },
          {
            text: lang === 'en' ? 'Unlock' : lang === 'ar' ? 'افتح' : 'انلاک',
            onPress: () => router.push('/unlock' as any),
          },
        ]
      );
      return;
    }
    router.push(`/verse/${encodeURIComponent(a.key)}` as any);
  };

  const toggleBookmarkAyah = (a: AyahTri) => {
    const id = a.key;
    if (isBookmarked(id)) {
      removeBookmark(id);
    } else {
      addBookmark({
        kind: 'ayah', surah: a.surah, verse: a.verse, page: pageNum,
        surahNameEn: a.surah_name_en, id,
      });
    }
    setLongPressed(null);
  };

  const copyAyah = async (a: AyahTri) => {
    await Clipboard.setStringAsync(`${a.ar}\n\n— Qur'ān ${a.key} · ${a.surah_name_en}`);
    setLongPressed(null);
  };

  // ── UI ──
  if (loading || !page) return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ActivityIndicator color={colors.gold} size="large" style={{ marginTop: 120 }} />
    </View>
  );

  const currentSurahName = page.surah_names_on_page[0] || '';
  const juz = page.juz;
  const pageBookmarkId = `page:${pageNum}`;
  const pageBookmarked = isBookmarked(pageBookmarkId);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Compact top bar (over mushaf page) */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.gold} />
        </Pressable>
        <Pressable
          onPress={() => router.push('/quran' as any)}
          style={styles.surahPill}
        >
          <Text style={styles.surahPillTxt}>
            {currentSurahName || 'Al-Fātiḥah'} {juz ? `· Juzʾ ${juz}` : ''}
          </Text>
        </Pressable>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Pressable onPress={() => {
            setTrans((t) => t === 'none' ? 'en' : t === 'en' ? 'ur' : t === 'ur' ? 'both' : 'none');
          }} hitSlop={8} style={styles.iconBtn}>
            <Ionicons name="language" size={20} color={
              trans === 'none' ? colors.silver + '77' : colors.gold
            } />
          </Pressable>
          <Pressable
            onPress={() => {
              if (pageBookmarked) removeBookmark(pageBookmarkId);
              else addBookmark({ kind: 'page', page: pageNum, id: pageBookmarkId });
            }}
            hitSlop={8}
            style={styles.iconBtn}
          >
            <Ionicons name={pageBookmarked ? 'bookmark' : 'bookmark-outline'}
                      size={20} color={colors.gold} />
          </Pressable>
        </View>
      </View>

      <GestureDetector gesture={pan}>
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.pageScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Mushaf page card — ornate parchment */}
            <LinearGradient
              colors={[colors.bg, colors.bgElevated || colors.bg]}
              style={styles.page}
            >
              {/* Header strip: surah name in ornate frame */}
              <View style={styles.pageHeader}>
                <View style={styles.headerLine} />
                <Text style={styles.headerSurahAr}>
                  ﴾ {(page.ayahs[0]?.surah_name_en) || currentSurahName} ﴿
                </Text>
                <View style={styles.headerLine} />
              </View>

              {/* Discoverability hint — tap-icons under each ayah are now obvious */}
              <View style={styles.tipStrip}>
                <Ionicons name="information-circle-outline" size={12} color={colors.gold + 'AA'} />
                <Text style={styles.tipTxt}>
                  {lang === 'en' ? 'Tafseer & audio buttons under every verse — tap to explore' :
                   lang === 'ar' ? 'أزرار التفسير والصوت تحت كل آية — انقر للاستكشاف' :
                   'ہر آیت کے نیچے تفسیر و آڈیو بٹن — ٹیپ کریں'}
                </Text>
              </View>

              {/* Ayahs, RTL justified — Amiri Quran plain black */}
              <View style={styles.ayahBlock}>
                {page.ayahs.map((a, i) => (
                  <View key={a.key} style={styles.ayahRow}>
                    {shouldShowBasmalaHeader(a.surah || 0, a.verse) && (
                      <Text style={styles.basmala}>
                        بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
                      </Text>
                    )}
                    {/* Arabic ayah — tap opens the action menu */}
                    <Pressable
                      onPress={() => setLongPressed(a)}
                      onLongPress={() => setLongPressed(a)}
                      delayLongPress={280}
                      style={({ pressed }) => [
                        styles.ayahPressable,
                        pressed && { backgroundColor: colors.gold + '15' },
                      ]}
                    >
                      <Text style={styles.arabic}>
                        {a.ar}{' '}
                        <Text style={styles.verseMarker}>
                          ﴿{toArabicNumerals(a.verse)}﴾
                        </Text>
                      </Text>
                      {bookmarkedIds.has(a.key) && (
                        <Ionicons
                          name="bookmark"
                          size={12}
                          color={colors.gold}
                          style={styles.miniBookmark}
                        />
                      )}
                    </Pressable>

                    {/* Translation(s) always underneath, Glorious Quran style */}
                    {(trans === 'en' || trans === 'both') && !!a.en && (
                      <Text style={styles.transEn}>
                        <Text style={styles.transNum}>{a.verse}. </Text>
                        {a.en}
                      </Text>
                    )}
                    {(trans === 'ur' || trans === 'both') && !!a.ur && (
                      <Text style={styles.transUr}>{a.ur}</Text>
                    )}

                    {/* Visible action row — obvious tafseer button + friends */}
                    <View style={styles.ayahActions}>
                      <Pressable
                        onPress={() => openTafseer(a)}
                        style={({ pressed }) => [styles.actionPill, pressed && { backgroundColor: colors.gold + '22' }]}
                        hitSlop={4}
                      >
                        <Ionicons
                          name={unlocked || a.key === '41:53' ? 'book' : 'lock-closed'}
                          size={12}
                          color={colors.gold}
                        />
                        <Text style={styles.actionPillTxt}>
                          {lang === 'en' ? 'Tafseer' : lang === 'ar' ? 'تفسير' : 'تفسیر'}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => toggleBookmarkAyah(a)}
                        style={({ pressed }) => [styles.actionPill, pressed && { backgroundColor: colors.gold + '22' }]}
                        hitSlop={4}
                      >
                        <Ionicons
                          name={bookmarkedIds.has(a.key) ? 'bookmark' : 'bookmark-outline'}
                          size={12}
                          color={colors.gold}
                        />
                      </Pressable>
                      <Pressable
                        onPress={() => copyAyah(a)}
                        style={({ pressed }) => [styles.actionPill, pressed && { backgroundColor: colors.gold + '22' }]}
                        hitSlop={4}
                      >
                        <Ionicons name="copy-outline" size={12} color={colors.gold} />
                      </Pressable>
                      <View style={{ flex: 1 }} />
                      <View style={styles.audioSlot}>
                        <VerseAudioButton verseKey={a.key} size="sm" light />
                      </View>
                    </View>

                    {i < page.ayahs.length - 1 && (
                      <View style={styles.ayahDivider} />
                    )}
                  </View>
                ))}
              </View>

              {/* Ornate footer with page # */}
              <View style={styles.pageFooter}>
                <View style={styles.footerOrn} />
                <Text style={styles.pageNumber}>‧ {toArabicNumerals(pageNum)} ‧</Text>
                <View style={styles.footerOrn} />
              </View>
            </LinearGradient>
          </ScrollView>
        </View>
      </GestureDetector>

      {/* Bottom nav — prev / page label / next */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Pressable onPress={goPrev} disabled={pageNum <= 1} style={[styles.navBtn, pageNum <= 1 && { opacity: 0.35 }]}>
          <Ionicons name="chevron-forward" size={20} color={colors.gold} />
          <Text style={styles.navBtnTxt}>
            {lang === 'en' ? 'Prev' : lang === 'ar' ? 'السابقة' : 'پچھلا'}
          </Text>
        </Pressable>
        <Text style={styles.pageMarker}>
          {toArabicNumerals(pageNum)} / {toArabicNumerals(604)}
        </Text>
        <Pressable onPress={goNext} disabled={pageNum >= 604} style={[styles.navBtn, pageNum >= 604 && { opacity: 0.35 }]}>
          <Text style={styles.navBtnTxt}>
            {lang === 'en' ? 'Next' : lang === 'ar' ? 'التالية' : 'اگلا'}
          </Text>
          <Ionicons name="chevron-back" size={20} color={colors.gold} />
        </Pressable>
      </View>

      {/* Long-press action sheet (bottom modal) */}
      <Modal visible={!!longPressed} transparent animationType="fade" onRequestClose={() => setLongPressed(null)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setLongPressed(null)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>
              {longPressed?.surah_name_en} · {longPressed?.key}
            </Text>
            <SheetRow icon={isBookmarked(longPressed?.key || '') ? 'bookmark' : 'bookmark-outline'}
              label={isBookmarked(longPressed?.key || '')
                ? (lang === 'en' ? 'Remove bookmark' : lang === 'ar' ? 'أزل الإشارة' : 'بک مارک ہٹائیں')
                : (lang === 'en' ? 'Bookmark' : lang === 'ar' ? 'إشارة مرجعية' : 'بک مارک')}
              onPress={() => longPressed && toggleBookmarkAyah(longPressed)} />
            <SheetRow icon="copy-outline" label={lang === 'en' ? 'Copy ayah' : lang === 'ar' ? 'انسخ الآية' : 'آیت کاپی کریں'}
              onPress={() => longPressed && copyAyah(longPressed)} />
            <SheetRow icon={unlocked ? 'book-outline' : 'lock-closed-outline'}
              label={unlocked
                ? (lang === 'en' ? 'Open tafseer' : lang === 'ar' ? 'التفسير' : 'تفسیر')
                : (lang === 'en' ? 'Unlock tafseer · £0.99' : lang === 'ar' ? 'افتح التفسير · ٠٫٩٩ جنيه' : 'تفسیر انلاک · £0.99')}
              onPress={() => longPressed && openTafseer(longPressed)} />
            {longPressed && (
              <View style={{ paddingHorizontal: 16, paddingBottom: 12, paddingTop: 4 }}>
                <Text style={styles.sheetLabel}>{lang === 'en' ? 'Listen' : lang === 'ar' ? 'استمع' : 'سنیں'}</Text>
                <VerseAudioButton verseKey={longPressed.key} size="md" showLabel
                  label={lang === 'en' ? '🎧 Sh. Mishary al-ʿAfāsy' : '🎧'} />
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function SheetRow({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.sheetRow, pressed && { backgroundColor: colors.gold + '11' }]} onPress={onPress}>
      <Ionicons name={icon} size={20} color={colors.gold} />
      <Text style={styles.sheetRowLabel}>{label}</Text>
    </Pressable>
  );
}

const PAGE_MARGIN = 12;
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.bg,
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  surahPill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999,
    borderWidth: 1, borderColor: colors.gold + '55',
    backgroundColor: colors.gold + '11', flex: 1, marginHorizontal: 8, alignItems: 'center',
  },
  surahPillTxt: { ...ty.small, color: colors.gold, fontWeight: '700' },

  pageScroll: { padding: PAGE_MARGIN, paddingBottom: 40 },
  page: {
    borderRadius: radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.gold + '44',
    minHeight: SCREEN.height * 0.72,
  },
  pageHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  headerLine: { flex: 1, height: 1, backgroundColor: colors.gold + '55' },
  headerSurahAr: { color: colors.gold, fontSize: 22, fontFamily: 'AmiriQuran', textAlign: 'center', fontWeight: '700' },

  ayahBlock: { paddingHorizontal: 4 },
  ayahRow: { marginBottom: 4 },
  ayahPressable: { borderRadius: 6, paddingVertical: 4, paddingHorizontal: 4, position: 'relative' },
  arabic: {
    // Plain-black Uthmani Naskh (no tajweed colouring) — the "ezQuran" look.
    // Larger size + tight line-height for a bold, print-mushaf feel.
    fontFamily: 'AmiriQuran',
    color: colors.text,
    fontSize: 34,
    lineHeight: 66,
    textAlign: 'justify',
    writingDirection: 'rtl',
  },
  verseMarker: {
    color: colors.gold,
    fontSize: 22,
    fontFamily: 'AmiriQuran',
  },
  basmala: {
    fontFamily: 'AmiriQuran',
    color: colors.text,
    fontSize: 30,
    textAlign: 'center',
    marginVertical: 14,
    lineHeight: 50,
    fontWeight: '500',
  },
  miniBookmark: { position: 'absolute', top: 2, right: 2 },
  transEn: {
    color: colors.text + 'DD', fontSize: 15, marginTop: 8, marginBottom: 4,
    lineHeight: 22, paddingHorizontal: 4,
  },
  transNum: { color: colors.gold, fontWeight: '800' },
  transUr: {
    color: colors.text + 'DD', fontSize: 17, marginTop: 4, marginBottom: 4,
    textAlign: 'right', writingDirection: 'rtl', lineHeight: 30,
    paddingHorizontal: 4,
  },
  ayahActions: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8,
    paddingHorizontal: 2,
  },
  actionPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
    borderWidth: 1, borderColor: colors.gold + '44',
    backgroundColor: colors.gold + '0A',
  },
  actionPillTxt: { color: colors.gold, fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  audioSlot: { transform: [{ scale: 0.85 }] },
  ayahDivider: { height: 1, backgroundColor: colors.gold + '22', marginVertical: 14 },

  pageFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24 },
  tipStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999,
    backgroundColor: colors.gold + '11', borderWidth: 1, borderColor: colors.gold + '33',
    marginBottom: 12,
  },
  tipTxt: { color: colors.gold + 'BB', fontSize: 11, letterSpacing: 0.2 },
  footerOrn: { flex: 1, height: 1, backgroundColor: colors.gold + '44' },
  pageNumber: { color: colors.gold, fontSize: 18, fontFamily: 'AmiriQuran' },

  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 10,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.gold + '33',
  },
  navBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999,
    backgroundColor: colors.gold + '18', borderWidth: 1, borderColor: colors.gold + '44',
  },
  navBtnTxt: { color: colors.gold, fontWeight: '700', fontSize: 13 },
  pageMarker: { color: colors.silver, fontSize: 14, fontFamily: 'AmiriQuran' },

  sheetBackdrop: { flex: 1, backgroundColor: '#000A', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.bgElevated || colors.bg,
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: 12,
    borderTopWidth: 1, borderColor: colors.gold + '44',
  },
  sheetTitle: { color: colors.gold, fontSize: 14, fontWeight: '800', textAlign: 'center', paddingVertical: 12 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 8 },
  sheetRowLabel: { color: colors.text, fontSize: 15 },
  sheetLabel: { color: colors.silver, fontSize: 12, marginBottom: 8, letterSpacing: 1.2 },
});
