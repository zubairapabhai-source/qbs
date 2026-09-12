/**
 * OTA auto-apply hook.
 *
 * Default Expo behavior: an OTA update downloads in the background on launch
 * #1 and only APPLIES on launch #2 — meaning users need to force-close and
 * reopen twice to see a fix. That's a poor experience for hot-fixes.
 *
 * This hook watches for update events and, once a new update has finished
 * downloading, quietly reloads the JS bundle so the update takes effect on
 * the very next tick — no double force-close required.
 *
 * Design choices:
 *  • Only auto-reload when the app is BACKGROUNDED or has been idle for
 *    >20s — never yank the UI out from under a user mid-interaction.
 *  • Web / Expo Go: no-op (`Updates.reloadAsync` isn't meaningful there).
 *  • Fail-silent — never crash the app if expo-updates isn't linked.
 */
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';

let Updates: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Updates = require('expo-updates');
} catch { /* not linked */ }

export function useOtaAutoApply() {
  const downloadedRef = useRef(false);
  const idleTimerRef = useRef<any>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (!Updates || Platform.OS === 'web') return;

    let cancelled = false;

    // 1. On mount, kick off a check → download → mark ready.
    (async () => {
      try {
        const res = await Updates.checkForUpdateAsync();
        if (cancelled || !res?.isAvailable) return;
        const fetch = await Updates.fetchUpdateAsync();
        if (cancelled || !fetch?.isNew) return;
        downloadedRef.current = true;
        scheduleApply();
      } catch { /* offline / no update / not signed in — silent */ }
    })();

    // 2. If the user backgrounds the app, apply immediately.
    const sub = AppState.addEventListener('change', (next) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if (downloadedRef.current && prev === 'active' && next !== 'active') {
        // App just went to background — safest moment to reload.
        Updates.reloadAsync().catch(() => {});
      }
    });

    // 3. Fallback: if user stays foregrounded for 20+ s without backgrounding,
    //    apply during a natural idle moment.
    function scheduleApply() {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        if (downloadedRef.current && appStateRef.current === 'active') {
          Updates.reloadAsync().catch(() => {});
        }
      }, 20000);
    }

    return () => {
      cancelled = true;
      sub.remove();
      clearTimeout(idleTimerRef.current);
    };
  }, []);
}
