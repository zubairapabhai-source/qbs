/**
 * Qur'an reader entry — Sūrah picker + resume-last-page hero.
 * Free feature (no paywall). Beautiful Amiri-Quran-Coloured typography.
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchSurahs, type SurahMeta } from '../../src/quran/api';
import { useQuranReader } from '../../src/quran/store';
import { useApp } from '../../src/store/useApp';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { colors, spacing, radius, type as ty } from '../../src/theme';

// Surah number → first Mushaf page (KFC/Madani print).
// Trivia baked in so the picker jumps directly to the surah's opening page.
const SURAH_FIRST_PAGE: Record<number, number> = {
  1: 1, 2: 2, 3: 50, 4: 77, 5: 106, 6: 128, 7: 151, 8: 177, 9: 187, 10: 208, 11: 221,
  12: 235, 13: 249, 14: 255, 15: 262, 16: 267, 17: 282, 18: 293, 19: 305, 20: 312,
  21: 322, 22: 332, 23: 342, 24: 350, 25: 359, 26: 367, 27: 377, 28: 385, 29: 396,
  30: 404, 31: 411, 32: 415, 33: 418, 34: 428, 35: 434, 36: 440, 37: 446, 38: 453,
  39: 458, 40: 467, 41: 477, 42: 483, 43: 489, 44: 496, 45: 499, 46: 502, 47: 507,
  48: 511, 49: 515, 50: 518, 51: 520, 52: 523, 53: 526, 54: 528, 55: 531, 56: 534,
  57: 537, 58: 542, 59: 545, 60: 549, 61: 551, 62: 553, 63: 554, 64: 556, 65: 558,
  66: 560, 67: 562, 68: 564, 69: 566, 70: 568, 71: 570, 72: 572, 73: 574, 74: 575,
  75: 577, 76: 578, 77: 580, 78: 582, 79: 583, 80: 585, 81: 586, 82: 587, 83: 587,
  84: 589, 85: 590, 86: 591, 87: 591, 88: 592, 89: 593, 90: 594, 91: 595, 92: 595,
  93: 596, 94: 596, 95: 597, 96: 597, 97: 598, 98: 598, 99: 599, 100: 599,
  101: 600, 102: 600, 103: 601, 104: 601, 105: 601, 106: 602, 107: 602, 108: 602,
  109: 603, 110: 603, 111: 603, 112: 604, 113: 604, 114: 604,
};

export default function QuranPickerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const lang = useApp((s) => s.lang);
  const rtl = lang === 'ar' || lang === 'ur';
  const { lastPage, bookmarks } = useQuranReader();

  const [surahs, setSurahs] = useState<SurahMeta[] | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      const d = await fetchSurahs();
      setSurahs(d?.surahs || []);
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!surahs) return [];
    const needle = q.trim().toLowerCase();
    if (!needle) return surahs;
    return surahs.filter((s) =>
      s.name_en.toLowerCase().includes(needle) ||
      s.name_ar.includes(needle) ||
      s.meaning_en.toLowerCase().includes(needle) ||
      String(s.number) === needle
    );
  }, [surahs, q]);

  const L = (en: string, ar: string, ur: string) => lang === 'ar' ? ar : lang === 'ur' ? ur : en;

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <ScreenHeader
        title={L('Read the Qur\'ān', 'اقرأ القرآن', 'قرآن پڑھیں')}
        showBack
        rightAction={{
          icon: 'bookmarks-outline',
          onPress: () => router.push('/quran/bookmarks' as any),
        }}
      />

      {/* Resume-last-page hero */}
      <Pressable
        onPress={() => router.push(`/quran/page/${lastPage}` as any)}
        style={({ pressed }) => [styles.heroWrap, pressed && { opacity: 0.85 }]}
      >
        <LinearGradient
          colors={[colors.gold + '22', colors.bg]}
          style={styles.hero}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.heroKicker}>
              {L('CONTINUE READING', 'تابع القراءة', 'پڑھنا جاری رکھیں')}
            </Text>
            <Text style={styles.heroTitle}>
              {L(`Page ${lastPage} of 604`, `الصفحة ${lastPage} من ٦٠٤`, `صفحہ ${lastPage} از ۶۰۴`)}
            </Text>
            <Text style={styles.heroSub}>
              {bookmarks.length > 0
                ? L(`${bookmarks.length} bookmark${bookmarks.length === 1 ? '' : 's'}`,
                    `${bookmarks.length} إشارة`,
                    `${bookmarks.length} بک مارک`)
                : L('Beautiful Uthmani Mushaf · Arabic + English + Urdu',
                    'مصحف عثماني · العربية والإنجليزية والأردية',
                    'خوبصورت عثمانی مصحف · عربی، انگریزی و اردو')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={28} color={colors.gold} />
        </LinearGradient>
      </Pressable>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={colors.silver} />
        <TextInput
          style={[styles.searchInput, rtl && { textAlign: 'right' }]}
          value={q}
          onChangeText={setQ}
          placeholder={L('Search sūrah by name or number…',
                        'ابحث بالاسم أو الرقم…',
                        'نام یا نمبر سے تلاش کریں…')}
          placeholderTextColor={colors.silver + '77'}
        />
      </View>

      {/* Surah list */}
      {surahs === null ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.number)}
          contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: spacing.md }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/quran/page/${SURAH_FIRST_PAGE[item.number] || 1}` as any)}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.gold + '11' }]}
            >
              <View style={styles.num}>
                <Text style={styles.numTxt}>{item.number}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>
                  {item.name_en}
                  <Text style={styles.rowTitleMeaning}>  ·  {item.meaning_en}</Text>
                </Text>
                <Text style={styles.rowSub}>
                  {item.ayah_count} {L('ayahs', 'آية', 'آیات')}  ·  {L(item.revelation_type,
                    item.revelation_type === 'Meccan' ? 'مكية' : 'مدنية',
                    item.revelation_type === 'Meccan' ? 'مکی' : 'مدنی')}
                </Text>
              </View>
              <Text style={styles.rowArName}>{item.name_ar}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  heroWrap: { marginHorizontal: spacing.md, marginBottom: spacing.md },
  hero: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: spacing.lg, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.gold + '55',
  },
  heroKicker: { ...ty.label, color: colors.gold, fontSize: 10, marginBottom: 4 },
  heroTitle: { ...ty.h2, color: colors.text, marginBottom: 2 },
  heroSub: { ...ty.small, color: colors.silver },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: spacing.md, marginBottom: spacing.md,
    paddingHorizontal: 14, height: 44, borderRadius: 999,
    backgroundColor: colors.bgElevated || colors.bg,
    borderWidth: 1, borderColor: colors.silver + '33',
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 15 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 8, borderRadius: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.gold + '22',
  },
  num: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.gold + '77',
    backgroundColor: colors.gold + '11',
  },
  numTxt: { color: colors.gold, fontWeight: '800', fontSize: 13 },
  rowTitle: { ...ty.body, color: colors.text, fontWeight: '700' },
  rowTitleMeaning: { color: colors.silver, fontWeight: '400', fontSize: 13 },
  rowSub: { ...ty.small, color: colors.silver, marginTop: 2 },
  rowArName: { fontFamily: 'AmiriQuran', color: colors.gold, fontSize: 22, fontWeight: '600' },
});
