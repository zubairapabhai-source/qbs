/**
 * Verse audio player — free recitations from EveryAyah.com.
 *
 * Uses expo-audio (the modern replacement for the deprecated expo-av).
 * Default reciter: Mishary Rashid Alafasy (128 kbps), a clear and widely-loved Qari.
 */
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, View, Text } from 'react-native';
import { useAmbientAudio } from '../audio';
import { colors, radius, type as ty } from '../theme';

const RECITER = 'Alafasy_128kbps';

export function verseAudioUrl(verseKey: string | undefined | null): string | null {
  if (!verseKey || typeof verseKey !== 'string') return null;
  const m = /^(\d{1,3}):(\d{1,3})$/.exec(verseKey.trim());
  if (!m) return null;
  const surah = m[1].padStart(3, '0');
  const ayah = m[2].padStart(3, '0');
  return `https://everyayah.com/data/${RECITER}/${surah}${ayah}.mp3`;
}

interface Props {
  verseKey: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  light?: boolean; // for use on bright tile backgrounds
}

export function VerseAudioButton(props: Props) {
  const url = useMemo(() => verseAudioUrl(props.verseKey), [props.verseKey]);
  if (!url) return null;
  return <PlayerCore {...props} url={url} />;
}

function PlayerCore({ verseKey, size = 'md', showLabel = false, label, light = false, url }: Props & { url: string }) {
  const player = useAudioPlayer({ uri: url });
  const status = useAudioPlayerStatus(player);
  const { duck } = useAmbientAudio();
  // Holds the release function returned by ambient duck() while we're playing.
  const unduckRef = useRef<null | (() => void)>(null);

  const isPlaying = !!status?.playing;
  const isLoading = status && !status.isLoaded && !status.didJustFinish;

  // Whenever this recitation is actually playing, hold the stream silent;
  // release the duck-ref the moment it pauses, ends, or this component
  // unmounts. Reference-counted in the AmbientAudioProvider so multiple
  // simultaneous players don't fight each other.
  //
  // We also register the player as ACTIVE FOR LOCK SCREEN — this is the
  // critical call on Android that spins up expo-audio's AudioControlsService
  // as a foreground service so playback survives screen lock / app
  // backgrounding. Without it, Android kills the audio after ~3 minutes
  // (or immediately when the screen turns off on some OEMs). See
  // https://docs.expo.dev/versions/latest/sdk/audio/#lockscreen-controls
  useEffect(() => {
    if (isPlaying && !unduckRef.current) {
      unduckRef.current = duck();
      try {
        (player as any).setActiveForLockScreen?.(true, {
          title: `Qur'ān ${verseKey}`,
          artist: 'Sheikh Mishary Rashid Alafasy',
          albumTitle: 'Quran, Bible and Science',
        });
      } catch { /* iOS pre-1.1 or unsupported — playback still works via UIBackgroundModes */ }
    } else if (!isPlaying && unduckRef.current) {
      unduckRef.current();
      unduckRef.current = null;
      try { (player as any).setActiveForLockScreen?.(false); } catch {}
    }
    return () => {
      if (unduckRef.current) { unduckRef.current(); unduckRef.current = null; }
      try { (player as any).setActiveForLockScreen?.(false); } catch {}
    };
  }, [isPlaying, duck, player, verseKey]);

  const dim = size === 'sm' ? 32 : size === 'lg' ? 48 : 38;
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 22 : 18;
  const fg = light ? colors.bg : colors.gold;
  const bg = light ? colors.gold : colors.bgElevated;
  const border = light ? colors.goldDeep : colors.gold + '88';

  const toggle = () => {
    if (!player) return;
    if (isPlaying) player.pause();
    else {
      player.seekTo(0);
      player.play();
    }
  };

  return (
    <Pressable
      onPress={toggle}
      hitSlop={6}
      style={({ pressed }) => [
        styles.btn,
        { width: showLabel ? undefined : dim, height: dim, backgroundColor: bg, borderColor: border, paddingHorizontal: showLabel ? 14 : 0 },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Ionicons
        name={isLoading ? 'ellipsis-horizontal' : (isPlaying ? 'pause' : 'play')}
        size={iconSize}
        color={fg}
      />
      {showLabel ? (
        <Text style={[styles.label, { color: fg }]}>
          {label ?? (isPlaying ? 'Pause' : 'Listen')}
        </Text>
      ) : null}
      {showLabel ? (
        <View style={[styles.qariDot, { backgroundColor: fg + '55' }]} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
  },
  label: { ...ty.small, fontWeight: '700' },
  qariDot: { width: 4, height: 4, borderRadius: 2, marginLeft: 2 },
});
