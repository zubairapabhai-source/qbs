/**
 * Simple bookmark store backed by AsyncStorage.
 * Used by Scientists list + A-Z entries + verse detail.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

type Kind = 'scientist' | 'entry' | 'verse';
const KEY = '@qbs:bookmarks';

interface Store { scientist: string[]; entry: string[]; verse: string[]; }
const empty: Store = { scientist: [], entry: [], verse: [] };

let cache: Store = { ...empty };
const subs = new Set<(s: Store) => void>();

async function load(): Promise<Store> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      cache = { ...empty, ...parsed };
    }
  } catch {}
  return cache;
}
load().then((s) => subs.forEach((fn) => fn(s)));

function save(): void {
  AsyncStorage.setItem(KEY, JSON.stringify(cache)).catch(() => {});
  subs.forEach((fn) => fn(cache));
}

export function isBookmarked(kind: Kind, id: string): boolean {
  return cache[kind].includes(id);
}
export function toggleBookmark(kind: Kind, id: string): boolean {
  const list = cache[kind];
  const idx = list.indexOf(id);
  if (idx >= 0) list.splice(idx, 1); else list.push(id);
  save();
  return idx < 0; // now bookmarked?
}
export function listBookmarks(kind: Kind): string[] {
  return [...cache[kind]];
}
export function useBookmarks(): Store {
  const [s, setS] = useState(cache);
  useEffect(() => {
    subs.add(setS);
    return () => { subs.delete(setS); };
  }, []);
  return s;
}
