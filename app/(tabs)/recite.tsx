/**
 * Recite tab — text/voice search across all 6,236 verses.
 * Native voice mic uses expo-speech-recognition (SDK 54 pin: 3.1.3).
 * Free, on-device on iOS 13+ and Android 13+ with cloud fallback.
 * Text input works against /api/quran/match-text.
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// expo-speech-recognition has no web fallback — lazy require with stubs so the
// preview / Expo Go bundle doesn't crash. On native builds these resolve to the
// real native module. Direct require (initial-commit style) works reliably
// on SDK 54 with expo-speech-recognition@3.1.3.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ExpoSpeechRecognitionModule: any = {
  requestPermissionsAsync: async () => ({ granted: false, canAskAgain: true, status: 'undetermined' }),
  getPermissionsAsync: async () => ({ granted: false, canAskAgain: true, status: 'undetermined' }),
  start: () => {},
  stop: () => {},
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let useSpeechRecognitionEvent: any = () => {};
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const sr = require('expo-speech-recognition');
  ExpoSpeechRecognitionModule = sr.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = sr.useSpeechRecognitionEvent;
} catch {}
import { Card } from '../../src/components/Card';
import { createWebSpeechRecognizer, isWebSpeechSupported, type WebSpeechSession } from '../../src/utils/webSpeech';
import { Empty } from '../../src/components/Empty';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { useApp } from '../../src/store/useApp';
import { t } from '../../src/i18n/strings';
import { colors, radius, spacing, type as ty } from '../../src/theme';

const BASE = process.env.EXPO_PUBLIC_QBS_API_URL || '';

interface MatchResult { key: string; surah: number; verse: number; surah_name_en: string; text: string; score: number; }

export default function ReciteScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const lang = useApp((s) => s.lang);
  const rtl = lang === 'ar' || lang === 'ur';
  const [transcript, setTranscript] = useState('');
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [recording, setRecording] = useState(false);
  const transcriptRef = useRef('');
  const webRecRef = useRef<WebSpeechSession | null>(null);

  // ── on-device speech recognition wiring (free) ──
  // Android returns transcripts in several shapes across OEMs & Google Speech
  // Service versions — read defensively so we never drop a valid transcript.
  useSpeechRecognitionEvent('result', (e: any) => {
    const r =
      e?.results?.[0]?.transcript ??
      e?.results?.[e?.results?.length - 1]?.transcript ??
      e?.value?.[0] ??
      e?.value ??
      e?.transcript ??
      '';
    if (typeof r === 'string' && r.length > 0) {
      transcriptRef.current = r;
      setTranscript(r);
    }
  });
  useSpeechRecognitionEvent('end', () => {
    setRecording(false);
    // Auto-search if we captured something. Use the REF (not state) because
    // React state hasn't necessarily flushed by the time this event fires,
    // and doMatch reads its argument directly.
    const captured = transcriptRef.current.trim();
    if (captured.length > 1) {
      setTimeout(() => doMatch(captured), 100);
    } else {
      // Mic session ended but Android's Speech Service returned nothing
      // (silence / OEM-specific quirks / offline recogniser). Surface an
      // empty-results panel so the user sees clearly what went wrong.
      setHasSearched(true);
      setResults([]);
    }
  });
  useSpeechRecognitionEvent('error', (e: any) => {
    setRecording(false);
    Alert.alert(
      lang === 'en' ? 'Voice error' : lang === 'ar' ? 'خطأ في الصوت' : 'آواز کی خرابی',
      e?.error || 'Speech recognition failed.'
    );
  });

  const doMatch = async (override?: string) => {
    // Prefer the argument (voice callback) → then ref → then state, so we
    // never fall back to a stale state read from an async event handler.
    const q = (override ?? transcriptRef.current ?? transcript).trim();
    if (q.length < 2) return;
    setLoading(true);
    setHasSearched(true);
    try {
      if (!BASE) {
        // Offline preview: synthesize a single mock result
        setResults([
          {
            key: '2:255', surah: 2, verse: 255, surah_name_en: 'Al-Baqarah',
            text: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ',
            score: 0.62,
          },
        ]);
      } else {
        const res = await fetch(`${BASE}/api/quran/match-text`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: q, top_k: 5 }),
        });
        const data = await res.json();
        setResults((data?.results || []) as MatchResult[]);
      }
    } catch {
      Alert.alert(lang === 'en' ? 'Search failed' : lang === 'ar' ? 'فشل البحث' : 'تلاش ناکام');
    } finally {
      setLoading(false);
    }
  };

  const onMicTap = async () => {
    if (recording) {
      // stop and let the `end` event fire
      try { ExpoSpeechRecognitionModule.stop(); webRecRef.current?.stop(); } catch {}
      setRecording(false);
      return;
    }

    // === WEB FALLBACK — Emergent preview / browser users ===
    if (Platform.OS === 'web') {
      if (!isWebSpeechSupported()) {
        Alert.alert(
          lang === 'en' ? 'Microphone — native only' : lang === 'ar' ? 'المايكروفون — التطبيق فقط' : 'مائیک — صرف ایپ میں',
          lang === 'en' ? 'Voice recitation in the web preview requires Chrome, Edge or Safari. On other browsers, please paste or type the āyah below. The full mic is available on iOS & Android.' :
          lang === 'ar' ? 'التلاوة الصوتية في معاينة الويب تتطلب Chrome أو Edge أو Safari. في المتصفحات الأخرى، يرجى لصق أو كتابة الآية أدناه.' :
          'ویب پیش نظارہ میں مائیک Chrome، Edge، یا Safari میں چلتا ہے۔ دیگر براؤزرز میں نیچے آیت پیسٹ یا ٹائپ کریں۔'
        );
        return;
      }
      const rec = createWebSpeechRecognizer();
      if (!rec) return;
      webRecRef.current = rec;
      transcriptRef.current = '';
      setTranscript('');
      setRecording(true);
      rec.start({
        lang: 'ar-SA',
        onResult: (text) => { transcriptRef.current = text; setTranscript(text); },
        onEnd: () => { setRecording(false); webRecRef.current = null; if (transcriptRef.current) doMatch(transcriptRef.current); },
        onError: (msg) => {
          setRecording(false);
          webRecRef.current = null;
          if (msg !== 'no-speech' && msg !== 'aborted') {
            Alert.alert(lang === 'en' ? 'Mic error' : lang === 'ar' ? 'خطأ المايكروفون' : 'مائیک کی خرابی', String(msg));
          }
        },
      });
      return;
    }

    // === NATIVE — iOS / Android with expo-speech-recognition ===
    try {
      // Best practice: check first, then request only if allowed.
      let perm = await ExpoSpeechRecognitionModule.getPermissionsAsync();
      if (!perm?.granted && perm?.canAskAgain !== false) {
        perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      }
      if (!perm?.granted) {
        const canReask = perm?.canAskAgain !== false;
        Alert.alert(
          lang === 'en' ? 'Microphone required' : lang === 'ar' ? 'المايكروفون مطلوب' : 'مائیک کی اجازت درکار',
          canReask
            ? (lang === 'en'
              ? 'Tap the mic again and allow microphone & speech recognition to recite a verse aloud.'
              : lang === 'ar'
              ? 'انقر المايكروفون مرة أخرى واسمح بالمايكروفون والتعرف على الكلام لتلاوة الآية.'
              : 'دوبارہ مائیک پر ٹیپ کریں اور مائیک و تقریر کی شناخت کی اجازت دیں۔')
            : (lang === 'en'
              ? 'Please enable Microphone and Speech Recognition for this app in Settings.'
              : lang === 'ar'
              ? 'يرجى تفعيل المايكروفون والتعرف على الكلام لهذا التطبيق في الإعدادات.'
              : 'براہ کرم سیٹنگز میں اس ایپ کے لیے مائیک اور تقریر کی شناخت فعال کریں۔'),
          canReask
            ? [{ text: 'OK' }]
            : [
                { text: lang === 'en' ? 'Cancel' : lang === 'ar' ? 'إلغاء' : 'منسوخ', style: 'cancel' },
                { text: lang === 'en' ? 'Open Settings' : lang === 'ar' ? 'فتح الإعدادات' : 'سیٹنگز کھولیں', onPress: () => Linking.openSettings() },
              ]
        );
        return;
      }
      transcriptRef.current = '';
      setTranscript('');
      setRecording(true);
      ExpoSpeechRecognitionModule.start({
        lang: 'ar-SA',          // recite is always Arabic
        interimResults: true,
        continuous: true,
        requiresOnDeviceRecognition: false,  // on-device when available; free cloud otherwise
        addsPunctuation: false,
      });
    } catch (e: any) {
      setRecording(false);
      Alert.alert('Mic error', e?.message || String(e));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title={lang === 'en' ? 'Recite a verse' : lang === 'ar' ? 'تلاوة آية' : 'آیت تلاش کریں'}
        subtitle={lang === 'en' ? 'Tap the mic, recite any āyah aloud — we match your voice across all 6,236 verses' : lang === 'ar' ? 'انقر المايكروفون واقرأ — نطابق صوتك بكل ٦٢٣٦ آية' : 'مائیک پر ٹیپ کریں اور آیت پڑھیں — ہم آپ کی آواز کو ۶۲۳۶ آیات سے ملاتے ہیں'}
        rightAction={{ icon: 'settings-outline', onPress: () => router.push('/settings') }}
      />

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 120 }}>
        {/* Mic hero */}
        <Pressable onPress={onMicTap} style={({ pressed }) => [styles.micWrap, pressed && { transform: [{ scale: 0.96 }] }]}>
          <LinearGradient
            colors={recording ? [colors.rose, '#a14d4d', '#7b3636'] : [colors.silverHi, colors.silver, colors.silverDim]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.micCircle}
          >
            <Ionicons name={recording ? 'stop' : 'mic'} size={42} color={colors.bg} />
          </LinearGradient>
          <Text style={styles.micHint}>
            {recording
              ? (lang === 'en' ? 'Listening… tap to stop' : lang === 'ar' ? 'يستمع… انقر للإيقاف' : 'سن رہا ہے… روکنے کے لیے ٹیپ کریں')
              : (lang === 'en' ? 'Tap to recite (free, on-device)' : lang === 'ar' ? 'انقر للتلاوة (مجاني، على الجهاز)' : 'تلاوت کے لیے ٹیپ کریں (مفت، آپ کے ڈیوائس پر)')}
          </Text>
        </Pressable>

        {/* Text fallback */}
        <Card>
          <Text style={styles.label}>
            {lang === 'en' ? 'OR PASTE / TYPE THE VERSE' :
              lang === 'ar' ? 'أو الصق / اكتب الآية' :
              'یا آیت پیسٹ / لکھیں'}
          </Text>
          <View style={[styles.inputBox, rtl && { flexDirection: 'row-reverse' }]}>
            <TextInput
              value={transcript}
              onChangeText={setTranscript}
              placeholder={lang === 'en' ? 'الحمد لله رب العالمين…' : lang === 'ar' ? 'الحمد لله رب العالمين…' : 'الحمد لله…'}
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { textAlign: 'right', fontSize: 18 }]}
              multiline
              maxLength={300}
              onSubmitEditing={doMatch}
            />
          </View>
          <Pressable
            onPress={doMatch}
            disabled={!transcript.trim() || loading}
            style={({ pressed }) => [styles.btn, (!transcript.trim() || loading) && { opacity: 0.4 }, pressed && { opacity: 0.85 }]}
          >
            {loading ? <ActivityIndicator color={colors.bg} /> : (
              <>
                <Ionicons name="search" size={18} color={colors.bg} />
                <Text style={styles.btnText}>
                  {lang === 'en' ? 'Find verse' : lang === 'ar' ? 'ابحث' : 'تلاش کریں'}
                </Text>
              </>
            )}
          </Pressable>
        </Card>

        {/* Results */}
        {hasSearched && !loading && results.length === 0 ? (
          <View style={styles.noResultsBox}>
            <Ionicons name={transcript ? 'search-outline' : 'mic-off-outline'} size={40} color={colors.silver + '99'} />
            <Text style={styles.noResultsTitle}>
              {transcript
                ? (lang === 'en' ? 'No matching verse found' :
                   lang === 'ar' ? 'لم يُعثر على آية مطابقة' :
                   'کوئی مماثل آیت نہیں ملی')
                : (lang === 'en' ? 'Mic didn\'t catch anything' :
                   lang === 'ar' ? 'لم يلتقط المايكروفون شيئًا' :
                   'مائیک نے کچھ نہیں پکڑا')}
            </Text>
            {transcript ? (
              <>
                <Text style={styles.noResultsHint}>
                  {lang === 'en' ? 'We heard:' :
                   lang === 'ar' ? 'ما سمعناه:' :
                   'ہم نے سنا:'}
                </Text>
                <Text style={styles.noResultsHeard}>「 {transcript} 」</Text>
                <Text style={styles.noResultsTip}>
                  {lang === 'en' ? 'Try reciting more slowly and closer to the microphone. Recitation should be in classical Arabic.' :
                   lang === 'ar' ? 'حاول التلاوة ببطء أكثر وقريباً من المايكروفون بالعربية الفصحى.' :
                   'زیادہ آہستہ اور مائیک کے قریب سے فصیح عربی میں تلاوت کریں۔'}
                </Text>
              </>
            ) : (
              <Text style={styles.noResultsTip}>
                {lang === 'en'
                  ? 'On Android, make sure "Google Speech Services" is set as your recogniser (Settings → Voice input). Speak Arabic close to the mic, not too quietly, and give it a couple of seconds.'
                  : lang === 'ar'
                    ? 'على أندرويد، تأكد من ضبط «خدمات الصوت من Google» كمُتعرِّف على الكلام (الإعدادات ← الإدخال الصوتي). اقرأ العربية قريبًا من المايكروفون بصوت واضح.'
                    : 'اینڈرائیڈ پر یقینی بنائیں کہ "Google Speech Services" کو تقریر پہچان کے طور پر منتخب کیا گیا ہے (سیٹنگز ← وائس ان پٹ)۔ عربی مائیک کے قریب واضح آواز میں پڑھیں۔'}
              </Text>
            )}
          </View>
        ) : null}

        {results.length > 0 ? (
          <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
            <Text style={styles.resultsHeader}>
              {lang === 'en' ? `${results.length} match${results.length === 1 ? '' : 'es'}` :
                lang === 'ar' ? `${results.length} نتيجة` :
                `${results.length} نتائج`}
            </Text>
            {results.map((r) => (
              <Card
                key={r.key}
                accent={colors.silver}
                onPress={() => router.push(`/verse/${r.key}` as any)}
                style={{ marginBottom: 6 }}
              >
                <View style={[styles.resHeader, rtl && { flexDirection: 'row-reverse' }]}>
                  <Text style={styles.resKey}>{r.surah_name_en} · {r.key}</Text>
                  <View style={styles.scoreChip}>
                    <Text style={styles.scoreText}>{Math.round(r.score * 100)}%</Text>
                  </View>
                </View>
                <Text style={styles.resArabic}>{r.text}</Text>
              </Card>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  micWrap: { alignItems: 'center', marginBottom: spacing.xl, marginTop: spacing.md },
  micCircle: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center', shadowColor: colors.silver, shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  micHint: { ...ty.small, color: colors.textMuted, marginTop: spacing.md, textAlign: 'center', fontSize: 11.5, letterSpacing: 0.3 },
  label: { ...ty.label, color: colors.silverDim, marginBottom: 8, fontSize: 10 },
  inputBox: { backgroundColor: colors.bgElevated, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.sm, marginBottom: spacing.md },
  input: { color: colors.text, minHeight: 60, lineHeight: 28 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: radius.pill, backgroundColor: colors.silver },
  btnText: { ...ty.h3, color: colors.bg, fontWeight: '800' },
  resultsHeader: { ...ty.label, color: colors.silverDim, marginBottom: 4, fontSize: 11 },
  noResultsBox: {
    marginTop: spacing.lg, alignItems: 'center', gap: 10,
    padding: spacing.xl, borderRadius: 22,
    backgroundColor: colors.silver + '0A',
    borderWidth: 1, borderColor: colors.silver + '22',
  },
  noResultsTitle: { ...ty.h3, color: colors.text, textAlign: 'center' },
  noResultsHint: { ...ty.label, color: colors.silverDim, fontSize: 11, marginTop: 8 },
  noResultsHeard: {
    color: colors.gold, fontSize: 20, textAlign: 'center',
    paddingHorizontal: 12, lineHeight: 32,
    fontFamily: 'AmiriQuran',
  },
  noResultsTip: {
    color: colors.silver + 'BB', fontSize: 12, textAlign: 'center',
    marginTop: 8, paddingHorizontal: 20, lineHeight: 18,
  },
  resHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  resKey: { ...ty.h3, color: colors.silverHi, fontSize: 14 },
  scoreChip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: colors.emerald + '22', borderWidth: 1, borderColor: colors.emerald + '55' },
  scoreText: { ...ty.tiny, color: colors.emerald, fontWeight: '800' },
  resArabic: { ...ty.arabic, color: colors.parchment, fontSize: 22, lineHeight: 38, textAlign: 'right' },
});
