/**
 * Ask Sheikh tab — chat UI w/ quota indicator and tafseer citations.
 */
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
// expo-speech-recognition lazy-loaded — no web fallback.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ExpoSpeechRecognitionModule: any = { requestPermissionsAsync: async () => ({ granted: false }), start: () => {}, stop: () => {} };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let useSpeechRecognitionEvent: any = () => {};
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const sr = require('expo-speech-recognition');
  ExpoSpeechRecognitionModule = sr.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = sr.useSpeechRecognitionEvent;
} catch {}
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../src/components/Card';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { askSheikh, type SheikhAnswer } from '../../src/api';
import { useApp } from '../../src/store/useApp';
import { t } from '../../src/i18n/strings';
import { colors, radius, spacing, type as ty } from '../../src/theme';
import { createWebSpeechRecognizer, isWebSpeechSupported } from '../../src/utils/webSpeech';

interface Msg { role: 'user' | 'sheikh'; text: string; snippets?: SheikhAnswer['snippets']; quota?: SheikhAnswer['quota']; }

const CHAT_KEY = '@qbs:sheikhChat';
const CHAT_MAX = 40; // keep last N messages on device

export default function SheikhScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const lang = useApp((s) => s.lang);
  const deviceId = useApp((s) => s.deviceId);
  const unlocked = useApp((s) => s.unlocked);
  const rtl = lang === 'ar' || lang === 'ur';
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [lastQuota, setLastQuota] = useState<{ used: number; free: number; balance: number } | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const webRecRef = useRef<ReturnType<typeof createWebSpeechRecognizer>>(null);
  const params = useLocalSearchParams<{ prefill?: string }>();

  // Pre-fill from deep-link (e.g. tapping "Ask Sheikh about this verse" on /verse/[key])
  useEffect(() => {
    const p = typeof params?.prefill === 'string' ? params.prefill : '';
    if (p) setInput(p);
  }, [params?.prefill]);

  // Voice ask — uses the same expo-speech-recognition the Recite tab uses
  useSpeechRecognitionEvent('result', (e: any) => {
    const r = e.results?.[0]?.transcript;
    if (typeof r === 'string') setInput(r);
  });
  useSpeechRecognitionEvent('end', () => { setRecording(false); });
  useSpeechRecognitionEvent('error', (e: any) => {
    setRecording(false);
    Alert.alert(
      lang === 'en' ? 'Voice error' : lang === 'ar' ? 'خطأ في الصوت' : 'آواز کی خرابی',
      e?.error || 'Speech recognition failed.'
    );
  });

  const onMicTap = async () => {
    if (recording) {
      try { ExpoSpeechRecognitionModule.stop(); webRecRef.current?.stop(); } catch {}
      setRecording(false);
      return;
    }

    const recogLang = lang === 'ar' ? 'ar-SA' : lang === 'ur' ? 'ur-PK' : 'en-GB';

    // === WEB FALLBACK — preview / browser users ===
    if (Platform.OS === 'web') {
      if (!isWebSpeechSupported()) {
        Alert.alert(
          lang === 'en' ? 'Microphone — native only' : lang === 'ar' ? 'المايكروفون — التطبيق فقط' : 'مائیک — صرف ایپ میں',
          lang === 'en' ? 'Voice input on the web preview requires Chrome, Edge or Safari. On other browsers, please type your question. The full mic works on the iOS & Android apps.' :
          lang === 'ar' ? 'الإدخال الصوتي في معاينة الويب يتطلب Chrome أو Edge أو Safari. في المتصفحات الأخرى، يرجى كتابة سؤالك.' :
          'ویب پیش نظارہ میں مائیک Chrome، Edge، یا Safari میں کام کرتا ہے۔ دیگر براؤزرز میں براہ کرم لکھیں۔'
        );
        return;
      }
      const rec = createWebSpeechRecognizer();
      if (!rec) return;
      webRecRef.current = rec;
      setRecording(true);
      rec.start({
        lang: recogLang,
        onResult: (text, _isFinal) => setInput(text),
        onEnd: () => { setRecording(false); webRecRef.current = null; },
        onError: (msg) => {
          setRecording(false);
          webRecRef.current = null;
          // 'no-speech' is common — silently ignore
          if (msg !== 'no-speech' && msg !== 'aborted') {
            Alert.alert(lang === 'en' ? 'Mic error' : lang === 'ar' ? 'خطأ المايكروفون' : 'مائیک کی خرابی', String(msg));
          }
        },
      });
      return;
    }

    // === NATIVE — iOS / Android with expo-speech-recognition ===
    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          lang === 'en' ? 'Microphone required' : lang === 'ar' ? 'المايكروفون مطلوب' : 'مائیک کی اجازت درکار',
          lang === 'en' ? 'Enable microphone & speech recognition in Settings.' :
          lang === 'ar' ? 'يرجى تفعيل المايكروفون والتعرف على الكلام في الإعدادات.' :
          'سیٹنگز میں مائیک اور تقریر کی شناخت فعال کریں۔'
        );
        return;
      }
      setRecording(true);
      ExpoSpeechRecognitionModule.start({
        lang: recogLang,
        interimResults: true,
        continuous: true,
        requiresOnDeviceRecognition: false,
        addsPunctuation: true,
      });
    } catch (e: any) {
      setRecording(false);
      Alert.alert(
        lang === 'en' ? 'Mic error' : lang === 'ar' ? 'خطأ المايكروفون' : 'مائیک کی خرابی',
        e?.message || String(e)
      );
    }
  };

  // Restore persisted chat on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CHAT_KEY);
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr) && arr.length) {
            setMsgs(arr);
            const lastWithQuota = [...arr].reverse().find((m: Msg) => m.quota);
            if (lastWithQuota?.quota) {
              setLastQuota({
                used: lastWithQuota.quota.weekly_used,
                free: lastWithQuota.quota.free_per_week,
                balance: lastWithQuota.quota.pack_balance,
              });
            }
          }
        }
      } catch {}
    })();
  }, []);

  // Persist on every change (keep most recent CHAT_MAX)
  useEffect(() => {
    const trimmed = msgs.slice(-CHAT_MAX);
    AsyncStorage.setItem(CHAT_KEY, JSON.stringify(trimmed)).catch(() => {});
  }, [msgs]);

  const clearChat = () => {
    setMsgs([]);
    AsyncStorage.removeItem(CHAT_KEY).catch(() => {});
  };

  const send = async () => {
    const q = input.trim();
    if (!q || sending) return;
    setMsgs((m) => [...m, { role: 'user', text: q }]);
    setInput('');
    setSending(true);
    scrollRef.current?.scrollToEnd({ animated: true });
    const res = await askSheikh(q, deviceId || 'preview', lang);
    if (res.ok && res.data) {
      setMsgs((m) => [...m, { role: 'sheikh', text: res.data!.answer, snippets: res.data!.snippets, quota: res.data!.quota }]);
      if (res.data.quota) {
        setLastQuota({ used: res.data.quota.weekly_used, free: res.data.quota.free_per_week, balance: res.data.quota.pack_balance });
      }
    } else if (res.status === 402) {
      setMsgs((m) => [...m, { role: 'sheikh', text: '🔒 ' + (res.error?.detail?.message || 'Premium required.') }]);
    } else {
      setMsgs((m) => [...m, { role: 'sheikh', text:
        lang === 'en' ? 'Network error. Please retry.'
        : lang === 'ar' ? 'خطأ في الشبكة. حاول مرة أخرى.'
        : 'نیٹ ورک کی خرابی۔ براہ کرم دوبارہ کوشش کریں۔'
      }]);
    }
    setSending(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const sample = (lang === 'ar') ? 'ما معنى “ثمّ أنشأناه خلقًا آخر” ؟' :
                 (lang === 'ur') ? '“ثم أنشأناه خلقا آخر” کا کیا مطلب ہے؟' :
                 'What does “then We brought him forth as another creation” (23:14) mean?';

  const remaining = lastQuota ? Math.max(0, lastQuota.free - lastQuota.used) + lastQuota.balance : null;
  const storePackBalance = useApp((s) => s.packBalance);
  // Effective pack balance: prefer last API response, otherwise the store (e.g. just after IAP)
  const effectivePack = lastQuota ? lastQuota.balance : storePackBalance;
  const quotaTone = remaining === null ? colors.silverDim : (remaining >= 2 ? colors.emerald : (remaining >= 1 ? colors.gold : colors.rose));

  const copyAnswer = async (text: string) => {
    try { await Clipboard.setStringAsync(text); } catch {}
  };
  const shareAnswer = async (m: Msg) => {
    const cites = (m.snippets || []).slice(0, 3).map((sn) => `• ${sn.source} · ${sn.key} — ${sn.text}`).join('\n');
    const body = `${m.text}\n\n${cites ? '— Citations —\n' + cites + '\n\n' : ''}— Quran, Bible & Science (AI Sheikh)`;
    try { await Share.share({ message: body }); } catch {}
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title={t('sheikhTitle', lang)}
        subtitle={t('sheikhSub', lang)}
        rightAction={msgs.length > 0
          ? { icon: 'trash-outline', onPress: clearChat }
          : { icon: 'sparkles-outline', onPress: () => router.push('/unlock') }}
      />

      {/* Sticky quota chip — shows weekly free questions + pack balance */}
      {(lastQuota || effectivePack > 0) ? (
        <View style={[styles.quotaBar, rtl && { flexDirection: 'row-reverse' }]}>
          {lastQuota ? (
            <View style={[styles.quotaChip, { borderColor: quotaTone + '88' }]}>
              <Ionicons name="flash" size={12} color={quotaTone} />
              <Text style={[styles.quotaTxt, { color: quotaTone }]}>
                {remaining} {lang === 'en' ? 'questions left' : lang === 'ar' ? 'أسئلة متبقية' : 'سوالات باقی'}
              </Text>
            </View>
          ) : null}
          {effectivePack > 0 ? (
            <View style={[styles.quotaChip, { borderColor: colors.gold + '55', backgroundColor: colors.gold + '11' }]}>
              <Ionicons name="add-circle" size={12} color={colors.gold} />
              <Text style={[styles.quotaTxt, { color: colors.gold }]}>+{effectivePack} {lang === 'en' ? 'pack' : lang === 'ar' ? 'باقة' : 'پیک'}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.lg }}
          keyboardShouldPersistTaps="handled"
        >
          {msgs.length === 0 ? (
            <View>
              <Card accent={colors.rose}>
                <View style={[styles.iconRow, rtl && { flexDirection: 'row-reverse' }]}>
                  <Ionicons name="chatbubbles" size={22} color={colors.rose} />
                  <Text style={styles.welcomeTitle}>{t('sheikhTitle', lang)}</Text>
                </View>
                <Text style={[styles.welcomeBody, { textAlign: rtl ? 'right' : 'left' }]}>
                  {lang === 'en' ? 'Ask anything about Quranic meaning, tafseer comparisons, or how the verse relates to modern science. Every answer cites the classical scholars verbatim.' :
                    lang === 'ar' ? 'اسأل عن معاني القرآن، أو مقارنات التفسير، أو علاقة الآية بالعلم الحديث. كل إجابة تستشهد بالعلماء الكلاسيكيين حرفيًّا.' :
                    'قرآنی معنوں، تفاسیر کے موازنے، یا آیت کے سائنس سے تعلق کے بارے میں پوچھیں۔ ہر جواب کلاسیکی علما کے حوالے سے دیا جاتا ہے۔'}
                </Text>
                <Pressable onPress={() => setInput(sample)} style={({ pressed }) => [styles.sample, pressed && { opacity: 0.7 }]}>
                  <Ionicons name="bulb-outline" size={14} color={colors.silver} />
                  <Text style={styles.sampleTxt} numberOfLines={2}>{sample}</Text>
                </Pressable>
              </Card>

              {!unlocked ? (
                <Card style={{ marginTop: spacing.md, borderColor: colors.silver + '55' }}>
                  <View style={[styles.iconRow, rtl && { flexDirection: 'row-reverse' }]}>
                    <Ionicons name="sparkles" size={20} color={colors.silver} />
                    <Text style={styles.lockTitle}>{t('unlockTitle', lang)}</Text>
                  </View>
                  <Text style={[styles.lockBody, { textAlign: rtl ? 'right' : 'left' }]}>{t('unlockBody', lang)}</Text>
                  <Pressable onPress={() => router.push('/unlock')} style={({ pressed }) => [styles.lockBtn, pressed && { opacity: 0.85 }]}>
                    <Text style={styles.lockBtnTxt}>{t('unlockTitle', lang)}</Text>
                    <Ionicons name="arrow-forward" size={16} color={colors.bg} />
                  </Pressable>
                </Card>
              ) : null}

              <Card accent={colors.gold} style={{ marginTop: spacing.md }}>
                <Text style={styles.discLabel}>ʿAQĪDAH</Text>
                <Text style={[styles.discBody, { textAlign: rtl ? 'right' : 'left' }]}>{t('classicalPrimacy', lang)}</Text>
              </Card>
            </View>
          ) : (
            msgs.map((m, i) => (
              <View key={i} style={[styles.msg, m.role === 'user' ? styles.msgUser : styles.msgSheikh]}>
                <Text style={[m.role === 'user' ? styles.userTxt : styles.sheikhTxt, { textAlign: rtl ? 'right' : 'left' }]}>{m.text}</Text>
                {m.snippets && m.snippets.length > 0 ? (
                  <View style={styles.snippets}>
                    {m.snippets.slice(0, 3).map((sn, j) => (
                      <Pressable
                        key={j}
                        onPress={() => router.push(`/verse/${encodeURIComponent(sn.key)}` as any)}
                        style={({ pressed }) => [styles.snippet, pressed && { opacity: 0.7 }]}
                      >
                        <View style={[styles.snippetHeader, rtl && { flexDirection: 'row-reverse' }]}>
                          <Ionicons name="library" size={11} color={colors.gold} />
                          <Text style={styles.snippetSrc}>{sn.source} · {sn.key}</Text>
                          <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={12} color={colors.gold + '99'} />
                        </View>
                        <Text style={styles.snippetTxt} numberOfLines={3}>{sn.text}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
                {m.role === 'sheikh' ? (
                  <View style={[styles.msgActions, rtl && { flexDirection: 'row-reverse' }]}>
                    <Pressable onPress={() => copyAnswer(m.text)} hitSlop={6} style={({ pressed }) => [styles.actionPill, pressed && { opacity: 0.6 }]}>
                      <Ionicons name="copy-outline" size={13} color={colors.silverDim} />
                      <Text style={styles.actionTxt}>{lang === 'en' ? 'Copy' : lang === 'ar' ? 'نسخ' : 'کاپی'}</Text>
                    </Pressable>
                    <Pressable onPress={() => shareAnswer(m)} hitSlop={6} style={({ pressed }) => [styles.actionPill, pressed && { opacity: 0.6 }]}>
                      <Ionicons name="share-outline" size={13} color={colors.silverDim} />
                      <Text style={styles.actionTxt}>{t('share', lang)}</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ))
          )}
          {sending ? (
            <View style={[styles.msg, styles.msgSheikh, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
              <ActivityIndicator size="small" color={colors.silver} />
              <Text style={{ color: colors.textMuted }}>{t('loading', lang)}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.inputBar, { paddingBottom: insets.bottom > 0 ? insets.bottom + 6 : spacing.md }]}>
          <View style={[styles.inputBox, rtl && { flexDirection: 'row-reverse' }]}>
            <Pressable
              onPress={onMicTap}
              hitSlop={6}
              style={({ pressed }) => [styles.micInline, recording && styles.micInlineRec, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name={recording ? 'stop' : 'mic'} size={18} color={recording ? colors.bg : colors.silver} />
            </Pressable>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={t('sheikhAskHint', lang)}
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { textAlign: rtl ? 'right' : 'left' }]}
              multiline
              maxLength={2000}
            />
            <Pressable
              onPress={send}
              disabled={!input.trim() || sending}
              style={({ pressed }) => [styles.sendBtn, (!input.trim() || sending) && { opacity: 0.4 }, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="send" size={18} color={colors.bg} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.sm },
  welcomeTitle: { ...ty.h3, color: colors.rose },
  welcomeBody: { ...ty.small, color: colors.textDim, lineHeight: 19 },
  sample: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.md, padding: 10, borderRadius: radius.md, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.cardBorder },
  sampleTxt: { ...ty.small, color: colors.silver, flex: 1, fontSize: 12.5 },
  lockTitle: { ...ty.h3, color: colors.silverHi },
  lockBody: { ...ty.small, color: colors.textDim, lineHeight: 19 },
  lockBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: spacing.md, paddingVertical: 12, borderRadius: radius.pill, backgroundColor: colors.silver },
  lockBtnTxt: { ...ty.h3, color: colors.bg, fontWeight: '800' },
  discLabel: { ...ty.label, color: colors.gold, marginBottom: 6, fontSize: 10 },
  discBody: { ...ty.small, color: colors.textDim, lineHeight: 18 },
  msg: { maxWidth: '88%', padding: 12, borderRadius: radius.lg, marginBottom: spacing.sm },
  msgUser: { alignSelf: 'flex-end', backgroundColor: colors.silver, borderBottomRightRadius: 4 },
  msgSheikh: { alignSelf: 'flex-start', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderBottomLeftRadius: 4 },
  userTxt: { ...ty.body, color: colors.bg, fontWeight: '500' },
  sheikhTxt: { ...ty.body, color: colors.text, lineHeight: 22 },
  snippets: { marginTop: spacing.sm, gap: 6 },
  snippet: { backgroundColor: colors.bgElevated, padding: 8, borderRadius: radius.sm, borderLeftWidth: 2, borderLeftColor: colors.gold },
  snippetHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  snippetSrc: { fontSize: 10, fontWeight: '700', color: colors.gold, letterSpacing: 0.5, textTransform: 'uppercase', flex: 1 },
  snippetTxt: { ...ty.small, color: colors.parchment, fontSize: 12.5, lineHeight: 17 },
  msgActions: { flexDirection: 'row', gap: 8, marginTop: spacing.sm, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.cardBorder + '88' },
  actionPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.bgElevated },
  actionTxt: { ...ty.tiny, color: colors.silverDim, fontWeight: '600' },
  quotaBar: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: 4 },
  quotaChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, borderWidth: 1, backgroundColor: colors.bgElevated },
  quotaTxt: { ...ty.tiny, fontWeight: '700', letterSpacing: 0.2 },
  inputBar: { borderTopWidth: 1, borderTopColor: colors.divider, backgroundColor: colors.bgElevated, paddingHorizontal: spacing.md, paddingTop: 10 },
  micInline: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.silver + '55', marginHorizontal: 4 },
  micInlineRec: { backgroundColor: colors.rose, borderColor: colors.rose },
  inputBox: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: colors.card, borderRadius: 22, borderWidth: 1, borderColor: colors.cardBorder, paddingLeft: 14, paddingRight: 6, paddingVertical: 4, gap: 6 },
  input: { flex: 1, ...ty.body, color: colors.text, maxHeight: 100, paddingVertical: 8 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.silver, alignItems: 'center', justifyContent: 'center', marginVertical: 2 },
});
