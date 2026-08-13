import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, type } from '../theme';

export function Empty({ icon = 'sparkles-outline', title, body }: { icon?: keyof typeof Ionicons.glyphMap; title: string; body?: string; }) {
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={42} color={colors.silverDim} />
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  title: { ...type.h3, color: colors.silverHi, textAlign: 'center', marginTop: spacing.sm },
  body: { ...type.small, color: colors.textMuted, textAlign: 'center', maxWidth: 280 },
});
