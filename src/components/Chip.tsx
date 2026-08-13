import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '../theme';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: 'silver' | 'gold' | 'emerald' | 'cyan' | 'rose' | 'amber';
  size?: 'sm' | 'md';
}
export function Chip({ label, selected, onPress, tone = 'silver', size = 'md' }: Props) {
  const toneColor = {
    silver: colors.silver, gold: colors.gold, emerald: colors.emerald,
    cyan: colors.cyan, rose: colors.rose, amber: colors.amber,
  }[tone];
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.chip,
        size === 'sm' ? styles.sm : styles.md,
        {
          borderColor: selected ? toneColor : toneColor + '55',
          backgroundColor: selected ? toneColor + '22' : 'transparent',
        },
        pressed && onPress ? { opacity: 0.7 } : null,
      ]}
    >
      <Text style={[
        styles.label,
        size === 'sm' ? styles.labelSm : null,
        { color: selected ? colors.silverHi : toneColor },
      ]}>{label}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  chip: { borderWidth: 1, borderRadius: radius.pill, alignSelf: 'flex-start' },
  sm: { paddingHorizontal: spacing.sm, paddingVertical: 3 },
  md: { paddingHorizontal: 12, paddingVertical: 6 },
  label: { fontWeight: '600', fontSize: 12.5, textTransform: 'capitalize' },
  labelSm: { fontSize: 10.5, letterSpacing: 0.5 },
});
