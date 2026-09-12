/**
 * useDeepLinkPassport — intercept `sacredtreasures://link?code=XX-XX-XX`
 * URLs (from magic-link shares via WhatsApp / iMessage) and route the user
 * to the Passport screen with the code pre-filled.
 *
 * Same pattern lives in all 3 apps; each uses its own URL scheme:
 *   Treasures → sacredtreasures://
 *   Dreams    → frontend://       (legacy — baked into 1.0.16 native)
 *   QBS       → qbs://
 *
 * OTA-safe: pure JS, no native permissions needed.
 */
import { useEffect } from 'react';
import { Linking } from 'react-native';
import { router } from 'expo-router';

function _extractCode(url: string | null): string | null {
  if (!url) return null;
  // Accept: <scheme>://link?code=XX-XX-XX  OR  <scheme>://passport?code=XX-XX-XX
  try {
    const m = url.match(/[?&]code=([A-Za-z0-9\-]{4,10})/i);
    if (m) return m[1].toUpperCase();
  } catch {}
  return null;
}

export function useDeepLinkPassport() {
  useEffect(() => {
    // 1. Cold-start: launched via link
    Linking.getInitialURL().then((url) => {
      const code = _extractCode(url);
      if (code) {
        // Delay slightly so navigation stack is mounted
        setTimeout(() => {
          try { router.push({ pathname: '/passport', params: { code } } as any); } catch {}
        }, 400);
      }
    }).catch(() => {});
    // 2. Warm-start: link tapped while app already running
    const sub = Linking.addEventListener('url', ({ url }) => {
      const code = _extractCode(url);
      if (code) {
        try { router.push({ pathname: '/passport', params: { code } } as any); } catch {}
      }
    });
    return () => { try { sub.remove(); } catch {} };
  }, []);
}
