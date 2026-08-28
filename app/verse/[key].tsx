/**
 * Verse detail page reached from the Recite tab match results.
 * Shows: Arabic ayah → 4-tafseer cards → optional Scientific reading.
 */
import { Ionicons } from '@expo/vector-icons';
import { t } from '../../src/i18n/strings';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../src/components/Card';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { VerseAudioButton } from '../../src/components/VerseAudioButton';
import { isBookmarked, toggleBookmark, useBookmarks } from '../../src/store/bookmarks';
import { useApp } from '../../src/store/useApp';
import { colors, spacing, type as ty } from '../../src/theme';

const BASE = process.env.EXPO_PUBLIC_QBS_API_URL || '';

// Signature verse (Sūrat Fuṣṣilat 41:53) is the golden hero on the home
// screen. Its tafseer stays FREE forever as a first-taste for new users;
// every other verse's tafseer is gated behind the £0.99 lifetime unlock.
const SIGNATURE_VERSE_KEY = '41:53';

interface VerseFull {
  found: boolean;
  key: string;
  surah: number;
  verse: number;
  surah_name_en: string;
  text: string;
  tafseers: { source: string; lang: string; paragraphs: string[] }[];
  scientific: null | { slug: string; ref: string; topic: string; science_hook?: string };
}

const SOURCE_LABEL: Record<string, string> = {
  'ibn-kathir': 'Tafsīr Ibn Kathīr',
  'ibn_kathir': 'Tafsīr Ibn Kathīr',
  'al-saadi': 'Tafsīr al-Saʿdī',
  'al_saadi': 'Tafsīr al-Saʿdī',
  'al-muyassar': 'Al-Tafsīr al-Muyassar',
  'al_muyassar': 'Al-Tafsīr al-Muyassar',
  'al-jalalayn': 'Tafsīr al-Jalālayn',
  'al_jalalayn': 'Tafsīr al-Jalālayn',
};

export default function VerseFullPage() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const lang = useApp((s) => s.lang);
  const rtl = lang === 'ar' || lang === 'ur';
  const unlocked = useApp((s) => s.unlocked === true);
  const [data, setData] = useState<VerseFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  useBookmarks();

  // Paywall gate: signature verse (41:53) stays free forever; every other
  // verse's tafseer requires the £0.99 lifetime unlock. We resolve this
  // BEFORE hitting the network so locked users never see a broken /
  // spinning screen — they get a clear upgrade prompt instead.
  const isSignatureVerse = String(key) === SIGNATURE_VERSE_KEY;
  const requiresUnlock = !isSignatureVerse && !unlocked;

  useEffect(() => {
    let cancelled = false;

    if (requiresUnlock) {
      // Skip the network entirely — we'll render the paywall prompt below.
      setLoading(false);
      return;
    }

    /** Fetch with a hard timeout AND automatic retry (Render cold-starts on
     *  the free-ish Starter tier can take 20-40s before the first response). */
    async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), timeoutMs);
      try {
        return await fetch(url, {
          signal: ac.signal,
          headers: { 'Accept': 'application/json', 'Cache-Control': 'no-cache' },
        });
      } finally {
        clearTimeout(t);
      }
    }

    async function attempt(): Promise<VerseFull> {
      if (!BASE) throw new Error('BASE=empty (build missing EXPO_PUBLIC_QBS_API_URL)');
      // Colons in URL paths are RFC-3986 legal. Skip encodeURIComponent —
      // %3A was silently breaking Sentry's fetch-instrumentation on iOS.
      const url = `${BASE}/api/verse/${String(key)}/full`;
      // 3 attempts: 8s → 20s → 40s. Handles Render cold-start reliably.
      const timeouts = [8000, 20000, 40000];
      let lastErr: any = null;
      for (let i = 0; i < timeouts.length; i++) {
        try {
          const res = await fetchWithTimeout(url, timeouts[i]);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const body = (await res.json()) as VerseFull;
          if (!body || body.found !== true) throw new Error('found=false');
          return body;
        } catch (e: any) {
          lastErr = e;
          // Try again unless we've exhausted retries.
          if (i < timeouts.length - 1) {
            await new Promise((r) => setTimeout(r, 400 * (i + 1)));
          }
        }
      }
      throw lastErr || new Error('Unknown fetch error');
    }

    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const body = await attempt();
        if (!cancelled) setData(body);
      } catch (e: any) {
        if (!cancelled) {
          setLoadError(e?.message || String(e));
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [key, requiresUnlock]);

  // ── Locked paywall screen (any non-signature verse when user hasn't paid) ──
  if (requiresUnlock) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
        <ScreenHeader title={lang === 'en' ? 'Unlock tafseer' : lang === 'ar' ? 'افتح التفسير' : 'تفسیر انلاک'} showBack />
        <View style={{ padding: 24, gap: 18, marginTop: 8 }}>
          <View style={{ alignItems: 'center', gap: 12, paddingVertical: 24 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.gold + '22', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.gold + '77' }}>
              <Ionicons name="lock-closed" size={32} color={colors.gold} />
            </View>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800', textAlign: 'center' }}>
              {lang === 'en' ? 'Tafseer requires unlock' :
               lang === 'ar' ? 'التفسير يتطلب الفتح' :
               'تفسیر کے لیے انلاک درکار'}
            </Text>
            <Text style={{ color: colors.silver, fontSize: 14, textAlign: 'center', lineHeight: 22, paddingHorizontal: 12 }}>
              {lang === 'en'
                ? 'One-time £0.99 unlock gives lifetime access to all 6 tafseer sources across every one of the 6,236 verses — plus "Ask a Sheikh" AI answers.'
                : lang === 'ar'
                ? 'افتح مرة واحدة بـ ٠٫٩٩ جنيه لتحصل على وصول مدى الحياة لجميع التفاسير الستة عبر آيات القرآن كافّة، مع «اسأل الشيخ».'
                : 'ایک بار £0.99 میں انلاک کریں اور تمام ۶ تفاسیر و "شیخ سے پوچھیں" کی تاحیات رسائی حاصل کریں۔'}
            </Text>
            <Text style={{ color: colors.gold + 'BB', fontSize: 12, textAlign: 'center', paddingTop: 4 }}>
              {lang === 'en' ? '✨ Fussilat 41:53 tafseer remains free forever' :
               lang === 'ar' ? '✨ تفسير سورة فصلت ٤١:٥٣ مجاني دائماً' :
               '✨ سورۃ فصلت 41:53 کی تفسیر ہمیشہ مفت'}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/unlock' as any)}
            style={{ backgroundColor: colors.gold, paddingVertical: 14, borderRadius: 999, alignItems: 'center' }}
          >
            <Text style={{ color: colors.bg, fontWeight: '800', fontSize: 15 }}>
              {lang === 'en' ? 'Unlock for £0.99' :
               lang === 'ar' ? 'افتح بـ ٠٫٩٩ جنيه' :
               '£0.99 میں انلاک کریں'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push(`/verse/${SIGNATURE_VERSE_KEY}` as any)}
            style={{ paddingVertical: 10, alignItems: 'center' }}
          >
            <Text style={{ color: colors.silver, fontSize: 13 }}>
              {lang === 'en' ? 'Preview free tafseer instead →' :
               lang === 'ar' ? 'شاهد التفسير المجاني بدلاً من ذلك →' :
               'مفت تفسیر دیکھیں →'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
      <ActivityIndicator color={colors.silver} />
    </View>
  );
  if (!data || !data.found) return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <ScreenHeader title={t('a3_key_verseNotFound') || 'Tafseer unavailable'} showBack />
      <View style={{ padding: 24, gap: 16 }}>
        <Text style={{ color: colors.silver, fontSize: 15, lineHeight: 22 }}>
          {lang === 'en' ? 'We could not load the tafseer for this verse right now. The server may be waking up — please try again in a few seconds.' :
           lang === 'ar' ? 'تعذّر تحميل التفسير الآن. قد يكون الخادم في وضع الاستيقاظ — يرجى المحاولة بعد بضع ثوانٍ.' :
           'ابھی تفسیر لوڈ نہیں ہو سکی۔ سرور بیدار ہو رہا ہو گا — چند لمحوں بعد دوبارہ کوشش کریں۔'}
        </Text>
        {loadError && (
          <Text style={{ color: colors.silver + '99', fontSize: 12, fontFamily: 'Menlo' }}>
            {`Details: ${loadError}`}
          </Text>
        )}
        <Pressable
          onPress={() => { setData(null); setLoading(true); setLoadError(null); /* re-run effect */ router.replace(`/verse/${String(key)}` as any); }}
          style={{ backgroundColor: colors.gold, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999, alignSelf: 'flex-start' }}
        >
          <Text style={{ color: colors.bg, fontWeight: '800' }}>
            {lang === 'en' ? 'Try again' : lang === 'ar' ? 'حاول مجدداً' : 'دوبارہ کوشش'}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title={`${data.surah_name_en} · ${data.key}`}
        showBack
        rightAction={{
          icon: isBookmarked('verse', data.key) ? 'bookmark' : 'bookmark-outline',
          onPress: () => { toggleBookmark('verse', data.key); },
        }}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
        {/* Hero — the ayah itself */}
        <LinearGradient
          colors={[colors.silver + '22', colors.bg]}
          style={styles.hero}
        >
          <Text style={styles.kicker}>SŪRAH {data.surah} · ĀYAH {data.verse}</Text>
          <Text style={styles.arabic}>{data.text}</Text>
          <View style={{ alignItems: 'center', marginTop: 14 }}>
            <VerseAudioButton verseKey={data.key} size="md" showLabel label="🎧 Listen — Sh. Mishary al-‘Afāsy" />
          </View>
        </LinearGradient>

        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          {/* Ask Sheikh deep-link — keeps the Mic→Verse→Tafseer→Sheikh loop closed */}
          <Card accent={colors.rose} onPress={() => {
            const q = lang === 'en' ? `Please explain Qur'an ${data.key} — its tafseer and any modern scientific reading.` :
                     lang === 'ar' ? `اشرح لي القرآن ${data.key} — التفسير وأيّ قراءة علمية حديثة.` :
                     `قرآن ${data.key} کی وضاحت فرمائیں — تفسیر اور کوئی جدید سائنسی قراءت۔`;
            router.push({ pathname: '/(tabs)/sheikh', params: { prefill: q } } as any);
          }}>
            <View style={[styles.row, rtl && { flexDirection: 'row-reverse' }]}>
              <Ionicons name="sparkles" size={18} color={colors.rose} />
              <Text style={[styles.scienceLabel, { color: colors.rose, flex: 1 }]}>
                {lang === 'en' ? 'ASK THE SHEIKH ABOUT THIS VERSE' :
                 lang === 'ar' ? 'اسأل الشيخ عن هذه الآية' :
                 'اس آیت پر شیخ سے پوچھیں'}
              </Text>
              <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.silverDim} />
            </View>
          </Card>

          {/* Scientific link if present */}
          {data.scientific ? (
            <Card accent={colors.silver} onPress={() => router.push(`/entry/${data.scientific!.slug}` as any)}>
              <View style={[styles.row, rtl && { flexDirection: 'row-reverse' }]}>
                <Ionicons name="telescope" size={20} color={colors.silver} />
                <Text style={styles.scienceLabel}>
                  {lang === 'en' ? 'A POSSIBLE SCIENTIFIC READING'
                   : lang === 'ar' ? 'قراءة علمية محتملة'
                   : 'ممکنہ سائنسی قراءت'}
                </Text>
                <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.silverDim} />
              </View>
              <Text style={[styles.sciTopic, { textAlign: rtl ? 'right' : 'left' }]}>{data.scientific.topic}</Text>
              {data.scientific.science_hook ? (
                <Text style={[styles.sciBody, { textAlign: rtl ? 'right' : 'left' }]} numberOfLines={3}>
                  {data.scientific.science_hook}
                </Text>
              ) : null}
              <Text style={styles.tapMore}>
                {lang === 'en' ? 'Tap for full reading →' : lang === 'ar' ? '← انقر للقراءة الكاملة' : '← مکمل پڑھیں'}
              </Text>
            </Card>
          ) : null}

          {/* Tafseer cards */}
          {data.tafseers.length === 0 ? (
            <Card accent={colors.gold}>
              <Text style={styles.label}>TAFSEER</Text>
              <Text style={styles.body}>
                {lang === 'en' ? 'Tafseer paragraphs for this verse are being indexed. Please check back shortly.'
                 : lang === 'ar' ? 'يتم فهرسة فقرات التفسير لهذه الآية. يُرجى الرجوع لاحقاً.'
                 : 'اس آیت کی تفسیر تیار کی جا رہی ہے۔ تھوڑی دیر بعد دوبارہ دیکھیں۔'}
              </Text>
            </Card>
          ) : (
            data.tafseers.map((t) => (
              <Card key={t.source} accent={colors.gold}>
                <View style={[styles.row, rtl && { flexDirection: 'row-reverse' }]}>
                  <Ionicons name="library" size={16} color={colors.gold} />
                  <Text style={[styles.label, { color: colors.gold, flex: 1 }]}>
                    {SOURCE_LABEL[t.source] || t.source.toUpperCase()}
                  </Text>
                </View>
                {t.paragraphs.map((p, i) => (
                  <Text key={i} style={[
                    styles.tafseerText,
                    t.lang === 'ar' && { textAlign: 'right', fontSize: 16, lineHeight: 28 },
                    i > 0 && { marginTop: spacing.sm },
                  ]}>{p}</Text>
                ))}
              </Card>
            ))
          )}

          {/* Aqeedah footer */}
          <View style={{ paddingHorizontal: spacing.sm, paddingTop: spacing.md }}>
            <Text style={[styles.footer, { textAlign: rtl ? 'right' : 'center' }]}>
              {lang === 'en' ? 'The traditional tafseer holds primacy. The scientific reading, where shown, is an inference, not a doctrine. Allah knows best.'
               : lang === 'ar' ? 'التفسير الكلاسيكي هو الأصل، والقراءة العلمية إن وُجدت استنباطٌ لا عقيدة. والله أعلم.'
               : 'کلاسیکی تفسیر اصل ہے؛ سائنسی قراءت (اگر دکھائی گئی ہو) ایک اخذِ مفہوم ہے، نہ کہ عقیدہ۔ واللہ اعلم۔'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, alignItems: 'flex-end' },
  kicker: { ...ty.label, color: colors.silver, marginBottom: spacing.md, alignSelf: 'flex-start' },
  arabic: { fontSize: 28, lineHeight: 50, color: colors.parchment, textAlign: 'right' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  scienceLabel: { ...ty.label, color: colors.silver, flex: 1 },
  sciTopic: { ...ty.h3, color: colors.silverHi, marginTop: 4 },
  sciBody: { ...ty.small, color: colors.textDim, marginTop: 6, lineHeight: 19 },
  tapMore: { ...ty.tiny, color: colors.silver, marginTop: spacing.sm, fontWeight: '700' },
  label: { ...ty.label, color: colors.silverDim, marginBottom: 6, fontSize: 10 },
  body: { ...ty.small, color: colors.textDim, lineHeight: 19 },
  tafseerText: { ...ty.body, color: colors.text, lineHeight: 22 },
  footer: { ...ty.tiny, color: colors.textMuted, lineHeight: 16, fontStyle: 'italic' },
});
