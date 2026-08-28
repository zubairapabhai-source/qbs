import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../src/theme';
import { useApp } from '../src/store/useApp';
import { getEntitlement } from '../src/api';
// Side-effect: keep STR/t() in sync with the language picked in Settings.
import '../src/i18n/bridge';
import { initSentry, attachSentryUser, SentryWrap } from '../src/sentry';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { AmbientAudioProvider } from '../src/audio';
import { useStorePurchases } from '../src/iap/iap';

// Initialise Sentry as early as possible (no-op if DSN missing).
initSentry();

function RootLayout() {
  const hydrate = useApp((s) => s.hydrate);
  const deviceId = useApp((s) => s.deviceId);
  const setEntitlement = useApp((s) => s.setEntitlement);

  // Mount the IAP hook at the ROOT so its silent-restore effect
  // (getAvailablePurchases → auto-unlock) fires on every app boot without
  // requiring the user to visit /unlock. This heals paid users whose
  // local `unlocked` flag reset (e.g. after force-quit or fresh install)
  // even when the £0.99 receipt hasn't reached our backend yet.
  useStorePurchases();

  // Load the Qur'an-page typography (Amiri Quran Coloured — tajweed-marked Naskh).
  // ~150KB one-time bundle. Non-blocking: the reader falls back to system font
  // until the family finishes loading, then re-renders.
  useFonts({
    AmiriQuranColored: require('../assets/fonts/AmiriQuranColored.ttf'),
    AmiriQuran: require('../assets/fonts/AmiriQuran.ttf'),
  });

  useEffect(() => { hydrate(); }, [hydrate]);

  // Attach deviceId to Sentry so help-button reports carry user context.
  useEffect(() => {
    if (deviceId) attachSentryUser(deviceId);
  }, [deviceId]);

  // After hydration, sync entitlement from server (unlocks real users'
  // lifetime unlock + question pack balance).
  //
  // CRITICAL: server-side unlock can only PROMOTE the local state, never
  // demote it. This protects users whose Apple / Google receipt has been
  // captured locally (via IAP or Restore Purchases) but is still pending
  // finalisation on Apple's / Google's side and therefore hasn't reached
  // our backend yet — without this guard, the sync flips them back to
  // "locked" on every app relaunch and their AI Sheikh + Qurʾān vs Bible
  // premium content silently disappears.
  useEffect(() => {
    if (!deviceId) return;
    (async () => {
      try {
        const resp: any = await getEntitlement(deviceId);
        // `tryFetch` wraps the result in { data, live } — unwrap it.
        const ent = resp && typeof resp === 'object' && 'data' in resp ? resp.data : resp;
        if (ent && typeof ent === 'object') {
          const patch: any = {
            packBalance: Number(ent.question_pack_balance || 0),
            weeklyUsed: Number(ent?.weekly_questions?.used || 0),
          };
          // ONLY set unlocked to true if the server confirms it — never
          // overwrite a locally-unlocked flag with a server "false".
          if (ent.unlocked === true) patch.unlocked = true;
          setEntitlement(patch);
        }
      } catch { /* offline / preview — keep local state */ }
    })();
  }, [deviceId, setEntitlement]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <AmbientAudioProvider>
            <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.bg },
              headerTintColor: colors.silverHi,
              headerTitleStyle: { fontWeight: '700' },
              contentStyle: { backgroundColor: colors.bg },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="scientist/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name="entry/[slug]" options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name="verse/[key]" options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name="settings" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade', gestureEnabled: false }} />
            <Stack.Screen name="unlock" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
            <Stack.Screen name="share" options={{ headerShown: false, animation: 'slide_from_bottom', presentation: 'modal' }} />
            <Stack.Screen name="quran/index" options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name="quran/page/[n]" options={{ headerShown: false, animation: 'fade' }} />
            <Stack.Screen name="quran/bookmarks" options={{ headerShown: false, animation: 'slide_from_right' }} />
          </Stack>
          </AmbientAudioProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default SentryWrap(RootLayout);
