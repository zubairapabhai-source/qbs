import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../store/useApp';
import { colors, spacing, type } from '../theme';

interface Props {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void };
}
export function ScreenHeader({ title, subtitle, showBack, rightAction }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const lang = useApp((s) => s.lang);
  const rtl = lang === 'ar' || lang === 'ur';

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
      <View style={[styles.row, rtl && { flexDirection: 'row-reverse' }]}>
        {showBack ? (
          <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={10}>
            <Ionicons name={rtl ? 'chevron-forward' : 'chevron-back'} size={26} color={colors.silver} />
          </Pressable>
        ) : <View style={styles.iconBtn} />}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text numberOfLines={1} style={styles.title}>{title}</Text>
          {subtitle ? <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {rightAction ? (
          <Pressable onPress={rightAction.onPress} style={styles.iconBtn} hitSlop={10}>
            <Ionicons name={rightAction.icon} size={22} color={colors.silver} />
          </Pressable>
        ) : <View style={styles.iconBtn} />}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.bg, paddingHorizontal: spacing.md, paddingBottom: spacing.sm, borderBottomColor: colors.divider, borderBottomWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { ...type.h2, color: colors.text },
  subtitle: { ...type.small, color: colors.textMuted, marginTop: 2 },
});
