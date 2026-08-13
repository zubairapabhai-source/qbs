/**
 * Stream-water ambient audio for Qur'ān, Bible and Science.
 *
 * Mirrors the calming flowing-water loop used in the Dreams app — same
 * royalty-free recording on Mixkit (a gentle, non-rhythmic stream).
 *
 * Features:
 *   • Persisted mute state (AsyncStorage)
 *   • Soft fade-in / fade-out (no abrupt clicks)
 *   • Survives browser autoplay block — naturally starts on next tap
 *   • DUCKING: any Verse audio (Listen button) calls `duck()` and the
 *     stream silently fades out; on pause/end the button calls
 *     `unduck()` and the stream fades back in. Multiple players can
 *     register without interfering — the stream stays muted as long as
 *     at least one player holds a duck-ref.
 */
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';

// Bundled CC BY-SA 3.0 field-recording — Piechowice, Poland — Mountain brook
// (Aporee archive #aporee_55628_63588). Pure flowing water, no birds, no
// other ambience. Bundled locally instead of hot-linking a CDN so playback
// always works offline and we never get surprised by a CDN swap. If you
// ever want to change the recording, drop a new MP3 at
//   /app/app3_frontend/assets/audio/stream.mp3
// and Metro will pick it up on the next bundle.
const STREAM_ASSET = require('../assets/audio/stream.mp3');

// Background ambient sits low so it doesn't fight foreground recitation.
// Tuned down from 0.10 → 0.05 → 0.03 → 0.01 → 0.005 → 0.001 → 0.0005 per user
// feedback (2026-06-24) — but 0.0005 (-66 dB) was reported as INAUDIBLE by
// tester on Android tablet (2026-08-05). Restored to 0.05 (~ -26 dB) which
// is a soft, ambient level clearly audible on phone speakers/earbuds
// without competing with recitation. Toggle from the water-icon top-right
// on home to mute/unmute at any time.
const TARGET_VOLUME = 0.05;
const FADE_IN_MS = 1600;
const FADE_DUCK_MS = 350;

const MUTED_KEY = '@qbs:ambient_muted';

type AudioCtx = {
  muted: boolean;
  toggle: () => Promise<void>;
  /** Push a duck-ref. Returns an unduck() function that releases it.
   *  Multiple parallel ducks are reference-counted. */
  duck: () => () => void;
};

const Ctx = createContext<AudioCtx>({
  muted: true,
  toggle: async () => {},
  duck: () => () => {},
});

async function getAudioMuted(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(MUTED_KEY);
    if (v === null) return false; // default: ON (stream playing) for new installs
    return v === '1';
  } catch { return false; }
}
async function setAudioMutedPersist(v: boolean): Promise<void> {
  try { await AsyncStorage.setItem(MUTED_KEY, v ? '1' : '0'); } catch {}
}

export function AmbientAudioProvider({ children }: { children: React.ReactNode }) {
  const [muted, setMuted] = useState(true); // start muted; unmute after hydrate
  const [hydrated, setHydrated] = useState(false);
  const [ducked, setDucked] = useState(false);
  const duckCountRef = useRef(0);
  const fadeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const player = useAudioPlayer(STREAM_ASSET);

  const stopFade = () => {
    if (fadeTimerRef.current) {
      clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  };

  const fadeTo = (to: number, ms: number) => {
    stopFade();
    try {
      const steps = 24;
      const stepMs = Math.max(16, Math.round(ms / steps));
      let current = typeof player.volume === 'number' ? player.volume : 0;
      const delta = (to - current) / steps;
      let i = 0;
      fadeTimerRef.current = setInterval(() => {
        i += 1;
        current = Math.max(0, Math.min(TARGET_VOLUME, current + delta));
        try { player.volume = current; } catch {}
        if (i >= steps) {
          stopFade();
          try { player.volume = to; } catch {}
        }
      }, stepMs);
    } catch {}
  };

  // Hydrate persisted mute state.
  useEffect(() => {
    (async () => {
      const m = await getAudioMuted();
      setMuted(m);
      setHydrated(true);
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: false,
        } as any);
      } catch {}
    })();
    return () => stopFade();
  }, []);

  // Effective play state depends on BOTH the user toggle AND ducking.
  // The stream should be audible only when (not muted) AND (not ducked).
  useEffect(() => {
    if (!hydrated) return;
    try {
      player.loop = true;
      const shouldBeAudible = !muted && !ducked;
      if (!shouldBeAudible) {
        // Muted OR ducked → fade down then pause (if user-muted) or just fade (if ducked, keep loop alive).
        fadeTo(0, muted ? 300 : FADE_DUCK_MS);
        if (muted) {
          setTimeout(() => { try { player.pause(); } catch {} }, 320);
        }
      } else {
        // Set volume to the target BEFORE play() so iOS AVAudioPlayer never
        // starts at default 1.0 (which would cause a brief loud blip). Then
        // re-apply at +50ms and +250ms because some native players reset
        // volume when transitioning from loaded → playing state.
        const desired = ducked ? 0 : TARGET_VOLUME;
        try { player.volume = desired; } catch {}
        try {
          const maybe = player.play() as unknown as Promise<void> | void;
          if (maybe && typeof (maybe as Promise<void>).catch === 'function') {
            (maybe as Promise<void>).catch(() => { /* autoplay-blocked, will resume on next tap */ });
          }
        } catch {}
        // Belt-and-braces re-apply for native iOS (Expo Go on phone).
        setTimeout(() => { try { player.volume = desired; } catch {} }, 50);
        setTimeout(() => { try { player.volume = desired; } catch {} }, 250);
        setTimeout(() => { try { player.volume = desired; } catch {} }, 1000);
        fadeTo(TARGET_VOLUME, FADE_IN_MS);
      }
    } catch {
      if (Platform.OS === 'web') console.log('Stream audio unavailable, continuing silent.');
    }
  }, [muted, ducked, hydrated, player]);  // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = async () => {
    const next = !muted;
    setMuted(next);
    await setAudioMutedPersist(next);
  };

  const duck = () => {
    duckCountRef.current += 1;
    if (duckCountRef.current === 1) setDucked(true);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      duckCountRef.current = Math.max(0, duckCountRef.current - 1);
      if (duckCountRef.current === 0) setDucked(false);
    };
  };

  return <Ctx.Provider value={{ muted, toggle, duck }}>{children}</Ctx.Provider>;
}

export const useAmbientAudio = () => useContext(Ctx);
