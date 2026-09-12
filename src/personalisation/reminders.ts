/**
 * Daily Reminders — QBS (morning + evening)
 *
 * TWO local notifications per day:
 *   • Morning (08:00 default) — motivational: "Return to the Qur'ān"
 *   • Evening (21:00 default) — reflective: "End your day with a page"
 *
 * Both fire on-device with expo-notifications' repeating DAILY trigger
 * — zero server infra, zero cost, survives reboots.  Copy adapts to the
 * user's current streak so reminders feel personal, not generic.
 *
 * License note: fully trilingual (EN / AR / UR) using the same lang
 * state as the rest of the app.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { formatISO } from 'date-fns';
import type { StreakState } from './streak';

const CHANNEL_ID = 'qbs-daily-reminder';
const ID_MORNING = 'qbs-reminder-morning-v1';
const ID_EVENING = 'qbs-reminder-evening-v1';

export const DEFAULT_MORNING_HOUR = 8;    // 08:00 — after Fajr
export const DEFAULT_EVENING_HOUR = 21;   // 21:00 — before Ishāʾ wind-down

type Lang = 'en' | 'ar' | 'ur';
type Slot = 'morning' | 'evening';
interface Copy { title: string; body: string; }

// ── Trilingual copy that adapts to streak + slot ─────────────────────
function reminderCopy(slot: Slot, streak: StreakState | undefined, lastPage: number, lang: Lang): Copy {
  const s = streak?.current ?? 0;

  const table: Record<Slot, Record<Lang, (s: number, p: number) => Copy>> = {
    morning: {
      en: (s, p) => s === 0
        ? { title: 'Return to the Qur\'ān', body: `Assalāmu ʿAlaikum — your mushaf is waiting on page ${p}.` }
        : s < 7
          ? { title: `Day ${s} — keep going`, body: `MashaAllah — ${s} day${s === 1 ? '' : 's'} in a row. Continue on page ${p}.` }
          : s < 30
            ? { title: `${s} days strong 🌟`, body: `A week+ with the Book of Allah. Page ${p} awaits.` }
            : { title: `${s} days · light upon light`, body: `The most beloved deeds are the consistent ones. Page ${p}.` },
      ar: (s, p) => s === 0
        ? { title: 'ارجع إلى القرآن', body: `السلام عليكم — مصحفك بانتظارك على الصفحة ${p}.` }
        : s < 7
          ? { title: `اليوم ${s} — استمر`, body: `ما شاء الله — ${s} أيام متتالية. تابع من الصفحة ${p}.` }
          : s < 30
            ? { title: `${s} أيام متواصلة 🌟`, body: `أسبوع كامل مع كتاب الله. الصفحة ${p} تنتظرك.` }
            : { title: `${s} يومًا · نور على نور`, body: `أحب الأعمال ما دام وإن قل. الصفحة ${p}.` },
      ur: (s, p) => s === 0
        ? { title: 'قرآن کی طرف واپس آئیں', body: `السلام علیکم — آپ کا مصحف صفحہ ${p} پر منتظر ہے۔` }
        : s < 7
          ? { title: `دن ${s} — جاری رکھیں`, body: `ماشاءاللہ — ${s} دن مسلسل۔ صفحہ ${p} سے جاری رکھیں۔` }
          : s < 30
            ? { title: `${s} دن مسلسل 🌟`, body: `پورا ہفتہ+ کتابِ الٰہی کے ساتھ۔ صفحہ ${p} منتظر ہے۔` }
            : { title: `${s} دن · نور علیٰ نور`, body: `اللہ کو سب سے پیارا عمل وہ ہے جو مستقل ہو۔ صفحہ ${p}.` },
    },
    evening: {
      en: (s, p) => s === 0
        ? { title: 'End your day with a page', body: 'A single ayah before sleep is barakah for the night.' }
        : { title: 'One page before Ishāʾ', body: `Close today with page ${p}. Your ${s}-day streak thanks you.` },
      ar: (s, p) => s === 0
        ? { title: 'اختم يومك بصفحة', body: 'آية واحدة قبل النوم بركة لليلة.' }
        : { title: 'صفحة قبل العشاء', body: `أنهِ يومك بالصفحة ${p}. سلسلتك ${s} أيام تشكرك.` },
      ur: (s, p) => s === 0
        ? { title: 'اپنا دن ایک صفحے سے ختم کریں', body: 'سونے سے پہلے ایک آیت رات کے لیے برکت ہے۔' }
        : { title: 'عشاء سے پہلے ایک صفحہ', body: `آج کا اختتام صفحہ ${p} سے کریں۔ آپ کی ${s}-دن کی سلسلہ شکر گزار ہے۔` },
    },
  };

  return table[slot][lang](s, lastPage);
}

// ── Foreground handler (show banners even when app is open) ──────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, shouldShowBanner: true, shouldShowList: true,
    shouldPlaySound: false, shouldSetBadge: false,
  }),
});

// ── Public API ───────────────────────────────────────────────────────

export async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Daily Qur\'ān reminder',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: null,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E8C66A',
    });
  } catch { /* already exists */ }
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.status === 'granted') return true;
    if (!existing.canAskAgain) return false;
    const res = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: false },
    });
    return res.status === 'granted';
  } catch { return false; }
}

export async function cancelAllReminders(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(ID_MORNING);
  } catch {}
  try {
    await Notifications.cancelScheduledNotificationAsync(ID_EVENING);
  } catch {}
}

/**
 * Schedule the morning + evening reminders.  Idempotent (safely cancels
 * prior schedules first).  Returns true if BOTH schedules were placed.
 */
export async function scheduleDailyReminders(
  streak: StreakState | undefined,
  lastPage: number,
  lang: Lang,
  opts?: {
    morningHour?: number;
    morningMinute?: number;
    eveningHour?: number;
    eveningMinute?: number;
  }
): Promise<boolean> {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return false;

    await cancelAllReminders();

    const mCopy = reminderCopy('morning', streak, lastPage, lang);
    const eCopy = reminderCopy('evening', streak, lastPage, lang);

    await Notifications.scheduleNotificationAsync({
      identifier: ID_MORNING,
      content: {
        title: mCopy.title, body: mCopy.body,
        data: { screen: 'quran', slot: 'morning' },
        sound: null,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: opts?.morningHour ?? DEFAULT_MORNING_HOUR,
        minute: opts?.morningMinute ?? 0,
        channelId: CHANNEL_ID,
      },
    });

    await Notifications.scheduleNotificationAsync({
      identifier: ID_EVENING,
      content: {
        title: eCopy.title, body: eCopy.body,
        data: { screen: 'quran', slot: 'evening' },
        sound: null,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: opts?.eveningHour ?? DEFAULT_EVENING_HOUR,
        minute: opts?.eveningMinute ?? 0,
        channelId: CHANNEL_ID,
      },
    });

    return true;
  } catch (err) {
    console.warn('[qbs reminders] schedule failed:', err);
    return false;
  }
}

export async function areRemindersScheduled(): Promise<boolean> {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    return all.some((n) => n.identifier === ID_MORNING);
  } catch { return false; }
}

export function todayIso(): string {
  return formatISO(new Date(), { representation: 'date' });
}
