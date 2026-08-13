/**
 * Root entry — checks first-launch state.
 *
 * On very first launch, shows the mandatory Aqeedah / Qurʾān-and-science
 * introduction (verbatim user text, per /app/memory/APP3_DECISIONS_2026_06_16.md).
 * On subsequent launches, jumps straight to the tab grid — matching the
 * Treasures app's land-and-go experience.
 *
 * The introduction is always re-accessible from Settings.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { ONBOARDING_KEY } from './onboarding';
import { colors } from '../src/theme';

export default function Index() {
  const [ready, setReady] = useState(false);
  const [seenOnboarding, setSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(ONBOARDING_KEY);
        setSeenOnboarding(v === '1');
      } catch {
        setSeenOnboarding(true); // fail-open: don't gate the app on storage errors
      }
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.silver} />
      </View>
    );
  }

  if (seenOnboarding === false) {
    return <Redirect href="/onboarding" />;
  }
  return <Redirect href="/(tabs)" />;
}
