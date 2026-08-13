import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, type } from '../theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  fullWidth?: boolean;
  style?: ViewStyle;
  disabled?: boolean;
  icon?: React.ReactNode;
}
export function SilverButton({ label, onPress, variant = 'primary', fullWidth, style, disabled, icon }: Props) {
  const content = (
    <View style={[styles.row, fullWidth && { width: '100%', justifyContent: 'center' }]}>
      {icon ? <View style={{ marginRight: 8 }}>{icon}</View> : null}
      <Text
        style={[
          styles.label,
          variant === 'primary' && { color: colors.bg },
          variant !== 'primary' && { color: colors.silverHi },
        ]}
      >{label}</Text>
    </View>
  );
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        fullWidth && { alignSelf: 'stretch' },
        disabled && { opacity: 0.5 },
        pressed && { transform: [{ scale: 0.985 }], opacity: 0.92 },
        style,
      ]}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={[colors.silverHi, colors.silver, colors.silverDim]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fill}
        >
          {content}
        </LinearGradient>
      ) : (
        <View style={[
          styles.fill,
          variant === 'outline'
            ? { borderColor: colors.silver, borderWidth: 1.5, backgroundColor: 'transparent' }
            : { backgroundColor: colors.cardHi },
        ]}>
          {content}
        </View>
      )}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  base: { borderRadius: radius.pill, overflow: 'hidden' },
  fill: { paddingVertical: 14, paddingHorizontal: spacing.xl, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  label: { ...type.h3, fontWeight: '800', letterSpacing: 0.4 },
});
