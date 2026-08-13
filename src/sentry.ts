// Sentry initialisation for the Qur'ān, Bible and Science React Native client.
// DSN is provided via EXPO_PUBLIC_SENTRY_DSN in /app/app3_frontend/.env.
// If missing/invalid, all calls become no-ops — telemetry never crashes the app.

import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

let initialized = false;

export function initSentry(): void {
  if (initialized) return;
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn || !dsn.startsWith('https://')) {
    // Quietly skip — placeholder until DSN is provided.
    return;
  }

  try {
    const release =
      (Constants.expoConfig?.version as string | undefined) || '0.1.0';

    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      profilesSampleRate: 0.0,
      environment: __DEV__ ? 'development' : 'production',
      release: `quran-bible-science@${release}`,
      dist: Platform.OS,
      enableAutoPerformanceTracing: false,
      enableNativeFramesTracking: false,
      attachStacktrace: true,
      sendDefaultPii: false,
      ignoreErrors: [
        'Network request failed',
        'AbortError',
        'cancelled',
        'NetworkError',
        'NetworkError: A network error occurred.',
        'Load failed',
        'fetch failed',
        'AbortError: The operation was aborted',
      ],
      // Drop events from non-production, web preview, or headless contexts.
      beforeSend(event) {
        try {
          if (event.environment === 'development') return null;
          if (event.dist === 'web') return null;
          const ua =
            event.request?.headers?.['User-Agent']
            || (event.contexts as any)?.browser?.name
            || '';
          if (typeof ua === 'string' && /HeadlessChrome|Playwright|puppeteer/i.test(ua)) {
            return null;
          }
        } catch {
          /* noop — never break telemetry on telemetry */
        }
        return event;
      },
    });
    // Tag every event so the dashboard can filter between the 3 apps when
    // sharing one Sentry org.
    Sentry.setTag('app', 'quran-bible-science');
    initialized = true;
  } catch (e) {
    console.warn('[sentry] init failed', e);
  }
}

// Call after device id is known so every error has user context attached.
export function attachSentryUser(deviceId: string): void {
  if (!initialized) return;
  try {
    Sentry.setUser({ id: deviceId });
    Sentry.setTag('device_id', deviceId);
  } catch {
    /* noop */
  }
}

/**
 * Manually push a user-submitted report into Sentry. Triggered by the
 * in-app "Help" button so users on Chinese phones without a mail app
 * (Xiaomi/Huawei/Oppo) can still flag a fault to us without losing the
 * Device ID context.
 */
export function captureUserReport(opts: {
  deviceId: string;
  message: string;
  phoneMake?: string;
}): void {
  if (!initialized) {
    // Even with Sentry disabled (e.g. preview), don't lose the message —
    // log it loudly so the dev console shows it.
    console.warn('[help] user report (Sentry disabled):', opts);
    return;
  }
  try {
    Sentry.withScope((scope) => {
      scope.setTag('source', 'help-button');
      scope.setTag('device_id', opts.deviceId);
      if (opts.phoneMake) scope.setTag('phone_make', opts.phoneMake);
      scope.setContext('user_report', {
        device_id: opts.deviceId,
        phone_make: opts.phoneMake || 'unspecified',
        message: opts.message,
      });
      scope.setLevel('warning');
      Sentry.captureMessage(
        `[user-report] ${opts.message.slice(0, 120)}`,
      );
    });
  } catch (e) {
    console.warn('[sentry] captureUserReport failed', e);
  }
}

export const SentryWrap = Sentry.wrap;
export { Sentry };
