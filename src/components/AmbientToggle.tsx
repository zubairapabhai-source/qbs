/**
 * Compact mute / unmute toggle for the stream-water ambient layer.
 * Renders as a small circular button — pairs nicely next to the language
 * switcher in the home-page header.
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useAmbientAudio } from '../audio';
import { colors, radius } from '../theme';

interface Props {
  size?: number;
  /** Light mode: dark icon on light pill (use over gold backgrounds). */
  light?: boolean;
}

export function AmbientToggle({ size = 36, light = false }: Props) {
  const { muted, toggle } = useAmbientAudio();

  const iconBg = light ? colors.gold : colors.bgElevated;
  const iconBorder = light ? colors.goldDeep : colors.gold + '66';
  const iconColor = light ? colors.bg : colors.gold;

  return (
    <Pressable
      onPress={toggle}
      hitSlop={8}
      style={({ pressed }) => [
        styles.btn,
        { width: size, height: size, backgroundColor: iconBg, borderColor: iconBorder },
        pressed && { opacity: 0.65 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={muted ? 'Turn on stream sound' : 'Turn off stream sound'}
    >
      <Ionicons
        name={muted ? 'water-outline' : 'water'}
        size={Math.round(size * 0.5)}
        color={iconColor}
      />
      {muted ? (
        // Diagonal slash to communicate "off" without losing the water icon.
        <View style={[styles.slash, { backgroundColor: iconColor }]} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  slash: {
    position: 'absolute',
    width: '90%',
    height: 2,
    borderRadius: 1,
    transform: [{ rotate: '45deg' }],
  },
});
