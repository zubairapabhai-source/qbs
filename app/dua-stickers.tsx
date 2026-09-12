/**
 * QBS — Duʿā Stickers gallery. Ports the Treasures feature.
 * OTA-safe (pure JS + react-native-svg). Trilingual.
 */
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Stack, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useMemo, useRef, useState } from 'react';
import {
  Alert, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Text,
  View,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../src/store/useApp';
import {
  DUA_STICKERS, DUA_CATEGORY_LABEL,
  type DuaSticker,
} from '../src/data/duaCards';
import {
  STICKER_STYLES, StickerRenderer, type StickerStyle,
} from '../src/components/StickerRenderer';
import { colors, spacing } from '../src/theme';

type Lang = 'en' | 'ar' | 'ur';

const CATEGORY_ORDER: DuaSticker['category'][] = [
  'greeting', 'praise', 'occasion', 'blessing',
  'seeking', 'protection', 'sabr',
];

export default function QbsDuaStickersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const lang = useApp((s: any) => s.lang) as Lang || 'en';
  const rtl = lang === 'ar' || lang === 'ur';
  const L = <T,>(en: T, ar: T, ur: T): T =>
    lang === 'ar' ? ar : lang === 'ur' ? ur : en;

  const [selected, setSelected] = useState<DuaSticker | null>(null);
  const [styleIdx, setStyleIdx] = useState(0);

  const groups = useMemo(() =>
    CATEGORY_ORDER
      .map((cat) => ({ cat, items: DUA_STICKERS.filter((s) => s.category === cat) }))
      .filter((g) => g.items.length > 0)
  , []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.headerRow, rtl && { flexDirection: 'row-reverse' }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name={rtl ? 'chevron-forward' : 'chevron-back'} size={22} color={colors.gold} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.kicker, { textAlign: rtl ? 'right' : 'left' }]}>
            {L('SEND WITH BARAKAH', 'أرسل ببركة', 'برکت کے ساتھ بھیجیں')}
          </Text>
          <Text style={[styles.title, { textAlign: rtl ? 'right' : 'left' }]}>
            {L('Duʿā Stickers', 'ملصقات الدعاء', 'دعا اسٹکرز')}
          </Text>
        </View>
      </View>

      <Text style={[styles.hint, { textAlign: rtl ? 'right' : 'left' }]}>
        {L(
          'Tap any duʿā to preview and pick a style — then send as a sticker anywhere.',
          'اضغط على أي دعاء لعرضه واختيار نمط — ثم أرسله كملصق.',
          'کوئی دعا دبائیں، ایک انداز چنیں، پھر بطور اسٹکر بھیجیں۔'
        )}
      </Text>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        {groups.map((g) => (
          <View key={g.cat} style={{ marginBottom: spacing.lg }}>
            <Text style={[styles.groupHead, { textAlign: rtl ? 'right' : 'left' }]}>
              {DUA_CATEGORY_LABEL[g.cat][lang]}
            </Text>
            <View style={styles.grid}>
              {g.items.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => { setSelected(s); setStyleIdx(0); }}
                  style={({ pressed }) => [styles.tile, pressed && { opacity: 0.85 }]}
                >
                  <StickerRenderer
                    sticker={s}
                    style={STICKER_STYLES[hashPick(s.id, STICKER_STYLES.length)]}
                    size={140}
                  />
                  <Text style={styles.tileLabel} numberOfLines={1}>{s.translit}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <StickerPreviewModal
        visible={!!selected}
        sticker={selected}
        styleIdx={styleIdx}
        onCycleStyle={(dir) => {
          const n = STICKER_STYLES.length;
          setStyleIdx((i) => (i + dir + n) % n);
        }}
        onClose={() => setSelected(null)}
        lang={lang}
        rtl={rtl}
      />
    </View>
  );
}

function hashPick(id: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
}

function StickerPreviewModal(props: {
  visible: boolean;
  sticker: DuaSticker | null;
  styleIdx: number;
  onCycleStyle: (dir: 1 | -1) => void;
  onClose: () => void;
  lang: Lang;
  rtl: boolean;
}) {
  const { visible, sticker, styleIdx, onCycleStyle, onClose, lang, rtl } = props;
  const insets = useSafeAreaInsets();
  const shotRef = useRef<ViewShot>(null);
  const [busy, setBusy] = useState(false);
  const L = <T,>(en: T, ar: T, ur: T): T =>
    lang === 'ar' ? ar : lang === 'ur' ? ur : en;

  const currentStyle: StickerStyle = STICKER_STYLES[styleIdx] ?? STICKER_STYLES[0];

  const onSend = async () => {
    if (!sticker) return;
    try {
      setBusy(true);
      const shot = shotRef.current;
      const caption = `${sticker.ar}\n${sticker.translit} · “${sticker.meaning[lang]}”\n\n📖 Qur'an · Bible · Science — Divine Series`;

      if (!shot || typeof shot.capture !== 'function') {
        await Share.share({ message: caption });
        return;
      }
      const uri = await shot.capture();
      const fileUri = uri.startsWith('file://') || uri.startsWith('content://') ? uri : `file://${uri}`;

      if (Platform.OS === 'ios') {
        await Share.share({ url: fileUri, message: caption });
        return;
      }
      const canShareFiles = await Sharing.isAvailableAsync().catch(() => false);
      if (canShareFiles) {
        try {
          await Clipboard.setStringAsync(caption);
        } catch { /* silent */ }
        await Sharing.shareAsync(fileUri, {
          mimeType: 'image/png',
          dialogTitle: sticker.translit,
          UTI: 'public.png',
        });
        return;
      }
      await Share.share({ message: caption });
    } catch (e: any) {
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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalScrim}>
        <View style={[styles.modalCard, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={[styles.modalHead, rtl && { flexDirection: 'row-reverse' }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { textAlign: rtl ? 'right' : 'left' }]}
                numberOfLines={1}>{sticker?.translit ?? ''}</Text>
              <Text style={[styles.modalMeaning, { textAlign: rtl ? 'right' : 'left' }]}
                numberOfLines={2}>{sticker ? sticker.meaning[lang] : ''}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close-circle" size={26} color={colors.textDim} />
            </Pressable>
          </View>

          <View style={styles.previewWrap}>
            <Pressable onPress={() => onCycleStyle(-1)} hitSlop={10} style={styles.cycleBtn}>
              <Ionicons name="chevron-back" size={22} color={colors.gold} />
            </Pressable>
            <ViewShot ref={shotRef} options={{ format: 'png', quality: 1.0, result: 'tmpfile' }}>
              {sticker ? <StickerRenderer sticker={sticker} style={currentStyle} size={260} /> : null}
            </ViewShot>
            <Pressable onPress={() => onCycleStyle(1)} hitSlop={10} style={styles.cycleBtn}>
              <Ionicons name="chevron-forward" size={22} color={colors.gold} />
            </Pressable>
          </View>

          <Text style={styles.styleLabel}>
            {L('Style', 'النمط', 'انداز')} {styleIdx + 1} / {STICKER_STYLES.length}
          </Text>

          <Pressable
            onPress={onSend}
            disabled={busy}
            style={({ pressed }) => [
              styles.sendBtn,
              (pressed || busy) && { opacity: 0.85 },
            ]}
          >
            <Ionicons name="paper-plane" size={16} color={colors.bg} />
            <Text style={styles.sendBtnText}>
              {busy
                ? L('Preparing…', 'جاري التحضير…', 'تیار ہو رہا ہے…')
                : L('Send sticker', 'أرسل الملصق', 'اسٹکر بھیجیں')}
            </Text>
          </Pressable>
          <Text style={styles.footHint}>
            {Platform.OS === 'android'
              ? L(
                  'The caption is copied to your clipboard — paste alongside the sticker.',
                  'النص نسخ إلى الحافظة — الصقه بجوار الملصق.',
                  'کیپشن کلپ بورڈ میں کاپی ہو گیا — اسٹکر کے ساتھ پیسٹ کریں۔'
                )
              : L(
                  'Sends as an image via WhatsApp, iMessage, anywhere.',
                  'يرسل كصورة عبر واتساب و iMessage.',
                  'WhatsApp یا iMessage پر تصویر کے طور پر بھیجتا ہے۔'
                )}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xs,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.gold + '55',
  },
  kicker: { color: colors.gold, fontSize: 10, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 2 },
  hint: {
    color: colors.textDim, fontSize: 12, paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm, lineHeight: 17, fontStyle: 'italic',
  },
  groupHead: {
    color: colors.gold, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase',
    fontWeight: '800', marginBottom: spacing.sm,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: { width: 140, alignItems: 'center', gap: 6 },
  tileLabel: { color: colors.textDim, fontSize: 11, fontWeight: '700', textAlign: 'center' },

  modalScrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg, gap: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.gold + '55',
  },
  modalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  modalMeaning: { color: colors.textDim, fontSize: 12, fontStyle: 'italic', marginTop: 2 },
  previewWrap: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, marginVertical: spacing.md,
  },
  cycleBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, borderColor: colors.gold + '55',
    alignItems: 'center', justifyContent: 'center',
  },
  styleLabel: {
    color: colors.gold, fontSize: 11, textAlign: 'center', fontWeight: '700',
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 999,
    backgroundColor: colors.gold,
    marginTop: spacing.sm,
  },
  sendBtnText: { color: colors.bg, fontWeight: '900', fontSize: 14, letterSpacing: 0.3 },
  footHint: { color: colors.textDim, fontSize: 11, textAlign: 'center', fontStyle: 'italic', marginTop: 4 },
});
