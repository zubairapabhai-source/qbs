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
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Modal, Pressable, ScrollView, Share, StyleSheet, Text,
  TextInput, View,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { submitEvent } from '../src/leaderboards/api';
import {
  CARD_TEMPLATES, DUA_STICKERS, DUA_CATEGORY_LABEL,
  type CardTemplate, type DuaSticker,
} from '../src/data/duaCards';
import { useApp } from '../src/store/useApp';
import { colors, spacing } from '../src/theme';
import { DedicationPicker } from '../src/components/DedicationPicker';
import { LovedOnesSheet } from '../src/components/LovedOnesSheet';
import { AmbientPickerPill } from '../src/components/AmbientPickerPill';
import { createChest } from '../src/chestApi';
import { SoundscapeChip } from '../src/components/SoundscapeChip';
import SoundscapeHeroGrid from '../src/components/SoundscapeHeroGrid';
import type { SoundscapeSelection } from '../src/components/SoundscapeChip';
import { audioUrlFor, soundscapeFor, pastelFor } from '../src/data/soundscapes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Shimmer } from '../src/components/Shimmer';
import { useLovedOnes, dedicationLine, type DedicationLang } from '../src/personalisation/lovedOnes';
import { useGiftRewards } from '../src/rewards/giftRewardsStore';
import { GifterRewardModal } from '../src/components/GifterRewardModal';
import type { RewardLang } from '../src/rewards/rewardStrings';

const FROM_APP = 'qbs' as const;

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
  const [recipient, setRecipient] = useState<string>('');
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [soundscapeSel, setSoundscapeSel] = useState<SoundscapeSelection | null>({ id: 'ameen', reciter: 'afasy' });
  const [customizeOpen, setCustomizeOpen] = useState(false);
  // Card mood — 'dark' (classic night-sky look) or 'pastel' (soft
  // watercolour parchment). Toggled by the pill on the preview card.
  const [cardMood, setCardMood] = useState<'dark' | 'pastel'>('dark');

  // ─── Soundscape-reactive visuals + in-app audio preview ─────────────
  // When the sender picks a soundscape tile the card preview above the
  // grid instantly swaps its gradient/accent to match the chosen bundle
  // (e.g. Shifa 🕊️ → calm aqua tones), and a short Qur'ān clip starts
  // playing in the app. Tapping another tile replaces the audio +
  // visuals. Leaving the screen stops playback.
  const soundscapeData = soundscapeFor(soundscapeSel?.id ?? undefined);
  const pastel = pastelFor(soundscapeSel?.id ?? undefined);
  const isPastel = cardMood === 'pastel';
  const effectiveAccent = isPastel
    ? pastel.accent
    : (soundscapeData?.visual.accent || template.accent);
  const effectiveGradient: [string, string] = isPastel
    ? [pastel.bg_from, pastel.bg_to]
    : (soundscapeData
        ? [soundscapeData.visual.bg_from, soundscapeData.visual.bg_to]
        : (template.gradient as [string, string]));
  // Body/translit text colour on the card — bright cream in dark mood,
  // deep ink in pastel mood (so Arabic + personal note stay crisp).
  const effectiveInk = isPastel ? pastel.ink : '#FFFFFFE0';
  const effectiveMotif = isPastel ? pastel.motif : (effectiveAccent + 'AA');
  const effectiveBorder = isPastel ? pastel.border : (effectiveAccent + '55');
  const audioUrl = (soundscapeData && soundscapeSel)
    ? audioUrlFor(soundscapeData, soundscapeSel.reciter)
    : null;
  const audioPlayer = useAudioPlayer(audioUrl ? { uri: audioUrl } : null);
  const audioStatus = useAudioPlayerStatus(audioPlayer);
  // Start muted — the card's default soundscape ("ameen" by Mishary al-Afasy)
  // used to auto-recite Al-Fatiha the moment the screen opened, which
  // startled users browsing silently. Now audio only plays after the
  // sender taps a soundscape tile or the play toggle.
  const [audioAutoplay, setAudioAutoplay] = useState(false);
  useEffect(() => {
    if (!audioUrl) return;
    if (!audioAutoplay) return;
    try {
      audioPlayer.seekTo(0);
      audioPlayer.play();
    } catch { /* best-effort */ }
    // Replace source happens automatically via `useAudioPlayer` on the new URL
  }, [audioUrl, audioAutoplay, audioPlayer]);
  // Stop audio when the screen unmounts so it doesn't bleed into other tabs.
  useEffect(() => () => {
    try { audioPlayer.pause(); } catch { /* noop */ }
  }, [audioPlayer]);
  const toggleAudio = () => {
    try {
      if (audioStatus.playing) {
        audioPlayer.pause();
        setAudioAutoplay(false);
      } else {
        audioPlayer.play();
        setAudioAutoplay(true);
      }
    } catch { /* best-effort */ }
  };
  // Wrap the soundscape setter so that an explicit user pick auto-plays
  // the preview — but opening the screen on the default pick stays silent.
  const handleSoundscapePick = (next: SoundscapeSelection | null) => {
    setSoundscapeSel(next);
    if (next) setAudioAutoplay(true);
  };

  // Loved-Ones registry — hydrate once so the dedication picker works
  // even on the very first card of a fresh install.
  const hydrateLoved = useLovedOnes(s => s.hydrate);
  const lovedItems = useLovedOnes(s => s.items);
  useEffect(() => { hydrateLoved(); }, [hydrateLoved]);
  const params = useLocalSearchParams<{ dedicate?: string }>();
  const [dedicationId, setDedicationId] = useState<string | null>(null);
  // If the deep link arrived with ?dedicate=<id> (e.g. the morning
  // prompt on the home tab), pre-select that loved-one once the store
  // hydrates and the id is actually present.
  useEffect(() => {
    if (!params?.dedicate) return;
    if (lovedItems.some(x => x.id === params.dedicate)) {
      setDedicationId(String(params.dedicate));
    }
  }, [params?.dedicate, lovedItems]);
  const [lovedSheetOpen, setLovedSheetOpen] = useState(false);
  const dedicatedTo = lovedItems.find(x => x.id === dedicationId) || null;

  /**
   * Build the final share text. If the user picked a loved one,
   * prepend a dedication line so the recipient sees WHO the duʿā
   * is being made for — the emotional hook.
   */
  const withDedication = (base: string): string => {
    if (!dedicatedTo) return base;
    return `${dedicationLine(lang as DedicationLang, dedicatedTo)}\n\n${base}`;
  };

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
  // Shimmer runs continuously while the user is composing the card,
  // but must pause just before ViewShot capture so the recipient sees a
  // clean, non-flashing gradient frame in the sent image. Toggled back
  // on right after the file is written.
  const [shimmerActive, setShimmerActive] = useState(true);

  // Leaderboard hook: every time the user commits to send a duʿā card
  // it counts as +1 on the "Duʿās" leaderboard. Fire-and-forget — the
  // store's own anti-cheat + offline handling absorbs failures.

  // Gift-Rewards state — hydrate + drive the celebration modal.
  const hydrateRewards = useGiftRewards((s) => s.hydrate);
  const recordGift = useGiftRewards((s) => s.recordGift);
  const lifetimeGifts = useGiftRewards((s) => s.lifetimeGifts);
  useEffect(() => { hydrateRewards().catch(() => {}); }, [hydrateRewards]);
  const [rewardModal, setRewardModal] = useState<{ visible: boolean; gemIdx: number; awarded: boolean; lifetime: number }>({
    visible: false, gemIdx: 0, awarded: false, lifetime: 0,
  });

  const onSend = async () => {
    // Leaderboard hook: bump ONLY after a share actually completed.
    // Placing this after a resolved Share/Sharing call means a user who
    // opens the sheet and cancels doesn't inflate their score. On some
    // platforms Share.share resolves with { action: 'dismissedAction' }
    // — we treat that as no-share (see markShared below).
    let sharedOnce = false;
    const markShared = (result?: { action?: string }) => {
      if (result && result.action && /dismiss|cancel/i.test(result.action)) return;
      if (sharedOnce) return;
      sharedOnce = true;
      submitEvent('duas', 'qbs', 1).catch(() => {});
      // Gift-Rewards — record this send + open the celebration modal.
      recordGift().then((reward) => {
        setRewardModal({
          visible: true,
          gemIdx: reward.gemIdx,
          awarded: reward.awardedCredit,
          lifetime: reward.newLifetime,
        });
      }).catch(() => {});
    };

    try {
      setBusy(true);
      // Create a shareable chest URL — recipients tap the link to see
      // the full animated Soundscape card with audio + visuals. The
      // shared message is intentionally minimal (just a tiny label +
      // link, matching the calligraphy-card format the user prefers).
      let shareText = L(
        `A duʿā for you 🤲\n`,
        `دعاء لك 🤲\n`,
        `آپ کے لیے ایک دعا 🤲\n`,
      );
      try {
        let ambientSound: string | undefined;
        try {
          const v = await AsyncStorage.getItem('@duacard:ambient');
          if (v && v !== 'off') ambientSound = v;
        } catch { /* best-effort */ }
        const created = await createChest({
          kind: 'dua',
          from_app: FROM_APP,
          sender_display: signature.trim() || undefined,
          content: {
            title: template.title[lang],
            ar: sticker.ar,
            en: personal.trim() || buildShareText(sticker, '', '', template, 'en'),
            ur: buildShareText(sticker, personal, signature, template, 'ur', recipient),
            ambient_sound: ambientSound,
            soundscape_id: soundscapeSel?.id,
            soundscape_reciter: soundscapeSel?.reciter,
            recipient_name: recipient.trim() || undefined,
            meta: { sticker_id: sticker.id, template_id: template.id },
          },
        });
        shareText = `${shareText}${created.share_url}`;
      } catch {
        // Offline / server down — fall back to a text-only share with the
        // full dua caption so nothing is lost.
        shareText = withDedication(
          buildShareText(sticker, personal, signature, template, lang, recipient),
        );
      }

      const r = await Share.share({ message: shareText });
      markShared(r as any);
      return;
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
      // Resume the shimmer after the share flow completes (success or
      // cancel) so the preview stays lively for the next composition.
      setShimmerActive(true);
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
        {/* Calligraphy Card discovery — sits above dedication so the
            new feature is impossible to miss for returning users. */}
        <Pressable
          onPress={() => router.push('/calligraphy' as any)}
          style={({ pressed }) => [styles.calligPill, pressed && { opacity: 0.85 }]}
        >
          <Ionicons name="brush" size={18} color={colors.gold} />
          <View style={{ flex: 1 }}>
            <Text style={styles.calligPillTitle}>
              {L('New · Personalised Calligraphy Card', 'جديد · بطاقة خط شخصية', 'نیا · ذاتی خطاطی کارڈ')}
            </Text>
            <Text style={styles.calligPillDesc}>
              {L('Your name + theirs in flowing ink — EN · AR · UR', 'اسمك واسمهم بحبرٍ متدفق — EN · AR · UR', 'آپ اور ان کا نام روانی سے — EN · AR · UR')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.gold} />
        </Pressable>

        {/* Loved-Ones dedication chip — turns "a duʿā" into "a duʿā for MY mum". */}
        <DedicationPicker
          selectedId={dedicationId}
          onChange={setDedicationId}
          onManage={() => setLovedSheetOpen(true)}
          lang={lang as DedicationLang}
          strings={{
            cta: L('🌸  Dedicate to a loved one', '🌸  اهدِه لعزيز', '🌸  کسی پیارے کے نام کریں'),
            clear: L('None — no dedication', 'بلا إهداء', 'کوئی نہیں — نام نہ کریں'),
            manage: L('Add or edit loved ones', 'إضافة أو تعديل الأعزاء', 'پیارے شامل کریں / ترمیم کریں'),
            chooseTitle: L('DEDICATE THIS TO…', 'اجعله لأجل…', 'اسے کس کے نام کریں…'),
          }}
          theme={{
            bg: colors.navyElevated, text: '#FFF4D9', textMuted: '#EDE2BF',
            accent: colors.goldBright, border: colors.goldMuted, overlay: 'rgba(0,0,0,0.7)',
          }}
        />

        {/* ─── TOP: Live card preview — reacts to the chosen soundscape.
            Gradient + accent swap instantly when the sender picks a
            tile below. Audio starts auto-playing in-app. ─── */}
        <View style={{ alignItems: 'center', paddingHorizontal: spacing.lg }}>
          <ViewShot
            ref={cardRef}
            options={{ format: 'png', quality: 1.0, result: 'tmpfile' }}
            style={[
              styles.cardShadow,
              soundscapeData ? { shadowColor: effectiveAccent, shadowOpacity: isPastel ? 0.35 : 0.55, shadowRadius: 14 } : null,
            ]}
          >
            <LinearGradient
              colors={effectiveGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.card,
                { borderColor: effectiveBorder, borderWidth: 1.5 },
              ]}
            >
              {/* Corner glyphs — use effective motif so they recolour
                  with the soundscape + mood. */}
              <Text style={[styles.motifCorner, styles.motifTL, { color: effectiveMotif }]}>
                {MOTIF_GLYPH[template.motif]}
              </Text>
              <Text style={[styles.motifCorner, styles.motifTR, { color: effectiveMotif }]}>
                {MOTIF_GLYPH[template.motif]}
              </Text>
              <Text style={[styles.motifCorner, styles.motifBL, { color: effectiveMotif }]}>
                {MOTIF_GLYPH[template.motif]}
              </Text>
              <Text style={[styles.motifCorner, styles.motifBR, { color: effectiveMotif }]}>
                {MOTIF_GLYPH[template.motif]}
              </Text>

              {/* Mood toggle pill — top-left corner. Lets sender swap
                  the entire card between the classic dark night-sky
                  look and a soft pastel watercolour mood that still
                  matches the chosen soundscape. */}
              <Pressable
                onPress={() => setCardMood((m) => (m === 'dark' ? 'pastel' : 'dark'))}
                style={[
                  styles.moodPill,
                  {
                    borderColor: effectiveAccent,
                    backgroundColor: isPastel ? '#FFFFFFCC' : 'rgba(10,22,40,0.5)',
                  },
                ]}
                hitSlop={6}
                testID="dua-card-mood-toggle"
              >
                <Text style={{ fontSize: 12 }}>{isPastel ? '☀' : '☾'}</Text>
                <Text style={[styles.moodPillLabel, { color: effectiveAccent }]}>
                  {isPastel ? L('Pastel', 'باستيل', 'پیسٹل') : L('Dark', 'داكن', 'ڈارک')}
                </Text>
              </Pressable>

              {/* Soundscape chip inside the card — shows which bundle is
                  live and gives a tap target to play/pause audio.
                  Enlarged tap target + hitSlop since users reported
                  the chip was hard to hit on taller cards. */}
              {soundscapeData ? (
                <Pressable
                  onPress={toggleAudio}
                  hitSlop={14}
                  style={({ pressed }) => [
                    styles.liveChip,
                    {
                      borderColor: effectiveAccent,
                      backgroundColor: isPastel ? '#FFFFFFCC' : 'rgba(0,0,0,0.35)',
                    },
                    pressed && { opacity: 0.75, transform: [{ scale: 0.97 }] },
                  ]}
                  testID="dua-card-play-chip"
                  accessibilityRole="button"
                  accessibilityLabel={audioStatus.playing ? 'Pause soundscape' : 'Play soundscape'}
                >
                  <Text style={{ fontSize: 16 }}>{soundscapeData.emoji}</Text>
                  <Text style={[styles.liveChipLabel, { color: effectiveAccent }]} numberOfLines={1}>
                    {soundscapeData.label[lang]}
                  </Text>
                  <Ionicons
                    name={audioStatus.playing ? 'pause' : 'play'}
                    size={14}
                    color={effectiveAccent}
                  />
                </Pressable>
              ) : null}

              {/* Title */}
              <Text style={[styles.cardTitle, { color: effectiveAccent }]}>
                {template.title[lang]}
              </Text>

              {/* Recipient */}
              {recipient.trim().length > 0 ? (
                <Text
                  style={[styles.recipient, { color: effectiveAccent, textAlign: rtl ? 'right' : 'left' }]}
                  numberOfLines={1}
                >
                  {L('To', 'إلى', 'برائے')} {recipient.trim()}
                </Text>
              ) : null}

              {/* Arabic sticker centrepiece */}
              <Shimmer
                color={effectiveAccent}
                active={shimmerActive}
                durationMs={2600}
                style={styles.stickerBlock}
              >
                <Text style={[styles.stickerAr, { color: effectiveAccent }]} numberOfLines={2}>
                  {sticker.ar}
                </Text>
                <Text style={[styles.stickerTranslit, { color: isPastel ? pastel.ink : effectiveAccent + 'DD' }]}>
                  {sticker.translit}
                </Text>
                <Text style={[styles.stickerMeaning, { color: effectiveInk }]} numberOfLines={2}>
                  “{sticker.meaning[lang]}”
                </Text>
              </Shimmer>

              {/* Personal message */}
              {personal.trim().length > 0 ? (
                <Text
                  style={[styles.personal, { color: effectiveInk, textAlign: rtl ? 'right' : 'left' }]}
                  numberOfLines={5}
                >
                  {personal}
                </Text>
              ) : null}

              {/* Signature */}
              {signature.trim().length > 0 ? (
                <Shimmer
                  color={effectiveAccent}
                  active={shimmerActive}
                  style={{ alignSelf: rtl ? 'flex-start' : 'flex-end' }}
                >
                  <Text style={[styles.signature, { color: effectiveAccent }]}>
                    — {signature.trim()}
                  </Text>
                </Shimmer>
              ) : null}

              {/* Watermark */}
              <Text style={[styles.watermark, { color: isPastel ? pastel.ink + '66' : 'rgba(255,255,255,0.35)' }]}>
                Divine Series · Sacred Treasures
              </Text>
            </LinearGradient>
          </ViewShot>
        </View>

        {/* ─────── PRIMARY: Soundscape grid (hero) ─────── */}
        <SoundscapeHeroGrid
          value={soundscapeSel}
          onChange={handleSoundscapePick}
          lang={(lang as 'en' | 'ar' | 'ur') || 'en'}
          fromApp={FROM_APP}
          testID="dua-card-soundscape-hero"
        />

        {/* Big Send button — primary action right under the grid. */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.sm }}>
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
                : L('Send duʿā 🤲', 'أرسل الدعاء 🤲', 'دعا بھیجیں 🤲')}
            </Text>
          </Pressable>
          <Text style={styles.hint}>
            {L(
              'A short caption + a link opens the full card with audio & visuals.',
              'نص قصير + رابط يفتح البطاقة الكاملة بالصوت والمؤثرات.',
              'ایک مختصر پیغام اور لنک، آپ کے دوست کے لیے مکمل کارڈ کھول دے گا۔',
            )}
          </Text>
        </View>

        {/* ─────── SECONDARY: Customize (collapsible, de-emphasized) ─────── */}
        <Pressable
          onPress={() => setCustomizeOpen((v) => !v)}
          style={({ pressed }) => [
            styles.customizeToggle,
            pressed && { opacity: 0.85 },
          ]}
          testID="dua-card-customize-toggle"
        >
          <Ionicons
            name={customizeOpen ? 'chevron-down' : 'chevron-forward'}
            size={16}
            color={colors.creamDim}
          />
          <Text style={styles.customizeToggleText}>
            {customizeOpen
              ? L('Hide customization', 'إخفاء التخصيص', 'تخصیص چھپائیں')
              : L('Customize message, template & more',
                  'خصّص الرسالة والقالب والمزيد',
                  'پیغام، ٹیمپلیٹ اور مزید حسب ضرورت کریں')}
          </Text>
        </Pressable>

        {!customizeOpen ? null : (
          <View style={styles.customizeBlock}>

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

        {/* Ambient sound — hero card, prominent so users notice the 8
            curated Saudi / nature sounds baked into every card. Uses
            the shared AmbientPickerPill's `hero` variant. */}
        <View style={{ paddingHorizontal: spacing.lg }}>
          <AmbientPickerPill
            storageKey="@duacard:ambient"
            inkColor={template.accent || colors.gold}
            variant="hero"
            lang={lang}
          />
        </View>

        {/* Recipient */}
        <View style={{ paddingHorizontal: spacing.lg, gap: 6 }}>
          <Text style={[styles.sectionLabel, { textAlign: rtl ? 'right' : 'left' }]}>
            {L('TO (OPTIONAL)', 'إلى (اختياري)', 'برائے (اختیاری)')}
          </Text>
          <TextInput
            value={recipient}
            onChangeText={setRecipient}
            placeholder={L("Recipient's name…",
              'اسم المستلم…',
              'وصول کنندہ کا نام…')}
            placeholderTextColor="#B5A985"
            style={[styles.signatureInput, { textAlign: rtl ? 'right' : 'left' }]}
            maxLength={40}
          />
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
            placeholderTextColor="#B5A985"
            style={[styles.messageInput, { textAlign: rtl ? 'right' : 'left' }]}
            maxLength={280}
          />
          <Text style={{ color: '#B5A985', fontSize: 10.5, fontWeight: '600', textAlign: rtl ? 'left' : 'right' }}>
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
            placeholderTextColor="#B5A985"
            style={[styles.signatureInput, { textAlign: rtl ? 'right' : 'left' }]}
            maxLength={40}
          />
        </View>

        {/* Soundscape chip — kept inside Customize for sender to swap
            reciter or dua if they want to override the hero grid pick. */}
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: 10, alignItems: 'flex-start' }}>
          <SoundscapeChip
            value={soundscapeSel}
            onChange={handleSoundscapePick}
            lang={(lang as 'en' | 'ar' | 'ur') || 'en'}
            testID="dua-card-soundscape-chip"
          />
        </View>

          </View>
        )}
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

      {/* Loved-Ones editor sheet — opened from the DedicationPicker's
          "manage" row. Owned here (not by DedicationPicker) so all
          the app's dua-related screens can share one open state. */}
      <LovedOnesSheet
        visible={lovedSheetOpen}
        onClose={() => setLovedSheetOpen(false)}
        lang={lang as DedicationLang}
        strings={{
          title: L('Your Loved Ones', 'أحبّتك', 'آپ کے پیارے'),
          subtitle: L('Add family & friends once — every card can be dedicated.', 'أضف الأسرة والأصدقاء مرة واحدة — يمكن إهداء كل بطاقة.', 'گھر والوں اور دوستوں کو ایک بار شامل کریں — ہر کارڈ نام کیا جا سکتا ہے۔'),
          emptyLine: L('Add someone you love so every duʿā can carry their name.', 'أضف من تحبّ ليحمل كل دعاء اسمه.', 'کسی پیارے کو شامل کریں تاکہ ہر دعا ان کے نام سے جائے۔'),
          addBtn: L('Add a loved one', 'أضف عزيزًا', 'ایک پیارا شامل کریں'),
          editLabel: L('Edit', 'تعديل', 'ترمیم'),
          deleteLabel: L('Delete', 'حذف', 'حذف'),
          namePlaceholder: L('Their name (e.g. Aisha)', 'اسمهم (مثال: عائشة)', 'ان کا نام (مثلاً: عائشہ)'),
          arabicNameLabel: L('Arabic spelling (optional)', 'الاسم بالعربية (اختياري)', 'عربی ہجے (اختیاری)'),
          relationshipLabel: L('Relationship', 'صلة القرابة', 'رشتہ'),
          genderLabel: L('Gender', 'الجنس', 'جنس'),
          deceasedLabel: L('Deceased — dedicate as a memorial', 'مُتوفَّى — إهداء تذكاري', 'مرحوم — یاد کے لیے نام کریں'),
          saveBtn: L('Save', 'حفظ', 'محفوظ کریں'),
          cancelBtn: L('Cancel', 'إلغاء', 'منسوخ'),
          closeBtn: L('Done', 'تم', 'ہو گیا'),
          previewLabel: L('Preview', 'معاينة', 'پیش نظارہ'),
          female: L('Sister / Female', 'أنثى', 'بہن / خاتون'),
          male: L('Brother / Male', 'ذكر', 'بھائی / مرد'),
          rel: {
            mother: L('Mother', 'الأم', 'والدہ'),
            father: L('Father', 'الأب', 'والد'),
            wife: L('Wife', 'الزوجة', 'اہلیہ'),
            husband: L('Husband', 'الزوج', 'شوہر'),
            daughter: L('Daughter', 'الابنة', 'بیٹی'),
            son: L('Son', 'الابن', 'بیٹا'),
            sister: L('Sister', 'الأخت', 'بہن'),
            brother: L('Brother', 'الأخ', 'بھائی'),
            grandmother: L('Grandmother', 'الجدة', 'دادی / نانی'),
            grandfather: L('Grandfather', 'الجد', 'دادا / نانا'),
            aunt: L('Aunt', 'الخالة/العمة', 'خالہ / پھوپھی'),
            uncle: L('Uncle', 'الخال/العم', 'ماموں / چچا'),
            friend: L('Friend', 'صديق', 'دوست'),
            teacher: L('Teacher', 'المعلم', 'استاد'),
            other: L('Loved one', 'عزيز', 'پیارے'),
          },
        }}
        theme={{
          bg: colors.navy, card: colors.navyElevated, text: colors.cream,
          textMuted: colors.creamDim, accent: colors.gold, danger: '#E57373',
          overlay: 'rgba(0,0,0,0.65)', inputBg: colors.navyElevated,
          border: colors.goldMuted,
        }}
      />

      {/* Post-send celebration — confetti, treasure-box gem, weekly credit. */}
      <GifterRewardModal
        visible={rewardModal.visible}
        onClose={() => setRewardModal((s) => ({ ...s, visible: false }))}
        gemIdx={rewardModal.gemIdx}
        awardedCredit={rewardModal.awarded}
        lifetimeGifts={rewardModal.lifetime || lifetimeGifts}
        aiCreditLabel="Ask the Sheikh"
        aiCreditRoute="/companion"
        lang={lang as RewardLang}
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
  recipient?: string,
): string {
  const parts: string[] = [];
  if (recipient && recipient.trim().length > 0) {
    const toLbl = lang === 'ar' ? 'إلى' : lang === 'ur' ? 'برائے' : 'To';
    parts.push(`${toLbl} ${recipient.trim()}\n`);
  }
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
  kicker: { color: colors.goldBright, fontSize: 10, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' },
  title: { color: '#FFF4D9', fontSize: 22, fontWeight: '900', marginTop: 2, letterSpacing: 0.3 },

  // Calligraphy discovery pill
  calligPill: {
    marginHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gold + '55',
    backgroundColor: colors.gold + '11',
  },
  calligPillTitle: { color: '#FFF4D9', fontSize: 13, fontWeight: '800' },
  calligPillDesc: { color: '#EDE2BF', fontSize: 11, marginTop: 2 },


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
    color: '#F4ECD8', fontSize: 11, textAlign: 'center', fontWeight: '700', lineHeight: 13.5,
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
  recipient: {
    fontSize: 12.5, fontWeight: '700', fontStyle: 'italic',
    marginTop: 4, letterSpacing: 0.2, maxWidth: 280, alignSelf: 'center',
  },
  customizeToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: spacing.lg, marginTop: 6,
    paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 12, borderWidth: 1,
    borderColor: colors.gold + '66',
    backgroundColor: '#2A4875',
  },
  customizeToggleText: {
    flex: 1, color: '#FFF4D9', fontSize: 13.5, fontWeight: '800',
  },
  customizeBlock: {
    gap: spacing.md,
    opacity: 0.92,
  },
  liveChip: {
    position: 'absolute',
    top: 10, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 999, borderWidth: 1.25,
    backgroundColor: 'rgba(0,0,0,0.35)',
    maxWidth: 240,
    zIndex: 5,
  },
  liveChipLabel: {
    fontSize: 12, fontWeight: '800', letterSpacing: 0.3,
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
    fontSize: 12.5, lineHeight: 18,
    paddingHorizontal: 10, maxWidth: 280,
  },
  signature: {
    fontSize: 12, fontWeight: '700', fontStyle: 'italic',
  },
  watermark: {
    fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase',
    fontWeight: '700',
  },

  // Mood toggle pill — top-right under the corner motif
  moodPill: {
    position: 'absolute',
    top: 40, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 999, borderWidth: 1,
    zIndex: 2,
  },
  moodPillLabel: {
    fontSize: 10.5, fontWeight: '900', letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  // Sections
  sectionLabel: {
    color: colors.goldBright, fontSize: 10.5, fontWeight: '900', letterSpacing: 1.5,
  },
  swapBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: colors.gold + '77',
    backgroundColor: '#2A4875',
  },
  swapBtnAr: { color: '#FFF4D9', fontSize: 20, fontWeight: '800' },
  swapBtnTranslit: { color: '#EDE2BF', fontSize: 11.5, marginTop: 2, fontWeight: '600' },

  messageInput: {
    minHeight: 90,
    borderWidth: 1, borderColor: colors.gold + '77',
    borderRadius: 14,
    padding: 12,
    color: '#FFF4D9', fontSize: 14.5, lineHeight: 20, fontWeight: '500',
    backgroundColor: '#2A4875',
    textAlignVertical: 'top',
  },
  signatureInput: {
    borderWidth: 1, borderColor: colors.gold + '77',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    color: '#FFF4D9', fontSize: 14.5, fontWeight: '500',
    backgroundColor: '#2A4875',
  },

  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 999,
    backgroundColor: colors.gold,
    marginTop: 4,
  },
  sendBtnText: { color: colors.navy, fontWeight: '900', fontSize: 14, letterSpacing: 0.3 },
  hint: {
    color: '#C9BE9A', fontSize: 11.5, textAlign: 'center', marginTop: 6, fontStyle: 'italic', fontWeight: '500',
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
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    textShadowColor: '#F6D06C88',
    textShadowRadius: 8,
    letterSpacing: 0.3,
  },
  modalGroup: {
    color: '#FFD56E',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '900',
    marginBottom: 8, marginTop: 6,
    textShadowColor: '#F6D06C44',
    textShadowRadius: 4,
  },
  pickRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 12, marginBottom: 6,
    borderRadius: 12,
    borderWidth: 1, borderColor: colors.gold + '55',
    backgroundColor: '#152C44',
  },
  pickRowActive: { borderColor: '#FFD56E', backgroundColor: '#FFD56E22' },
  pickAr: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    textShadowColor: '#FFD56EAA',
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 0 },
  },
  pickTranslit: {
    color: '#FFD56E',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
    letterSpacing: 0.3,
  },
  pickMeaning: {
    color: '#E7D9B6',
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
    fontWeight: '500',
  },
});
