/**
 * AI Sheikh — Question History Store (QBS)
 *
 * A separate, permanent log of every meaningful Q&A the user has ever
 * had with the AI Sheikh. Independent from the "active chat" in
 * `@qbs:sheikhChat` (which is a rolling 40-msg window meant to survive
 * app restarts but not necessarily forever).
 *
 * WHY THIS EXISTS
 *   Users repeatedly asked "I asked something last week — where is it?"
 *   The active chat trims after 40 messages, so answers get lost.
 *   History is a permanent, searchable, favourite-able archive.
 *
 * SHAPE OF A HISTORY ENTRY
 *   {
 *     id: string          // stable across renames — used for dedupe
 *     ts: number          // Unix ms of when the sheikh replied
 *     lang: 'en'|'ar'|'ur'
 *     q: string           // user's question
 *     a: string           // sheikh's answer
 *     starred: boolean    // user-marked favourite
 *     snippets?: Array<{source:string; key:string; text:string}>
 *   }
 *
 * STORAGE
 *   AsyncStorage key `@qbs:sheikhHistory.v1`.
 *   Capped to `HISTORY_MAX` (200) entries — oldest non-starred evicted first,
 *   so a starred answer is effectively pinned for life.
 *
 * PUBLIC SURFACE
 *   • useSheikhHistory()             — Zustand store
 *   • state.history                  — HistoryEntry[]  (newest first)
 *   • actions.hydrate()              — load from disk on app boot
 *   • actions.record(entry)          — call from sheikh.tsx after a good reply
 *   • actions.toggleStar(id)         — user tapped ★
 *   • actions.remove(id)             — long-press → delete
 *   • actions.clearAll()             — nuclear option
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HistorySnippet {
  source: string;
  key: string;
  text: string;
}

export interface HistoryEntry {
  id: string;
  ts: number;
  lang: 'en' | 'ar' | 'ur';
  q: string;
  a: string;
  starred: boolean;
  snippets?: HistorySnippet[];
}

const KEY = '@qbs:sheikhHistory.v1';
const HISTORY_MAX = 200;

interface State {
  history: HistoryEntry[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  record: (e: Omit<HistoryEntry, 'id' | 'ts' | 'starred'> & { ts?: number }) => void;
  toggleStar: (id: string) => void;
  remove: (id: string) => void;
  clearAll: () => void;
}

function newId(): string {
  return 'q_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * Trim the log to HISTORY_MAX. Starred entries are pinned — we only
 * evict from the unstarred tail. This way a paying user who's built up
 * a personal library of 30 favourite answers keeps them forever, even
 * as they ask another 500 casual questions on top.
 */
function trim(list: HistoryEntry[]): HistoryEntry[] {
  if (list.length <= HISTORY_MAX) return list;
  const starred = list.filter((e) => e.starred);
  const unstarred = list.filter((e) => !e.starred);
  const keepUnstarred = unstarred.slice(0, Math.max(0, HISTORY_MAX - starred.length));
  // Preserve original ordering (newest first) — starred items stay
  // where they were, unstarred cut from the OLDEST end.
  const kept = new Set([...starred.map((e) => e.id), ...keepUnstarred.map((e) => e.id)]);
  return list.filter((e) => kept.has(e.id));
}

async function persist(list: HistoryEntry[]) {
  try { await AsyncStorage.setItem(KEY, JSON.stringify(list)); } catch {}
}

export const useSheikhHistory = create<State>((set, get) => ({
  history: [],
  hydrated: false,
  async hydrate() {
    // Race-safe hydration.
    //
    // If a user asks a Sheikh question in the ~50ms between app boot and
    // this hydrate() completing, `record()` will have already appended to
    // the empty in-memory list. Naively `set({history: parsed})` here
    // would clobber that fresh entry. So instead we MERGE: keep any
    // in-memory IDs not present on disk, dedupe on `id`, prefer disk
    // metadata (starred flag survives) over in-memory.
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const inMem = get().history;
          if (inMem.length === 0) {
            // Common case — nothing to merge, just adopt disk.
            set({ history: parsed as HistoryEntry[], hydrated: true });
            return;
          }
          // Rare case — merge on id, newest-first order preserved.
          const diskIds = new Set(parsed.map((e: HistoryEntry) => e.id));
          const inMemNotOnDisk = inMem.filter((e) => !diskIds.has(e.id));
          const merged = [...inMemNotOnDisk, ...parsed] as HistoryEntry[];
          // Sort newest first by ts so the merge is deterministic.
          merged.sort((a, b) => b.ts - a.ts);
          const trimmed = trim(merged);
          set({ history: trimmed, hydrated: true });
          // Persist the TRIMMED list (not the untrimmed merged one) so
          // disk stays within HISTORY_MAX and can't grow unbounded.
          persist(trimmed).catch(() => {});
          return;
        }
      }
    } catch {}
    set({ hydrated: true });
  },
  record(e) {
    // Dedupe: if the last entry has the same Q+A (same round-trip retry),
    // update in place instead of stacking a duplicate. This handles the
    // edge case where the user tapped "send" twice on a slow network.
    const cur = get().history;
    const last = cur[0];
    if (last && last.q.trim() === e.q.trim() && last.a === e.a) {
      return;
    }
    const entry: HistoryEntry = {
      id: newId(),
      ts: e.ts ?? Date.now(),
      lang: e.lang,
      q: e.q,
      a: e.a,
      starred: false,
      snippets: e.snippets && e.snippets.length ? e.snippets.slice(0, 5) : undefined,
    };
    const next = trim([entry, ...cur]);
    set({ history: next });
    persist(next);
  },
  toggleStar(id) {
    const next = get().history.map((e) => (e.id === id ? { ...e, starred: !e.starred } : e));
    set({ history: next });
    persist(next);
  },
  remove(id) {
    const next = get().history.filter((e) => e.id !== id);
    set({ history: next });
    persist(next);
  },
  clearAll() {
    set({ history: [] });
    persist([]);
  },
}));
