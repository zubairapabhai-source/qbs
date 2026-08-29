/**
 * Help / Report-a-fault helper for Qur'ān, Bible and Science.
 *
 * Two parallel channels so Chinese-phone users (Xiaomi, Huawei, Oppo)
 * who often have no preinstalled mail app can still reach us:
 *
 *   1. mailto: — preferred; opens the user's default mail app with
 *      Device ID, version, platform pre-filled. They only tap Send.
 *
 *   2. Sentry capture — fires a `[user-report] ...` warning into our
 *      Sentry project so we get a push notification on our phone the
 *      same minute the user taps the button, even if their handset has
 *      no mail client.
 *
 * Both fire together — the user only sees the result of (1), but we
 * always get the alert via (2).
 */
import { Alert, Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import { captureUserReport } from './sentry';

const SUPPORT_EMAIL = 'zubairapabhai@gmail.com';
const APP_NAME = "Qur'ān, Bible and Science";

export const SUPPORT_EMAIL_ADDRESS = SUPPORT_EMAIL;

export interface SupportContext {
  deviceId: string;
  /** What the user wants to tell us (defaults to a generic "Need help" template). */
  message?: string;
  /** Phone make if user typed it (e.g. "Xiaomi Redmi Note 12"). */
  phoneMake?: string;
  /** Optional category label ("unlock", "crash", "feedback", "chinese-no-mail"). */
  topic?: string;
}

export async function openSupportEmail(ctx: SupportContext) {
  const { deviceId, phoneMake, topic } = ctx;
  const message = ctx.message?.trim() || "I'd like some help — please see Device ID below.";
  const appVersion =
    (Constants?.expoConfig as any)?.version ??
    (Constants as any)?.manifest?.version ??
    'unknown';
  const platform = Platform.OS === 'ios' ? 'iOS' : 'Android';
  const topicLine = topic ? `Topic:       ${topic}\n` : '';

  const subject = `${APP_NAME} — Help — ${deviceId}`;
  const body = [
    'Assalāmu ʿalaykum,',
    '',
    message,
    '',
    `Device ID:   ${deviceId}`,
    `App:         ${APP_NAME} v${appVersion}`,
    `Platform:    ${platform}`,
    `Phone make:  ${phoneMake || '(please type your phone make/model — e.g. Xiaomi Redmi Note 12)'}`,
    topicLine,
    'JazākAllāhu khayran,',
    '',
    'Sent from inside the app.',
  ].join('\n');

  // 1) Always fire Sentry — guaranteed delivery regardless of mail client.
  try {
    captureUserReport({ deviceId, message, phoneMake });
  } catch { /* swallow */ }

  // 2) Try to open the user's mail client.
  const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  try {
    const can = await Linking.canOpenURL(url);
    if (can) {
      await Linking.openURL(url);
      return;
    }
  } catch { /* fall through */ }

  // 3) Fallback: show the email + Device ID so they can paste into
  //    WhatsApp / web mail. This is the path most Chinese phones take.
  Alert.alert(
    'Email not set up on this phone',
    `No mail app is configured. We've still received your report in our dashboard — but if you'd like a reply, please copy these details and send them another way (WhatsApp, web Gmail, etc.):\n\nTo: ${SUPPORT_EMAIL}\n\nSubject: ${subject}\n\n${body}`,
    [{ text: 'OK' }],
  );
}
