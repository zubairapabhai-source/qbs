/**
 * Duʿā Cards — Create & Send.
 *
 * Islamic · Engaging · Useful · FUN. Users pick an occasion
 * template, optionally swap the Arabic sticker or personalise the
 * message, then share via WhatsApp / Messages as a rendered card
 * image (react-native-view-shot → Share sheet).
 *
 * 100% typography-based — no external image assets — so ships OTA-
 * safe. Trilingual (EN / AR / UR), RTL-safe.
 */
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { submitEvent } from '../src/leaderboards/api';
import React, { useMemo, useRef, useState } from 'react';
import {
  Alert, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Text,
  TextInput, View,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../src/store/useApp';
import {
  CARD_TEMPLATES, DUA_STICKERS, DUA_CATEGORY_LABEL,
  type CardTemplate, type DuaSticker,
} from '../src/data/duaCards';
import { colors as themeColors, spacing } from '../src/theme';

// Alias Treasures theme keys to QBS' equivalents.
const colors = {
  ...themeColors,
  navy: themeColors.bg,
  navyElevated: themeColors.bg,
  navySurface: themeColors.bg,
  cream: themeColors.text,
  creamDim: themeColors.textDim,
  creamSubtle: themeColors.textDim,
};

type Lang = 'en' | 'ar' | 'ur';

// ── Motif glyphs (pure Unicode → zero image bytes) ──────────────
// Only the motifs actually referenced by CARD_TEMPLATES appear here.
const MOTIF_GLYPH: Record<CardTemplate['motif'], string> = {
  crescent: '☾',
  star: '✦',
  lantern: '🕯',
  heart: '❦',
  flower: '❁',
  geometry: '✵',
  palm: '🌴',
  kaaba: '🕋', // reserved for future Hajj/Umrah template
};

// ────────────────────────────────────────────────────────────────
export default function DuaCardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const lang = useApp((s: any) => s.lang) as Lang || 'en';
  const rtl = lang === 'ar' || lang === 'ur';
  const L = <T,>(en: T, ar: T, ur: T): T =>
    lang === 'ar' ? ar : lang === 'ur' ? ur : en;

  const [templateId, setTemplateId] = useState<string>(CARD_TEMPLATES[0].id);
  const template = useMemo(
    () => CARD_TEMPLATES.find((t) => t.id === templateId) ?? CARD_TEMPLATES[0],
    [templateId]
  );

  const [stickerId, setStickerId] = useState<string>(template.defaultStickerId);
  const sticker = useMemo(
    () => DUA_STICKERS.find((s) => s.id === stickerId) ?? DUA_STICKERS[0],
    [stickerId]
  );

  const [personal, setPersonal] = useState<string>(template.defaultMessage[lang]);
  const [signature, setSignature] = useState<string>('');
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [busy, setBusy] = useState(false);

  // When the user switches template, reset the sticker + message to the new
  // template's defaults — BUT only if the user hasn't personalised the
  // message yet. We consider the message "personalised" if it no longer
  // matches ANY known template default in the same language. This lets
  // users browse designs without losing their words.
  const pickTemplate = (id: string) => {
    const t = CARD_TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    setTemplateId(id);
    setStickerId(t.defaultStickerId);
    const isUntouched = CARD_TEMPLATES.some(
      (tt) => tt.defaultMessage[lang].trim() === personal.trim()
    );
    if (isUntouched || personal.trim().length === 0) {
      setPersonal(t.defaultMessage[lang]);
    }
  };

  const cardRef = useRef<ViewShot>(null);

  const onSend = async () => {
    // Track whether a share actually completed (not cancelled) so we
    // only bump the "duas" leaderboard on real shares. See dreams/
    // treasures onSend for the same pattern.
    let sharedOnce = false;
    const markShared = (result?: { action?: string }) => {
      if (result && result.action && /dismiss|cancel/i.test(result.action)) return;
      if (sharedOnce) return;
      sharedOnce = true;
      submitEvent('duas', 'qbs', 1).catch(() => {});
    };
    try {
      setBusy(true);
      const shot = cardRef.current;
      const shareText = buildShareText(sticker, personal, signature, template, lang);

      // If view-shot isn't ready (e.g. web preview), fall back to text-only.
      if (!shot || typeof shot.capture !== 'function') {
        const r = await Share.share({ message: shareText });
        markShared(r as any);
        return;
      }

      const uri = await shot.capture();
      const fileUri = uri.startsWith('file://') || uri.startsWith('content://')
        ? uri
        : `file://${uri}`;

      if (Platform.OS === 'ios') {
        const r = await Share.share({ url: fileUri, message: shareText });
        markShared(r as any);
        return;
      }

      const canShareFiles = await Sharing.isAvailableAsync().catch(() => false);
      if (canShareFiles) {
        try {
          await Clipboard.setStringAsync(shareText);
        } catch { /* silent */ }
        await Sharing.shareAsync(fileUri, {
          mimeType: 'image/png',
          dialogTitle: template.title[lang],
          UTI: 'public.png',
        });
        markShared();
        return;
      }

      const r2 = await Share.share({ message: shareText });
      markShared(r2 as any);
    } catch (e: any) {
      // "User did not share" cancels are silent — Share.share throws with a
      // "dismissed" code on some platforms, which we swallow.
      const msg = String(e?.message || '').toLowerCase();
      if (msg.includes('dismiss') || msg.includes('cancel')) return;
      Alert.alert(
        L('Couldn\'t share', 'تعذر المشاركة', 'شیئر نہ ہو سکا'),
        e?.message || L('Please try again.', 'حاول مرة أخرى.', 'براہِ کرم دوبارہ کوشش کریں۔')
      );
    } finally {
      setBusy(false);
    }
  };

  // ── Renders ──────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: colors.navy, paddingTop: insets.top }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.headerRow, rtl && { flexDirection: 'row-reverse' }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name={rtl ? 'chevron-forward' : 'chevron-back'} size={22} color={colors.gold} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.kicker, { textAlign: rtl ? 'right' : 'left' }]}>
            {L('SEND WITH BARAKAH', 'أرسل ببركة', 'برکت کے ساتھ بھیجیں')}
          </Text>
          <Text style={[styles.title, { textAlign: rtl ? 'right' : 'left' }]}>
            {L('Duʿā Cards', 'بطاقات الدعاء', 'دعا کارڈز')}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl * 2, gap: spacing.md }}
        showsVerticalScrollIndicator={false}
      >
        {/* Template picker */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}
        >
          {CARD_TEMPLATES.map((t) => {
            const active = t.id === templateId;
            return (
              <Pressable
                key={t.id}
                onPress={() => pickTemplate(t.id)}
                style={({ pressed }) => [
                  styles.templateTile,
                  active && styles.templateTileActive,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <LinearGradient
                  colors={t.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.templateTileGradient}
                >
                  <Text style={styles.templateTileEmoji}>{t.emoji}</Text>
                </LinearGradient>
                <Text style={[styles.templateTileTitle, active && { color: colors.gold }]}
                  numberOfLines={2}
                >
                  {t.title[lang]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Card preview (captured on Send) */}
        <View style={{ alignItems: 'center', paddingHorizontal: spacing.lg }}>
          <ViewShot
            ref={cardRef}
            options={{ format: 'png', quality: 1.0, result: 'tmpfile' }}
            style={styles.cardShadow}
          >
            <LinearGradient
              colors={template.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              {/* Motif glyphs decorate the corners */}
              <Text style={[styles.motifCorner, styles.motifTL, { color: template.accent + 'AA' }]}>
                {MOTIF_GLYPH[template.motif]}
              </Text>
              <Text style={[styles.motifCorner, styles.motifTR, { color: template.accent + 'AA' }]}>
                {MOTIF_GLYPH[template.motif]}
              </Text>
              <Text style={[styles.motifCorner, styles.motifBL, { color: template.accent + 'AA' }]}>
                {MOTIF_GLYPH[template.motif]}
              </Text>
              <Text style={[styles.motifCorner, styles.motifBR, { color: template.accent + 'AA' }]}>
                {MOTIF_GLYPH[template.motif]}
              </Text>

              {/* Title */}
              <Text style={[styles.cardTitle, { color: template.accent }]}>
                {template.title[lang]}
              </Text>

              {/* Arabic sticker centrepiece */}
              <View style={styles.stickerBlock}>
                <Text style={[styles.stickerAr, { color: template.accent }]} numberOfLines={2}>
                  {sticker.ar}
                </Text>
                <Text style={[styles.stickerTranslit, { color: template.accent + 'DD' }]}>
                  {sticker.translit}
                </Text>
                <Text style={[styles.stickerMeaning, { color: '#FFFFFFCC' }]} numberOfLines={2}>
                  “{sticker.meaning[lang]}”
                </Text>
              </View>

              {/* Personal message */}
              {personal.trim().length > 0 ? (
                <Text
                  style={[styles.personal, { textAlign: rtl ? 'right' : 'left' }]}
                  numberOfLines={5}
                >
                  {personal}
                </Text>
              ) : null}

              {/* Signature */}
              {signature.trim().length > 0 ? (
                <Text style={[styles.signature, { color: template.accent }]}>
                  — {signature.trim()}
                </Text>
              ) : null}

              {/* Watermark */}
              <Text style={styles.watermark}>
                Divine Series · Sacred Treasures
              </Text>
            </LinearGradient>
          </ViewShot>
        </View>

        {/* Sticker swap */}
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
          <Text style={[styles.sectionLabel, { textAlign: rtl ? 'right' : 'left' }]}>
            {L('DUʿĀ STICKER', 'ملصق الدعاء', 'دعا اسٹکر')}
          </Text>
          <Pressable
            onPress={() => setShowStickerPicker(true)}
            style={({ pressed }) => [styles.swapBtn, pressed && { opacity: 0.85 }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.swapBtnAr}>{sticker.ar}</Text>
              <Text style={styles.swapBtnTranslit}>{sticker.translit} · tap to change</Text>
            </View>
            <Ionicons name="swap-horizontal" size={18} color={colors.gold} />
          </Pressable>
        </View>

        {/* Personal message */}
        <View style={{ paddingHorizontal: spacing.lg, gap: 6 }}>
          <Text style={[styles.sectionLabel, { textAlign: rtl ? 'right' : 'left' }]}>
            {L('YOUR MESSAGE', 'رسالتك', 'آپ کا پیغام')}
          </Text>
          <TextInput
            value={personal}
            onChangeText={setPersonal}
            multiline
            placeholder={L('Write a warm personal note…',
              'اكتب رسالة شخصية…',
              'ایک ذاتی پیغام لکھیں…')}
            placeholderTextColor={colors.creamSubtle}
            style={[styles.messageInput, { textAlign: rtl ? 'right' : 'left' }]}
            maxLength={280}
          />
          <Text style={{ color: colors.creamSubtle, fontSize: 10, textAlign: rtl ? 'left' : 'right' }}>
            {personal.length}/280
          </Text>
        </View>

        {/* Signature */}
        <View style={{ paddingHorizontal: spacing.lg, gap: 6 }}>
          <Text style={[styles.sectionLabel, { textAlign: rtl ? 'right' : 'left' }]}>
            {L('SIGNED (OPTIONAL)', 'التوقيع (اختياري)', 'دستخط (اختیاری)')}
          </Text>
          <TextInput
            value={signature}
            onChangeText={setSignature}
            placeholder={L('e.g. Your Brother/Sister…',
              'مثلاً أخوك/أختك…',
              'مثلاً آپ کے بھائی/بہن…')}
            placeholderTextColor={colors.creamSubtle}
            style={[styles.signatureInput, { textAlign: rtl ? 'right' : 'left' }]}
            maxLength={40}
          />
        </View>

        {/* Send */}
        <View style={{ paddingHorizontal: spacing.lg }}>
          <Pressable
            onPress={onSend}
            disabled={busy}
            style={({ pressed }) => [
              styles.sendBtn,
              (pressed || busy) && { opacity: 0.85 },
            ]}
          >
            <Ionicons name="paper-plane" size={16} color={colors.navy} />
            <Text style={styles.sendBtnText}>
              {busy
                ? L('Preparing…', 'جاري التحضير…', 'تیار ہو رہا ہے…')
                : L('Send with barakah', 'أرسل ببركة', 'برکت کے ساتھ بھیجیں')}
            </Text>
          </Pressable>
          <Text style={styles.hint}>
            {Platform.OS === 'android'
              ? L(
                  'Shares your card image via WhatsApp / Messages. The caption is copied to your clipboard — long-press to paste it with the image.',
                  'يشارك صورة البطاقة عبر واتساب / الرسائل. النص نسخ إلى الحافظة — اضغط مطولًا للصقه مع الصورة.',
                  'کارڈ کی تصویر WhatsApp / Messages پر شیئر کرتا ہے۔ کیپشن کلپ بورڈ میں کاپی ہو گیا — تصویر کے ساتھ پیسٹ کرنے کے لیے دبا کر رکھیں۔'
                )
              : L(
                  'Shares a beautiful image + your message. Works with WhatsApp, Messages, iMessage.',
                  'يشارك صورة جميلة مع رسالتك. يعمل مع واتساب والرسائل و iMessage.',
                  'ایک خوبصورت تصویر آپ کے پیغام کے ساتھ شیئر کرتا ہے۔ WhatsApp، Messages اور iMessage پر کام کرتا ہے۔'
                )}
          </Text>
        </View>
      </ScrollView>

      {/* Sticker picker modal */}
      <StickerPickerModal
        visible={showStickerPicker}
        currentId={sticker.id}
        onClose={() => setShowStickerPicker(false)}
        onPick={(id) => { setStickerId(id); setShowStickerPicker(false); }}
        lang={lang}
        rtl={rtl}
      />
    </View>
  );
}

// ── Sticker Picker Modal ────────────────────────────────────────
function StickerPickerModal(props: {
  visible: boolean;
  currentId: string;
  onClose: () => void;
  onPick: (id: string) => void;
  lang: Lang;
  rtl: boolean;
}) {
  const { visible, currentId, onClose, onPick, lang, rtl } = props;
  const insets = useSafeAreaInsets();
  const L = <T,>(en: T, ar: T, ur: T): T =>
    lang === 'ar' ? ar : lang === 'ur' ? ur : en;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalScrim}>
        <View style={[styles.modalCard, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={[styles.modalHead, rtl && { flexDirection: 'row-reverse' }]}>
            <Text style={styles.modalTitle}>
              {L('Pick a duʿā', 'اختر دعاء', 'دعا منتخب کریں')}
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close-circle" size={26} color={colors.creamSubtle} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ paddingVertical: spacing.sm }}>
            {(Object.keys(DUA_CATEGORY_LABEL) as DuaSticker['category'][]).map((cat) => {
              const items = DUA_STICKERS.filter((s) => s.category === cat);
              if (items.length === 0) return null;
              return (
                <View key={cat} style={{ marginBottom: spacing.md }}>
                  <Text style={[styles.modalGroup, { textAlign: rtl ? 'right' : 'left' }]}>
                    {DUA_CATEGORY_LABEL[cat][lang]}
                  </Text>
                  {items.map((s) => {
                    const active = s.id === currentId;
                    return (
                      <Pressable
                        key={s.id}
                        onPress={() => onPick(s.id)}
                        style={({ pressed }) => [
                          styles.pickRow,
                          active && styles.pickRowActive,
                          pressed && { opacity: 0.85 },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.pickAr}>{s.ar}</Text>
                          <Text style={styles.pickTranslit}>{s.translit}</Text>
                          <Text style={styles.pickMeaning} numberOfLines={1}>{s.meaning[lang]}</Text>
                        </View>
                        {active ? (
                          <Ionicons name="checkmark-circle" size={20} color={colors.gold} />
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function buildShareText(
  sticker: DuaSticker,
  personal: string,
  signature: string,
  template: CardTemplate,
  lang: Lang,
): string {
  const parts: string[] = [];
  parts.push(`${template.title[lang]}\n`);
  parts.push(`${sticker.ar}`);
  parts.push(`${sticker.translit}`);
  parts.push(`“${sticker.meaning[lang]}”\n`);
  if (personal.trim().length > 0) parts.push(personal.trim());
  if (signature.trim().length > 0) parts.push(`\n— ${signature.trim()}`);
  parts.push('\n\n📖 Sent from Sacred Treasures · Divine Series');
  return parts.join('\n');
}

const CARD_W = 320;
const CARD_H = 420;

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.gold + '55',
    backgroundColor: colors.navyElevated,
  },
  kicker: { color: colors.gold, fontSize: 10, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' },
  title: { color: colors.cream, fontSize: 20, fontWeight: '800', marginTop: 2 },

  // Template tile
  templateTile: {
    width: 78, alignItems: 'center', gap: 6,
  },
  templateTileActive: { transform: [{ scale: 1.02 }] },
  templateTileGradient: {
    width: 78, height: 78, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  templateTileEmoji: { fontSize: 34 },
  templateTileTitle: {
    color: colors.creamDim, fontSize: 10.5, textAlign: 'center', fontWeight: '600', lineHeight: 13,
  },

  // Card
  cardShadow: {
    width: CARD_W, height: CARD_H,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
    borderRadius: 20, overflow: 'hidden',
  },
  card: {
    width: CARD_W, height: CARD_H,
    padding: 22,
    alignItems: 'center', justifyContent: 'space-between',
  },
  motifCorner: { position: 'absolute', fontSize: 22 },
  motifTL: { top: 10, left: 12 },
  motifTR: { top: 10, right: 12 },
  motifBL: { bottom: 10, left: 12 },
  motifBR: { bottom: 10, right: 12 },
  cardTitle: {
    fontSize: 22, fontWeight: '800', letterSpacing: 0.3, textAlign: 'center',
    marginTop: 12,
  },
  stickerBlock: {
    alignItems: 'center', gap: 8, marginTop: -8,
  },
  stickerAr: {
    fontSize: 34, fontWeight: '800', textAlign: 'center', lineHeight: 46,
  },
  stickerTranslit: {
    fontSize: 13, fontWeight: '700', letterSpacing: 0.4, fontStyle: 'italic',
  },
  stickerMeaning: {
    fontSize: 12, textAlign: 'center', lineHeight: 17,
    paddingHorizontal: 12, maxWidth: 260,
  },
  personal: {
    color: '#FFFFFFE0', fontSize: 12.5, lineHeight: 18,
    paddingHorizontal: 10, maxWidth: 280,
  },
  signature: {
    fontSize: 12, fontWeight: '700', fontStyle: 'italic',
  },
  watermark: {
    color: 'rgba(255,255,255,0.35)', fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase',
    fontWeight: '700',
  },

  // Sections
  sectionLabel: {
    color: colors.gold, fontSize: 10, fontWeight: '800', letterSpacing: 1.5,
  },
  swapBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: colors.gold + '55',
    backgroundColor: colors.navySurface,
  },
  swapBtnAr: { color: colors.cream, fontSize: 20, fontWeight: '800' },
  swapBtnTranslit: { color: colors.creamDim, fontSize: 11, marginTop: 2 },

  messageInput: {
    minHeight: 90,
    borderWidth: 1, borderColor: colors.gold + '55',
    borderRadius: 14,
    padding: 12,
    color: colors.cream, fontSize: 14, lineHeight: 20,
    backgroundColor: colors.navySurface,
    textAlignVertical: 'top',
  },
  signatureInput: {
    borderWidth: 1, borderColor: colors.gold + '55',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    color: colors.cream, fontSize: 14,
    backgroundColor: colors.navySurface,
  },

  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 999,
    backgroundColor: colors.gold,
    marginTop: 4,
  },
  sendBtnText: { color: colors.navy, fontWeight: '900', fontSize: 14, letterSpacing: 0.3 },
  hint: {
    color: colors.creamSubtle, fontSize: 11, textAlign: 'center', marginTop: 6, fontStyle: 'italic',
  },

  // Modal
  modalScrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.navy,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg, gap: spacing.sm, maxHeight: '85%',
    borderTopWidth: 1, borderTopColor: colors.gold + '55',
  },
  modalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { color: colors.cream, fontSize: 18, fontWeight: '800' },
  modalGroup: {
    color: colors.gold, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase',
    fontWeight: '800', marginBottom: 6, marginTop: 4,
  },
  pickRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 12, marginBottom: 6,
    borderRadius: 12,
    borderWidth: 1, borderColor: colors.gold + '22',
    backgroundColor: colors.navySurface,
  },
  pickRowActive: { borderColor: colors.gold, backgroundColor: colors.gold + '15' },
  pickAr: { color: colors.cream, fontSize: 20, fontWeight: '800' },
  pickTranslit: { color: colors.gold, fontSize: 11, fontWeight: '700', marginTop: 2 },
  pickMeaning: { color: colors.creamDim, fontSize: 11, marginTop: 2, fontStyle: 'italic' },
});
