/**
 * Web Speech API fallback for browser preview.
 *
 * On native (iOS/Android), the Sheikh and Recite tabs use `expo-speech-recognition`.
 * On web (Emergent preview, browser users), that module returns no-ops — so we
 * use the browser's built-in `webkitSpeechRecognition` / `SpeechRecognition`
 * which is supported in Chrome, Edge, Safari, and most modern browsers.
 *
 * Returns a recognizer object with `start({ lang, onResult, onEnd, onError })`
 * and `stop()`. Returns `null` if the browser does not support it.
 */
import { Platform } from 'react-native';

export interface WebSpeechSession {
  start(opts: {
    lang: string;
    onResult: (transcript: string, isFinal: boolean) => void;
    onEnd: () => void;
    onError: (msg: string) => void;
  }): void;
  stop(): void;
}

export function createWebSpeechRecognizer(): WebSpeechSession | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;

  const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) return null;

  let rec: any = null;

  return {
    start({ lang, onResult, onEnd, onError }) {
      try {
        rec = new SR();
        rec.lang = lang;
        rec.interimResults = true;
        rec.continuous = false;
        rec.onresult = (ev: any) => {
          let text = '';
          let isFinal = false;
          for (let i = 0; i < ev.results.length; i++) {
            text += ev.results[i][0].transcript;
            if (ev.results[i].isFinal) isFinal = true;
          }
          onResult(text, isFinal);
        };
        rec.onend = () => onEnd();
        rec.onerror = (ev: any) => onError(ev?.error || 'speech error');
        rec.start();
      } catch (e: any) {
        onError(e?.message || String(e));
      }
    },
    stop() {
      try { rec?.stop(); } catch { /* */ }
      rec = null;
    },
  };
}

export function isWebSpeechSupported(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}
