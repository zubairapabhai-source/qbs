/**
 * Persistent "Help" floating action button.
 *
 * Lives in the centre-bottom of the home screen as a small pill
 * (per user request: "that allows Chinese phone users to contact us, which
 * prompts Sentry into contacting me of a fault"). When tapped, opens an
 * action sheet:
 *
 *   • Email us  → opens default mail app, pre-filled (mailto:)
 *   • Report a fault → fires a Sentry user-report directly (no mail needed)
 *   • Cancel
 *
 * Both options ALSO fire a Sentry capture so we get push-notified the
 * instant the user taps, even if their phone has no mail client.
 */
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useApp } from '../store/useApp';
import { openSupportEmail } from '../support';
import { captureUserReport } from '../sentry';
import { colors, radius, spacing, type as ty } from '../theme';

interface Props {
  /** Optional override label, otherwise uses locale default. */
  label?: string;
  /** Variant: pill (default, on dark) or transparent text-only. */
  variant?: 'pill' | 'text';
  /** Where the help is opened from — added to Sentry tag. */
  context?: string;
}

export function HelpButton({ label, variant = 'pill', context = 'home' }: Props) {
  const lang = useApp((s) => s.lang);
  const deviceId = useApp((s) => s.deviceId);
  const rtl = lang === 'ar' || lang === 'ur';

  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState('');
  const [phoneMake, setPhoneMake] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const L = (en: string, ar: string, ur: string) => (lang === 'ar' ? ar : lang === 'ur' ? ur : en);
  const buttonLabel = label || L('Need help?', 'هل تحتاج إلى مساعدة؟', 'مدد چاہیے؟');

  const openMenu = () => {
    Alert.alert(
      L('We\'re here to help', 'نحن هنا للمساعدة', 'ہم مدد کے لیے حاضر ہیں'),
      L(
        'Pick how you\'d like to reach us. Your Device ID is attached automatically — please type your phone make if it\'s a Chinese model (Xiaomi, Huawei, Oppo, etc.).',
        'اختر طريقة التواصل. سيتم إرفاق معرّف جهازك تلقائيًا.',
        'رابطے کا طریقہ منتخب کریں۔ آپ کی ڈیوائس آئی ڈی خود بخود منسلک ہو جائے گی۔'
      ),
      [
        {
          text: L('Email us', 'راسلنا', 'ای میل کریں'),
          onPress: () => openSupportEmail({ deviceId, topic: context, phoneMake: '' }),
        },
        {
          text: L('Report a fault', 'الإبلاغ عن خلل', 'خرابی رپورٹ کریں'),
          onPress: () => setReportOpen(true),
        },
        { text: L('Cancel', 'إلغاء', 'منسوخ'), style: 'cancel' },
      ],
      { cancelable: true },
    );
  };

  const submitReport = () => {
    const msg = reportText.trim();
    if (!msg) {
      Alert.alert(L('Please describe the issue', 'يرجى وصف المشكلة', 'مہربانی کرکے مسئلہ بیان کریں'));
      return;
    }
    setSubmitting(true);
    try {
      captureUserReport({
        deviceId,
        message: `[${context}] ${msg}`,
        phoneMake: phoneMake.trim() || undefined,
      });
      Alert.alert(
        L('Sent — JazākAllāhu khayran', 'أُرسل — جزاك الله خيرًا', 'بھیج دیا — جزاک اللہ خیراً'),
        L(
          'Your report has been received. We\'ll look into it Insha Allah.',
          'تم استلام تقريرك. سنتعامل معه إن شاء الله.',
          'آپ کی رپورٹ موصول ہو گئی۔ ان شاء اللہ ہم اس پر غور کریں گے۔'
        ),
        [{ text: 'OK', onPress: () => { setReportOpen(false); setReportText(''); setPhoneMake(''); } }],
      );
    } catch {
      Alert.alert(L('Could not send', 'تعذر الإرسال', 'بھیجا نہ جا سکا'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Pressable onPress={openMenu} hitSlop={12} style={({ pressed }) => [
        variant === 'pill' ? styles.pill : styles.text,
        pressed && { opacity: 0.7 },
      ]}>
        <Ionicons name="help-circle-outline" size={16} color={variant === 'pill' ? colors.gold : colors.silverDim} />
        <Text style={[
          variant === 'pill' ? styles.pillTxt : styles.textTxt,
          { textAlign: rtl ? 'right' : 'left' },
        ]}>{buttonLabel}</Text>
      </Pressable>

      <Modal visible={reportOpen} animationType="slide" transparent onRequestClose={() => setReportOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={[styles.modalHeader, rtl && { flexDirection: 'row-reverse' }]}>
              <Ionicons name="alert-circle" size={20} color={colors.gold} />
              <Text style={styles.modalTitle}>{L('Report a fault', 'الإبلاغ عن خلل', 'خرابی رپورٹ کریں')}</Text>
            </View>
            <Text style={styles.modalHint}>
              {L('Describe what went wrong. Your Device ID is attached automatically.',
                  'صِف ما حدث. سيُرفق معرّف جهازك تلقائيًا.',
                  'بتائیں کیا ہوا۔ ڈیوائس آئی ڈی خود بخود ساتھ جائے گی۔')}
            </Text>
            <TextInput
              style={styles.input}
              multiline
              numberOfLines={5}
              value={reportText}
              onChangeText={setReportText}
              placeholder={L('e.g. The Bible Contradictions screen freezes when I…',
                'مثال: تتجمد شاشة تناقضات الكتاب المقدس عندما…',
                'مثلاً: بائبل تضادات سکرین ہینگ ہو جاتی ہے جب…')}
              placeholderTextColor={colors.textMuted}
            />
            <TextInput
              style={[styles.input, { minHeight: 40, maxHeight: 40 }]}
              value={phoneMake}
              onChangeText={setPhoneMake}
              placeholder={L('Phone make/model (e.g. Xiaomi Redmi Note 12)',
                'نوع الهاتف (مثل: شاومي ريدمي نوت ١٢)',
                'فون کا ماڈل (مثلاً: شیاؤمی ریڈمی نوٹ ۱۲)')}
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setReportOpen(false)} style={styles.modalCancel}>
                <Text style={styles.modalCancelTxt}>{L('Cancel', 'إلغاء', 'منسوخ')}</Text>
              </Pressable>
              <Pressable onPress={submitReport} disabled={submitting}
                style={({ pressed }) => [styles.modalSubmit, (pressed || submitting) && { opacity: 0.7 }]}>
                <Text style={styles.modalSubmitTxt}>
                  {submitting ? L('Sending…', 'جارٍ الإرسال…', 'بھیج رہا ہے…') : L('Send report', 'إرسال', 'بھیجیں')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.gold + '18',
    borderWidth: 1, borderColor: colors.gold + '66',
  },
  pillTxt: { ...ty.label, color: colors.gold, fontSize: 12 },
  text: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4 },
  textTxt: { ...ty.tiny, color: colors.silverDim, fontSize: 12 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    padding: spacing.lg, gap: spacing.sm, borderTopWidth: 1, borderColor: colors.gold + '66',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalTitle: { ...ty.h3, color: colors.silverHi },
  modalHint: { ...ty.tiny, color: colors.textMuted, lineHeight: 18 },
  input: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.silverDim + '55',
    borderRadius: radius.md, padding: spacing.sm, color: colors.text,
    minHeight: 90, textAlignVertical: 'top',
  },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  modalCancel: { flex: 1, padding: spacing.md, alignItems: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colors.silverDim + '55' },
  modalCancelTxt: { color: colors.silverDim, fontWeight: '600' },
  modalSubmit: { flex: 2, padding: spacing.md, alignItems: 'center', borderRadius: radius.md, backgroundColor: colors.gold },
  modalSubmitTxt: { color: colors.bg, fontWeight: '700' },
});
