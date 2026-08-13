import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing } from '../theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  accent?: string;
  padded?: boolean;
  raised?: boolean;
}
export function Card({ children, style, onPress, accent, padded = true, raised = false }: Props) {
  const inner = (
    <View
      style={[
        styles.card,
        padded && styles.padded,
        raised && shadow.card,
        accent ? { borderColor: accent + '55' } : undefined,
        style as any,
      ]}
    >
      {accent ? <View style={[styles.accent, { backgroundColor: accent }]} /> : null}
      {children}
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed ? { opacity: 0.85, transform: [{ scale: 0.995 }] } : undefined}>
        {inner}
      </Pressable>
    );
  }
  return inner;
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  padded: { padding: spacing.lg },
  accent: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 3,
  },
});
