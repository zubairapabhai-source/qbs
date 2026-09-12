/**
 * QBS port of Struggle-Themed Verse.
 * Same data + logic as Treasures. ZERO backend, ZERO LLM.
 */
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radius, type } from '../src/theme';
import { currentLang } from '../src/i18n/strings';
import {
  STRUGGLES, STRUGGLE_VERSES, verseForToday,
  type Struggle,
} from '../src/struggleVerses';

const STORAGE_KEY = '@qbs:struggle_verse.pick.v1';

const TR = {
  title: { en: 'Verse for you', ar: 'آية لك', ur: 'آپ کے لیے آیت' },
  header_title: {
    en: 'A verse for what you carry today',
    ar: 'آية لِما تحمله اليوم',
    ur: 'آج آپ جو بوجھ اٹھائے ہیں، اس کے لیے ایک آیت',
  },
  header_sub: {
    en: 'Pick what weighs on your heart — a daily Qurʾānic anchor, refreshed every 24 hours.',
    ar: 'اختر ما يُثقل قلبك — رابط قرآني يومي يتجدّد كل ٢٤ ساعة.',
    ur: 'جو دل پر بوجھ ہے وہ منتخب کریں — ہر 24 گھنٹے بعد نئی قرآنی آیت۔',
  },
  pick_prompt: {
    en: 'Tap what fits — you can change it anytime.',
    ar: 'اضغط ما يناسبك — يمكنك التغيير في أي وقت.',
    ur: 'جو مناسب ہو دبائیں — آپ کبھی بھی بدل سکتے ہیں۔',
  },
  footer: {
    en: 'Refreshes daily. All 32 verses are hand-picked from the Qurʾān — no AI in the loop.',
    ar: 'يتجدد يوميًا. الآيات الـ٣٢ منتقاة بعناية من القرآن — بدون ذكاء اصطناعي.',
    ur: 'ہر روز نئی۔ تمام 32 آیات قرآن سے منتخب — کوئی AI نہیں۔',
  },
  done: { en: 'Done', ar: 'تم', ur: 'ہو گیا' },
};
function tr(k: keyof typeof TR): string {
  const l = currentLang() as 'en' | 'ar' | 'ur';
  return TR[k]?.[l] || TR[k]?.en || '';
}

export default function QbsStruggleVerseScreen() {
  const router = useRouter();
  const [pick, setPick] = useState<Struggle | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const lang = (currentLang() as 'en' | 'ar' | 'ur') || 'en';

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && STRUGGLE_VERSES[raw as Struggle]) setPick(raw as Struggle);
      } catch {}
      setHydrated(true);
    })();
  }, []);

  const choose = async (s: Struggle) => {
    setPick(s);
    try { await AsyncStorage.setItem(STORAGE_KEY, s); } catch {}
  };

  const meta = pick ? STRUGGLES.find((x) => x.key === pick) : null;
  const verse = pick ? verseForToday(pick) : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: tr('title'), headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.text }} />
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 60 }}>
        <View style={styles.header}>
          <Ionicons name="leaf-outline" size={22} color={colors.gold} />
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{tr('header_title')}</Text>
            <Text style={styles.headerSub}>{tr('header_sub')}</Text>
          </View>
        </View>

        {!hydrated ? null : !pick ? (
          <>
            <Text style={styles.pickPrompt}>{tr('pick_prompt')}</Text>
            <View style={styles.grid}>
              {STRUGGLES.map((s) => (
                <Pressable key={s.key} onPress={() => choose(s.key)} style={styles.tile}>
                  <Text style={styles.tileEmoji}>{s.emoji}</Text>
                  <Text style={styles.tileLabel}>{s.label[lang] || s.label.en}</Text>
                  <Text style={styles.tileBody} numberOfLines={2}>
                    {s.body[lang] || s.body.en}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : (
          <>
            <View style={styles.currentStrip}>
              <Text style={styles.currentEmoji}>{meta?.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.currentLabel}>{meta?.label[lang] || meta?.label.en}</Text>
                <Text style={styles.currentBody}>{meta?.body[lang] || meta?.body.en}</Text>
              </View>
              <Pressable onPress={() => setPick(null)} hitSlop={10}>
                <Ionicons name="swap-horizontal-outline" size={20} color={colors.gold} />
              </Pressable>
            </View>

            {verse && (
              <View style={styles.verseCard}>
                <Text style={styles.verseAr}>{verse.ar}</Text>
                <Text style={styles.verseRef}>{verse.ref}</Text>
                <View style={styles.verseDivider} />
                <Text style={styles.verseTr}>
                  {verse.translation[lang] || verse.translation.en}
                </Text>
              </View>
            )}

            <Text style={styles.note}>{tr('footer')}</Text>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backBtnText}>{tr('done')}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', gap: spacing.md, alignItems: 'center',
    padding: spacing.md, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.cardBorder,
    backgroundColor: colors.card, marginBottom: spacing.md,
  },
  headerTitle: { ...type.body, fontWeight: '700', color: colors.text },
  headerSub: { ...type.small, color: colors.textDim, marginTop: 2, lineHeight: 18 },

  pickPrompt: { ...type.small, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.md, fontStyle: 'italic' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.sm },
  tile: {
    width: '48.5%', padding: spacing.md,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.cardBorder,
    backgroundColor: colors.card, minHeight: 120,
  },
  tileEmoji: { fontSize: 26, marginBottom: 6 },
  tileLabel: { ...type.body, color: colors.text, fontWeight: '700' },
  tileBody: { ...type.small, color: colors.textDim, marginTop: 4, lineHeight: 17 },

  currentStrip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.gold,
    backgroundColor: 'rgba(232, 198, 106, 0.12)',
    marginBottom: spacing.md,
  },
  currentEmoji: { fontSize: 28 },
  currentLabel: { ...type.h3, color: colors.text },
  currentBody: { ...type.small, color: colors.textDim, marginTop: 2, lineHeight: 18 },

  verseCard: {
    padding: spacing.lg, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.cardBorder,
    backgroundColor: colors.card, marginBottom: spacing.md,
  },
  verseAr: { fontSize: 26, color: colors.gold, textAlign: 'center', lineHeight: 46, writingDirection: 'rtl' },
  verseRef: { fontSize: 11, color: colors.textMuted, letterSpacing: 1.4, marginTop: spacing.sm, textAlign: 'center' },
  verseDivider: { height: 1, backgroundColor: colors.cardBorder, marginVertical: spacing.md, opacity: 0.5 },
  verseTr: { ...type.body, color: colors.text, lineHeight: 26, textAlign: 'center' },

  note: { ...type.small, color: colors.textMuted, textAlign: 'center', fontStyle: 'italic', marginTop: spacing.sm, lineHeight: 18 },
  backBtn: { marginTop: spacing.md, paddingVertical: 12, borderRadius: radius.pill, backgroundColor: colors.gold, alignItems: 'center' },
  backBtnText: { color: colors.bg, fontWeight: '700', fontSize: 15 },
});
