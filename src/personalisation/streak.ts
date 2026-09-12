/**
 * Streak Engine — QBS
 *
 * Tracks days-in-a-row the user did a meaningful action inside the app
 * (opened a Qur'ān page, asked the AI Sheikh a question, opened a
 * scientist verse, etc.).  Persisted in the same Zustand store as the
 * rest of the app so the streak is available everywhere with zero
 * backend cost — everything lives on-device, keyed by the local
 * `deviceId` for anonymity.
 *
 * Public surface (all imported from useApp):
 *   • state.streak.current        — days in a row today
 *   • state.streak.longest        — personal best
 *   • state.streak.lastActionAt   — ISO date of the last recorded action
 *   • state.streak.milestones     — ["7","30","100"] — celebrations already shown
 *   • actions.recordAction()      — call this after ANY meaningful action;
 *                                    it's idempotent per calendar day
 *   • actions.markMilestoneShown(n) — once a 7/30/100/365 celebration is shown
 */
import { differenceInCalendarDays, formatISO, parseISO } from 'date-fns';

export interface StreakState {
  current: number;
  longest: number;
  lastActionAt: string | null; // ISO date "YYYY-MM-DD"
  milestones: string[];         // e.g., ["7", "30"]
}

export const initialStreak: StreakState = {
  current: 0,
  longest: 0,
  lastActionAt: null,
  milestones: [],
};

/**
 * Determine what the streak should look like after a user action today.
 * Called from `useApp.recordAction()`.
 */
export function nextStreak(prev: StreakState, now = new Date()): StreakState {
  const today = formatISO(now, { representation: 'date' });

  // Same-day action — idempotent, no change.
  if (prev.lastActionAt === today) return prev;

  // First-ever action.
  if (!prev.lastActionAt) {
    return { ...prev, current: 1, longest: Math.max(1, prev.longest), lastActionAt: today };
  }

  const last = parseISO(prev.lastActionAt);
  const gap = differenceInCalendarDays(now, last);

  if (gap === 1) {
    // Consecutive day — increment.
    const c = prev.current + 1;
    return { ...prev, current: c, longest: Math.max(c, prev.longest), lastActionAt: today };
  }

  // Missed one or more days — reset to a fresh 1-day streak.
  return { ...prev, current: 1, lastActionAt: today };
}

/**
 * A streak "just crossed" a milestone if `current` equals one of these
 * AND that value isn't already in `milestones` (=already celebrated).
 * The reader / home screen call this to know when to show a modal.
 */
export const MILESTONE_DAYS = [7, 30, 100, 365] as const;
export type MilestoneDay = (typeof MILESTONE_DAYS)[number];

/**
 * Returns the highest-value milestone the user has EARNED (streak.current
 * has reached it) but hasn't yet been celebrated for. This means a user
 * whose streak silently ran past 7 → 8 → 9 without ever opening the Home
 * tab still sees the "7 days" celebration next time they visit Home.
 *
 * Priority: highest un-celebrated wins, so a user who jumps from 6 → 7
 * and later crosses 30 without seeing the 7-day modal will see 30
 * (higher stakes, more meaningful). The 7-day modal is then permanently
 * cleared as a side-effect of marking the higher milestone shown? — no,
 * `markMilestoneShown` only marks the one you dismiss. To avoid stale
 * lower milestones piling up we mark ALL smaller un-celebrated ones as
 * shown when the user dismisses the highest one (see `markMilestoneShown`
 * in the store — this helper only reports the top one worth showing).
 */
export function pendingMilestone(streak: StreakState): MilestoneDay | null {
  // Walk from highest → lowest and return the first one the user has
  // both earned AND not yet been celebrated for.
  for (let i = MILESTONE_DAYS.length - 1; i >= 0; i--) {
    const d = MILESTONE_DAYS[i];
    if (streak.current >= d && !streak.milestones.includes(String(d))) {
      return d;
    }
  }
  return null;
}

/**
 * Trilingual celebration copy for a milestone.  Returned in { title, body }
 * so the UI can plug it into any modal / notification.
 */
export function milestoneCopy(
  day: MilestoneDay,
  lang: 'en' | 'ar' | 'ur'
): { title: string; body: string; emoji: string } {
  const map: Record<
    MilestoneDay,
    Record<'en' | 'ar' | 'ur', { title: string; body: string; emoji: string }>
  > = {
    7: {
      en: { title: '7 days strong', body: 'MashaAllah — a full week with the Book of Allah. May He accept it and multiply it.', emoji: '🌱' },
      ar: { title: '٧ أيام متواصلة', body: 'ما شاء الله — أسبوع كامل مع كتاب الله. تقبل الله منك وضاعف لك.', emoji: '🌱' },
      ur: { title: '۷ دن مسلسل', body: 'ماشاءاللہ — پورا ہفتہ کتابِ الٰہی کے ساتھ۔ اللہ قبول فرمائے اور بڑھائے۔', emoji: '🌱' },
    },
    30: {
      en: { title: 'A month with the Qur\'ān', body: 'Alhamdulillah — thirty days of steady return. This is how noor is built, quietly, day by day.', emoji: '🌟' },
      ar: { title: 'شهر مع القرآن', body: 'الحمد لله — ثلاثون يومًا من العودة المتصلة. هكذا يُبنى النور، بهدوء، يومًا بعد يوم.', emoji: '🌟' },
      ur: { title: 'ایک ماہ قرآن کے ساتھ', body: 'الحمدللہ — تیس دن مسلسل واپسی۔ نور اسی طرح آہستہ آہستہ، دن بہ دن بنتا ہے۔', emoji: '🌟' },
    },
    100: {
      en: { title: '100 days · light upon light', body: 'One hundred days. The Prophet ﷺ said the most beloved deeds to Allah are those most consistent, though few. This is that.', emoji: '💫' },
      ar: { title: '١٠٠ يوم · نور على نور', body: 'مائة يوم. قال النبي ﷺ: أحب الأعمال إلى الله أدومها وإن قل. هذا هو.', emoji: '💫' },
      ur: { title: '۱۰۰ دن · نور علیٰ نور', body: 'ایک سو دن۔ نبی ﷺ نے فرمایا: اللہ کو سب سے پیارا عمل وہ ہے جو مستقل ہو اگرچہ تھوڑا۔ یہ وہی ہے۔', emoji: '💫' },
    },
    365: {
      en: { title: 'A year of return', body: 'A full year with the Qur\'ān. May Allah write it in your favour on the Day when only such consistency will matter.', emoji: '🌙' },
      ar: { title: 'سنة من الرجوع', body: 'سنة كاملة مع القرآن. كتب الله لك ذلك في اليوم الذي لا ينفع فيه إلا مثل هذا الثبات.', emoji: '🌙' },
      ur: { title: 'ایک سال کی واپسی', body: 'مکمل سال قرآن کے ساتھ۔ اللہ اُس دن آپ کے حق میں لکھے جس دن صرف ایسی استقامت کام آئے گی۔', emoji: '🌙' },
    },
  };
  return map[day][lang];
}
