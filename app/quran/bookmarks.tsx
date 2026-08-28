/**
 * Qur'an bookmarks — free feature, on-device only.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  FlatList, Pressable, StyleSheet, Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { useQuranReader } from '../../src/quran/store';
import { useApp } from '../../src/store/useApp';
import { colors, spacing, radius, type as ty } from '../../src/theme';

export default function QuranBookmarksScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const lang = useApp((s) => s.lang);
  const { bookmarks, removeBookmark } = useQuranReader();

  const L = (en: string, ar: string, ur: string) => lang === 'ar' ? ar : lang === 'ur' ? ur : en;

  const sorted = [...bookmarks].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <ScreenHeader title={L('Qur\'ān bookmarks', 'إشارات القرآن', 'قرآنی بک مارک')} showBack />
      {sorted.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="bookmarks-outline" size={48} color={colors.gold + '77'} />
          <Text style={styles.emptyTitle}>
            {L('No bookmarks yet', 'لا توجد إشارات', 'ابھی کوئی بک مارک نہیں')}
          </Text>
          <Text style={styles.emptySub}>
            {L('Long-press any ayah on the mushaf page to save it here.',
              'اضغط مطولاً على أي آية لحفظها هنا.',
              'کسی بھی آیت پر لمبا دبائیں تاکہ محفوظ ہو۔')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ padding: spacing.md, gap: 8 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/quran/page/${item.page}` as any)}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.gold + '11' }]}
            >
              <View style={styles.icon}>
                <Ionicons name={item.kind === 'page' ? 'document-text' : 'bookmark'}
                          size={18} color={colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>
                  {item.kind === 'ayah'
                    ? `${item.surahNameEn || ''}  ·  ${item.surah}:${item.verse}`
                    : `${L('Mushaf page', 'صفحة المصحف', 'صفحہ مصحف')} ${item.page}`}
                </Text>
                <Text style={styles.rowSub}>
                  {L('Page', 'صفحة', 'صفحہ')} {item.page}
                  {item.note ? `  ·  ${item.note}` : ''}
                </Text>
              </View>
              <Pressable onPress={() => removeBookmark(item.id)} hitSlop={12} style={{ padding: 6 }}>
                <Ionicons name="trash-outline" size={18} color={colors.silver} />
              </Pressable>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyTitle: { ...ty.h2, color: colors.text },
  emptySub: { ...ty.small, color: colors.silver, textAlign: 'center' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.gold + '33',
    backgroundColor: colors.gold + '08',
  },
  icon: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.gold + '18', borderWidth: 1, borderColor: colors.gold + '44',
  },
  rowTitle: { ...ty.body, color: colors.text, fontWeight: '700' },
  rowSub: { ...ty.small, color: colors.silver, marginTop: 2 },
});
