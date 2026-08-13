import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useApp, type Lang } from '../store/useApp';
import { colors, radius, spacing } from '../theme';

const LANGS: { code: Lang; english: string; native: string; abbr: string; rtl: boolean }[] = [
  { code: 'en', english: 'English', native: 'English', abbr: 'EN', rtl: false },
  { code: 'ar', english: 'Arabic',  native: 'العربية',  abbr: 'AR', rtl: true  },
  { code: 'ur', english: 'Urdu',    native: 'اردو',     abbr: 'UR', rtl: true  },
];

export function LanguageSwitcher({ compact }: { compact?: boolean }) {
  const lang = useApp((s) => s.lang);
  const setLang = useApp((s) => s.setLang);

  // Compact pill mode (used in header) — show abbreviation + native script
  if (compact) {
    return (
      <View style={styles.row}>
        {LANGS.map((l) => {
          const active = lang === l.code;
          return (
            <Pressable
              key={l.code}
              onPress={() => setLang(l.code)}
              style={({ pressed }) => [
                styles.pill,
                styles.pillCompact,
                {
                  borderColor: active ? colors.silverHi : colors.cardBorder,
                  backgroundColor: active ? colors.silver + '22' : 'transparent',
                },
                pressed && { opacity: 0.7 },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Switch language to ${l.native}`}
            >
              <Text
                style={[
                  styles.text,
                  { fontSize: 11, color: active ? colors.silverHi : colors.textDim },
                ]}
              >
                {l.abbr}
              </Text>
              <Text
                style={[
                  {
                    fontSize: 12,
                    marginLeft: 5,
                    color: active ? colors.silverHi : colors.textDim,
                    opacity: 0.92,
                  },
                  l.rtl && { writingDirection: 'rtl' },
                ]}
              >
                {l.native}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  // Expanded mode (used in Settings) — stacked English label with native script underneath
  return (
    <View style={styles.stack}>
      {LANGS.map((l) => {
        const active = lang === l.code;
        return (
          <Pressable
            key={l.code}
            onPress={() => setLang(l.code)}
            style={({ pressed }) => [
              styles.tile,
              {
                borderColor: active ? colors.silverHi : colors.cardBorder,
                backgroundColor: active ? colors.silver + '1F' : 'transparent',
              },
              pressed && { opacity: 0.7 },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <View style={styles.tileLeft}>
              <Text
                style={[
                  styles.tileEnglish,
                  { color: active ? colors.silverHi : colors.text },
                ]}
              >
                {l.english}
              </Text>
              {l.code !== 'en' ? (
                <Text
                  style={[
                    styles.tileNative,
                    { color: active ? colors.silverHi : colors.textDim },
                    l.rtl && { writingDirection: 'rtl', textAlign: 'left' },
                  ]}
                >
                  {l.native}
                </Text>
              ) : null}
            </View>
            <View
              style={[
                styles.dot,
                active && { borderColor: colors.silverHi, backgroundColor: colors.silverHi },
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderRadius: radius.pill },
  pillCompact: { paddingHorizontal: 8, paddingVertical: 3 },
  text: { fontWeight: '700', fontSize: 13, letterSpacing: 0.4 },

  stack: { gap: 8 },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    borderRadius: radius.md,
    minHeight: 56,
  },
  tileLeft: { flexShrink: 1 },
  tileEnglish: { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  tileNative: { fontSize: 14, marginTop: 2, opacity: 0.9 },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.cardBorder,
  },
});
