/**
 * Prayer-times card for the Daily Sign tab.
 *
 * Uses the free public Aladhan API (api.aladhan.com) — no key required.
 * Detects the user's coords via expo-location; falls back to Mecca on denial.
 * Caches today's timings in AsyncStorage to avoid re-hitting the API.
 */
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { colors, radius, spacing, type as ty } from '../theme';
import { useApp } from '../store/useApp';

type Timings = Record<'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha', string>;
interface PrayerData {
  timings: Timings;
  city?: string;
  date: string;
  hijri?: { day: string; monthEn: string; monthAr: string; year: string };
}

const CACHE_KEY = '@qbs:prayer';
const NAMES = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
const LABELS: Record<string, Record<'en' | 'ar' | 'ur', string>> = {
  Fajr: { en: 'Fajr', ar: 'الفجر', ur: 'فجر' },
  Sunrise: { en: 'Sunrise', ar: 'الشروق', ur: 'طلوع' },
  Dhuhr: { en: 'Dhuhr', ar: 'الظهر', ur: 'ظہر' },
  Asr: { en: 'Asr', ar: 'العصر', ur: 'عصر' },
  Maghrib: { en: 'Maghrib', ar: 'المغرب', ur: 'مغرب' },
  Isha: { en: 'Isha', ar: 'العشاء', ur: 'عشاء' },
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function nextPrayer(timings: Timings): keyof Timings {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  for (const n of NAMES) {
    const [h, m] = timings[n].split(':').map(Number);
    if (h * 60 + m > mins) return n;
  }
  return 'Fajr'; // next is tomorrow's Fajr
}

export function PrayerTimesCard() {
  const lang = useApp((s) => s.lang);
  const rtl = lang === 'ar' || lang === 'ur';
  const [data, setData] = useState<PrayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as PrayerData;
          if (parsed.date === todayKey()) { setData(parsed); setLoading(false); return; }
        }
        // Try to get coords; fall back to Mecca
        let lat = 21.4225, lng = 39.8262, city = 'Mecca';
        try {
          const perm = await Location.requestForegroundPermissionsAsync();
          if (perm.granted) {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest });
            lat = loc.coords.latitude; lng = loc.coords.longitude; city = '';
            const [rev] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng }).catch(() => [null]) as any;
            if (rev?.city) city = rev.city;
          }
        } catch {}
        const url = `https://api.aladhan.com/v1/timings/${todayKey()}?latitude=${lat}&longitude=${lng}&method=2`;
        const res = await fetch(url);
        const body = await res.json();
        if (!body?.data?.timings) throw new Error('No timings');
        const timings: Timings = {} as Timings;
        for (const n of NAMES) {
          const raw = body.data.timings[n] || '00:00';
          timings[n] = (raw.split(' ')[0] || '').slice(0, 5);
        }
        const h = body?.data?.date?.hijri;
        const hijri = h ? {
          day: String(h.day || ''),
          monthEn: String(h.month?.en || ''),
          monthAr: String(h.month?.ar || ''),
          year: String(h.year || ''),
        } : undefined;
        const fresh: PrayerData = { timings, city, date: todayKey(), hijri };
        setData(fresh);
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(fresh)).catch(() => {});
      } catch (e: any) {
        setError(e?.message || 'failed');
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return (
      <Card style={{ marginTop: spacing.lg }}>
        <View style={{ paddingVertical: spacing.sm, alignItems: 'center' }}>
          <ActivityIndicator color={colors.silver} />
        </View>
      </Card>
    );
  }
  if (error || !data) return null;

  const upcoming = nextPrayer(data.timings);

  return (
    <Card style={{ marginTop: spacing.lg }} accent={colors.cyan}>
      <View style={[styles.header, rtl && { flexDirection: 'row-reverse' }]}>
        <Ionicons name="time" size={16} color={colors.cyan} />
        <Text style={styles.kicker}>
          {lang === 'en' ? 'PRAYER TIMES' : lang === 'ar' ? 'مواقيت الصلاة' : 'اوقاتِ نماز'}
          {data.city ? ` · ${data.city}` : ''}
        </Text>
      </View>
      {data.hijri ? (
        <View style={[styles.hijriRow, rtl && { flexDirection: 'row-reverse' }]}>
          <Ionicons name="calendar-outline" size={12} color={colors.gold} />
          <Text style={styles.hijriTxt}>
            {data.hijri.day} {lang === 'ar' ? data.hijri.monthAr : data.hijri.monthEn} {data.hijri.year} AH
          </Text>
        </View>
      ) : null}
      <View style={styles.grid}>
        {NAMES.map((n) => {
          const isNext = n === upcoming;
          return (
            <View key={n} style={[styles.cell, isNext && { backgroundColor: colors.cyan + '22', borderColor: colors.cyan }]}>
              <Text style={[styles.cellName, isNext && { color: colors.cyan }]}>{LABELS[n][lang]}</Text>
              <Text style={[styles.cellTime, isNext && { color: colors.silverHi, fontWeight: '800' }]}>{data.timings[n]}</Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  kicker: { ...ty.label, color: colors.cyan, fontSize: 10.5 },
  hijriRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm, marginTop: -2 },
  hijriTxt: { ...ty.tiny, color: colors.gold, fontWeight: '700', letterSpacing: 0.3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cell: { width: '31.5%', backgroundColor: colors.bgElevated, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, paddingVertical: 8, alignItems: 'center' },
  cellName: { ...ty.tiny, color: colors.textMuted, fontWeight: '700', letterSpacing: 0.3 },
  cellTime: { ...ty.body, color: colors.text, fontVariant: ['tabular-nums'], marginTop: 2 },
});
