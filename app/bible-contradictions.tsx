/**
 * Bible Contradictions screen.
 *
 * Opens with the Qur'ānic refutation (Q 4:82 + Q 15:9), a scholarly preamble,
 * and lists 40 fact-based, sourced internal Bible contradictions. Trilingual
 * (EN / AR / UR) — falls back to EN when AR/UR translations are still
 * pending. First-three free; the rest gated behind the £0.99 unlock.
 *
 * Data: bundled JSON at /app/app3_frontend/src/data_bible_contradictions.json
 * (kept in sync with /app/app3_backend/data/bible_contradictions_seed.json).
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../src/components/Card';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { useApp } from '../src/store/useApp';
import { LockBanner, LockedTile, FREE_PREVIEW_LIMIT } from '../src/iap/gate';
import { colors, radius, spacing, type as ty } from '../src/theme';

import raw from '../src/data_bible_contradictions.json';

interface Intro {
  arabic_q_4_82: string; translation_q_4_82_en: string; translation_q_4_82_ar: string; translation_q_4_82_ur: string;
  arabic_q_15_9: string; translation_q_15_9_en: string; translation_q_15_9_ar: string; translation_q_15_9_ur: string;
  preamble_en: string; preamble_ar: string; preamble_ur: string;
}
interface Item {
  slug: string;
  topic: string; topic_ar?: string; topic_ur?: string;
  claim_a: string; claim_a_ar?: string; claim_a_ur?: string;
  claim_b: string; claim_b_ar?: string; claim_b_ur?: string;
  note?: string;   note_ar?: string;   note_ur?: string;
}

const data = raw as unknown as { intro: Intro; items: Item[]; _disclaimer?: string };

export default function BibleContradictionsScreen() {
  const insets = useSafeAreaInsets();
  const lang = useApp((s) => s.lang);
  const unlocked = useApp((s) => s.unlocked);
  const rtl = lang === 'ar' || lang === 'ur';
  const [active, setActive] = useState<Item | null>(null);

  // Locale-aware field picker — handles both naming styles:
  //   (a) field + lang-suffix (e.g. topic / topic_ar / topic_ur) used in items
  //   (b) field_en / field_ar / field_ur used in the intro block
  const pick = (obj: any, field: string): string => {
    if (!obj) return '';
    if (lang === 'ar' || lang === 'ur') {
      const v = obj[`${field}_${lang}`];
      if (typeof v === 'string' && v.trim().length > 0) return v;
    }
    // EN: prefer raw field, fall back to _en suffix
    return obj[field] || obj[`${field}_en`] || '';
  };

  const title = lang === 'ar' ? 'تناقضات الكتاب المقدّس'
               : lang === 'ur' ? 'بائبل کے تضادات'
               : 'Bible Contradictions';
  const subtitle = lang === 'ar' ? '٤٠ تناقضًا داخليًّا موثَّقًا'
                  : lang === 'ur' ? '۴۰ اندرونی تضادات، باحوالہ'
                  : '40 sourced internal contradictions';

  const preamble = useMemo(() => pick(data.intro, 'preamble'), [lang]);  // eslint-disable-line react-hooks/exhaustive-deps
  const q482 = useMemo(() => pick(data.intro, 'translation_q_4_82'), [lang]);  // eslint-disable-line react-hooks/exhaustive-deps
  const q159 = useMemo(() => pick(data.intro, 'translation_q_15_9'), [lang]);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title={title}
        subtitle={subtitle}
        showBack={!!active}
        rightAction={active ? { icon: 'close', onPress: () => setActive(null) } : undefined}
      />
      {active ? (
        // ── DETAIL ──
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl, gap: spacing.md }}>
          <Text style={[styles.detailTitle, { textAlign: rtl ? 'right' : 'left' }]}>{pick(active, 'topic')}</Text>

          <Card accent={colors.rose}>
            <View style={[styles.secHeader, rtl && { flexDirection: 'row-reverse' }]}>
              <Ionicons name="book-outline" size={14} color={colors.rose} />
              <Text style={[styles.secLabel, { color: colors.rose }]}>
                {lang === 'ar' ? 'النصّ (أ)' : lang === 'ur' ? 'بیان (الف)' : 'CLAIM A'}
              </Text>
            </View>
            <Text style={[styles.body, { textAlign: rtl ? 'right' : 'left' }]}>{pick(active, 'claim_a')}</Text>
          </Card>

          <Card accent={colors.amberHi}>
            <View style={[styles.secHeader, rtl && { flexDirection: 'row-reverse' }]}>
              <Ionicons name="book-outline" size={14} color={colors.amberHi} />
              <Text style={[styles.secLabel, { color: colors.amberHi }]}>
                {lang === 'ar' ? 'النصّ (ب)' : lang === 'ur' ? 'بیان (ب)' : 'CLAIM B'}
              </Text>
            </View>
            <Text style={[styles.body, { textAlign: rtl ? 'right' : 'left' }]}>{pick(active, 'claim_b')}</Text>
          </Card>

          {pick(active, 'note') ? (
            <Card accent={colors.gold}>
              <View style={[styles.secHeader, rtl && { flexDirection: 'row-reverse' }]}>
                <Ionicons name="alert-circle-outline" size={14} color={colors.gold} />
                <Text style={[styles.secLabel, { color: colors.gold }]}>
                  {lang === 'ar' ? 'ملاحظة' : lang === 'ur' ? 'نوٹ' : 'NOTE'}
                </Text>
              </View>
              <Text style={[styles.body, { textAlign: rtl ? 'right' : 'left' }]}>{pick(active, 'note')}</Text>
            </Card>
          ) : null}

          <Text style={styles.disclaimer}>
            {lang === 'ar'
              ? 'العرض باحترام — والتناقض داخل صفحات الكتاب المقدّس نفسه.'
              : lang === 'ur'
              ? 'احترام کے ساتھ پیش کیا گیا — یہ تضادات خود بائبل کے صفحات کے اندر ہیں۔'
              : 'Presented respectfully — the contradiction exists within the Bible’s own pages.'}
          </Text>
        </ScrollView>
      ) : (
        // ── LIST + INTRO ──
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl, gap: spacing.sm }}>
          {/* Q 4:82 hero verse */}
          <LinearGradient
            colors={['#1d4a3d', colors.gold + '55', '#0e1f1a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroInner}>
              <View style={[styles.heroChip, rtl && { flexDirection: 'row-reverse' }]}>
                <Ionicons name="sparkles" size={11} color={colors.gold} />
                <Text style={styles.heroChipTxt}>
                  {lang === 'ar' ? 'تحدّي القرآن  ·  النساء ٤:٨٢' : lang === 'ur' ? 'قرآنی چیلنج  ·  النساء ۴:۸۲' : 'THE QURʾĀNIC CHALLENGE  ·  al-Nisāʾ 4:82'}
                </Text>
              </View>
              <Text style={styles.arabicLg}>{data.intro.arabic_q_4_82}</Text>
              <View style={styles.heroDivider} />
              <Text style={[styles.translation, { textAlign: rtl ? 'right' : 'left' }]}>
                {q482}
              </Text>
            </View>
          </LinearGradient>

          {/* Q 15:9 second hero */}
          <LinearGradient
            colors={['#3a2a4e', colors.gold + '44', '#0e1f1a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroInner}>
              <View style={[styles.heroChip, rtl && { flexDirection: 'row-reverse' }]}>
                <Ionicons name="shield-checkmark" size={11} color={colors.gold} />
                <Text style={styles.heroChipTxt}>
                  {lang === 'ar' ? 'حفظ القرآن  ·  الحجر ١٥:٩' : lang === 'ur' ? 'حفاظتِ قرآن  ·  الحجر ۱۵:۹' : 'THE QURʾĀN PRESERVED  ·  al-Ḥijr 15:9'}
                </Text>
              </View>
              <Text style={styles.arabicLg}>{data.intro.arabic_q_15_9}</Text>
              <View style={styles.heroDivider} />
              <Text style={[styles.translation, { textAlign: rtl ? 'right' : 'left' }]}>
                {q159}
              </Text>
            </View>
          </LinearGradient>

          {/* Preamble */}
          <Card accent={colors.gold}>
            <Text style={[styles.preambleHead, { textAlign: rtl ? 'right' : 'left' }]}>
              {lang === 'ar' ? 'مقدّمة علميّة' : lang === 'ur' ? 'علمی تمہید' : 'A SCHOLARLY PREAMBLE'}
            </Text>
            <Text style={[styles.preamble, { textAlign: rtl ? 'right' : 'left' }]}>{preamble}</Text>
          </Card>

          <LockBanner />

          <Text style={[styles.kicker, { textAlign: rtl ? 'right' : 'left', marginTop: spacing.md }]}>
            {lang === 'ar' ? '٤٠ تناقضًا  ·  مع الإشارة إلى الإصحاح والآية'
             : lang === 'ur' ? '۴۰ تضادات  ·  باب اور آیت کے حوالے سے'
             : '40 CONTRADICTIONS  ·  CITED CHAPTER & VERSE'}
          </Text>

          {data.items.map((it, idx) => {
            const locked = !unlocked && idx >= FREE_PREVIEW_LIMIT;
            return (
              <LockedTile key={it.slug} locked={locked} onPress={() => setActive(it)}>
                <Card>
                  <View style={[styles.itemHead, rtl && { flexDirection: 'row-reverse' }]}>
                    <View style={styles.itemNum}>
                      <Text style={styles.itemNumTxt}>{idx + 1}</Text>
                    </View>
                    <Text style={[styles.itemTitle, { textAlign: rtl ? 'right' : 'left', flex: 1 }]} numberOfLines={3}>
                      {pick(it, 'topic')}
                    </Text>
                    <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={16} color={colors.silverDim} />
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
  hero: { borderRadius: radius.lg, padding: 2, overflow: 'hidden', marginBottom: spacing.xs },
  heroInner: { backgroundColor: colors.bg + 'F2', borderRadius: radius.lg - 2, padding: spacing.lg, gap: spacing.sm, borderWidth: 1, borderColor: colors.gold + '44' },
  heroChip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.gold + '88', backgroundColor: colors.gold + '18' },
  heroChipTxt: { ...ty.label, color: colors.gold, fontSize: 10 },
  arabicLg: { ...ty.arabicLarge, color: colors.parchment, textAlign: 'right', marginTop: 4, fontSize: 22, lineHeight: 40 },
  heroDivider: { height: 1, backgroundColor: colors.gold + '44', marginVertical: 4 },
  translation: { ...ty.body, color: colors.text, fontStyle: 'italic', lineHeight: 22 },

  preambleHead: { ...ty.label, color: colors.gold, fontSize: 11, letterSpacing: 2, marginBottom: spacing.sm },
  preamble: { ...ty.body, color: colors.text, lineHeight: 22 },

  kicker: { ...ty.label, color: colors.silverDim, fontSize: 11, marginBottom: 4, letterSpacing: 2 },

  itemHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.gold + '22', borderWidth: 1, borderColor: colors.gold + '66', alignItems: 'center', justifyContent: 'center' },
  itemNumTxt: { color: colors.gold, fontWeight: '800', fontSize: 12 },
  itemTitle: { ...ty.body, color: colors.text, fontWeight: '600', lineHeight: 20 },

  detailTitle: { ...ty.h2, color: colors.silverHi, marginBottom: spacing.sm },
  secHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  secLabel: { ...ty.label, fontSize: 11 },
  body: { ...ty.body, color: colors.text, lineHeight: 22 },
  disclaimer: { ...ty.tiny, color: colors.textMuted, fontStyle: 'italic', lineHeight: 16, paddingHorizontal: spacing.xs, marginTop: spacing.sm },
});
