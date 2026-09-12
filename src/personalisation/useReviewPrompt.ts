/**
 * useReviewPrompt — QBS
 *
 * Contextual, native App-Store / Google-Play in-app review prompt.
 *
 * BEHAVIOUR
 *   • Call `bumpReviewSignal()` after every meaningful positive action:
 *       - Sheikh answered a question
 *       - User read a verse tafseer to the end
 *       - User completed a milestone (see MilestoneModal)
 *   • After 3 signals AND ≥3 days since install AND ≥90 days since the
 *     last prompt, we fire the native in-app review sheet.
 *   • Apple/Google both HARD-cap prompt frequency (~3/365d), so this hook
 *     is intentionally conservative to avoid wasting our precious prompts
 *     on unhappy users.
 *
 * REFERENCE
 *   Apple HIG: "Prompt when the user has demonstrated engagement — after
 *   completing a task, not when the app launches." → we key on positive
 *   completion events, never on cold-start.
 *   Google Play In-App Review same guidance.
 *
 * STORAGE keys (AsyncStorage):
 *   @qbs:review.installed_at   — ms epoch of first bump (proxy for install)
 *   @qbs:review.signal_count   — integer, resets after each successful prompt
 *   @qbs:review.last_prompt_at — ms epoch of last prompt (prevents spam)
 */
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const INSTALL_KEY = '@qbs:review.installed_at';
const COUNT_KEY = '@qbs:review.signal_count';
const LAST_PROMPT_KEY = '@qbs:review.last_prompt_at';

const MIN_SIGNALS = 3;
const MIN_DAYS_SINCE_INSTALL = 3;
const MIN_DAYS_BETWEEN_PROMPTS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Record one "the user did something worth celebrating" signal, and
 * fire the review prompt if all thresholds are cleared.
 *
 * Never throws — best-effort AsyncStorage + platform review both wrap
 * their own errors internally.
 *
 * @param source  optional string tag (e.g. 'sheikh_answered'), for
 *                future analytics. Currently just improves debuggability.
 */
export async function bumpReviewSignal(_source?: string): Promise<void> {
  try {
    const now = Date.now();

    // 1) Ensure we know when this device first showed signs of engagement.
    const installedAtRaw = await AsyncStorage.getItem(INSTALL_KEY);
    const installedAt = installedAtRaw ? Number(installedAtRaw) : 0;
    if (!installedAt) {
      await AsyncStorage.setItem(INSTALL_KEY, String(now));
    }

    // 2) Increment signal count.
    const countRaw = await AsyncStorage.getItem(COUNT_KEY);
    const count = (countRaw ? Number(countRaw) : 0) + 1;
    await AsyncStorage.setItem(COUNT_KEY, String(count));

    // 3) Threshold checks — bail cheap if any fails.
    if (count < MIN_SIGNALS) return;
    const daysSinceInstall = (now - (installedAt || now)) / DAY_MS;
    if (daysSinceInstall < MIN_DAYS_SINCE_INSTALL) return;

    const lastPromptRaw = await AsyncStorage.getItem(LAST_PROMPT_KEY);
    const lastPromptAt = lastPromptRaw ? Number(lastPromptRaw) : 0;
    if (lastPromptAt && (now - lastPromptAt) / DAY_MS < MIN_DAYS_BETWEEN_PROMPTS) return;

    // 4) Only proceed if the platform supports it (iOS 10.3+, Android
    // Play Services present, and not in Expo Go simulator etc.).
    const available = await StoreReview.isAvailableAsync();
    if (!available) return;
    const hasAction = await StoreReview.hasAction();
    if (!hasAction) return;

    // 5) Request review. Apple/Google decide whether to actually show
    // the sheet (they enforce their own frequency caps too).
    await StoreReview.requestReview();

    // 6) Reset counter and stamp the last-prompt time either way — we
    // don't get a callback telling us if the sheet was actually shown,
    // so we assume yes and back off for MIN_DAYS_BETWEEN_PROMPTS.
    await AsyncStorage.setItem(COUNT_KEY, '0');
    await AsyncStorage.setItem(LAST_PROMPT_KEY, String(now));
  } catch {
    // Silent — review prompting must NEVER crash a user flow.
  }
}
