import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
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

// Initialise Sentry as early as possible (no-op if DSN missing).
initSentry();

function RootLayout() {
  const hydrate = useApp((s) => s.hydrate);
  const deviceId = useApp((s) => s.deviceId);
  const setEntitlement = useApp((s) => s.setEntitlement);

  useEffect(() => { hydrate(); }, [hydrate]);

  // Attach deviceId to Sentry so help-button reports carry user context.
  useEffect(() => {
    if (deviceId) attachSentryUser(deviceId);
  }, [deviceId]);

  // After hydration, sync entitlement from server (unlocks preview devices,
  // restores real users' lifetime unlock + question pack balance).
  useEffect(() => {
    if (!deviceId) return;
    (async () => {
      try {
        const resp: any = await getEntitlement(deviceId);
        // `tryFetch` wraps the result in { data, live } — unwrap it.
        const ent = resp && typeof resp === 'object' && 'data' in resp ? resp.data : resp;
        if (ent && typeof ent === 'object') {
          setEntitlement({
            unlocked: !!ent.unlocked,
            packBalance: Number(ent.question_pack_balance || 0),
            weeklyUsed: Number(ent?.weekly_questions?.used || 0),
          });
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
          </Stack>
          </AmbientAudioProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default SentryWrap(RootLayout);
