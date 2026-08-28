/**
 * Qur'an reader store — last page read + bookmarks (multi-entry, free feature).
 *
 * Persisted to AsyncStorage. Zero cloud cost, zero backend dependency.
 * Bookmarks include an optional note, timestamp, and page number so users can
 * treat the reader like a personal moshaf they can annotate.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface QuranBookmark {
  id: string;                // "surah:verse" or "page:{n}"
  kind: 'ayah' | 'page';
  surah?: number;
  verse?: number;
  page: number;              // Mushaf page number 1-604
  surahNameEn?: string;
  note?: string;
  createdAt: number;         // epoch ms
}

interface QuranReaderState {
  lastPage: number;          // 1-604
  bookmarks: QuranBookmark[];
  hydrated: boolean;
  setLastPage: (n: number) => void;
  addBookmark: (b: Omit<QuranBookmark, 'createdAt' | 'id'> & { id?: string }) => void;
  removeBookmark: (id: string) => void;
  updateBookmarkNote: (id: string, note: string) => void;
  isBookmarked: (id: string) => boolean;
  bookmarksForPage: (page: number) => QuranBookmark[];
}

export const useQuranReader = create<QuranReaderState>()(
  persist(
    (set, get) => ({
      lastPage: 1,
      bookmarks: [],
      hydrated: false,
      setLastPage: (n) => {
        if (n >= 1 && n <= 604) set({ lastPage: n });
      },
      addBookmark: (b) => {
        const id = b.id ?? (b.kind === 'ayah'
          ? `${b.surah}:${b.verse}`
          : `page:${b.page}`);
        if (get().bookmarks.find((x) => x.id === id)) return;
        set({
          bookmarks: [
            ...get().bookmarks,
            { ...b, id, createdAt: Date.now() } as QuranBookmark,
          ],
        });
      },
      removeBookmark: (id) => set({ bookmarks: get().bookmarks.filter((b) => b.id !== id) }),
      updateBookmarkNote: (id, note) => set({
        bookmarks: get().bookmarks.map((b) => (b.id === id ? { ...b, note } : b)),
      }),
      isBookmarked: (id) => !!get().bookmarks.find((b) => b.id === id),
      bookmarksForPage: (page) => get().bookmarks.filter((b) => b.page === page),
    }),
    {
      name: 'qbs-quran-reader-v1',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => { state && (state.hydrated = true); },
    }
  )
);
