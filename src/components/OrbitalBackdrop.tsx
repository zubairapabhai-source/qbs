/**
 * OrbitalBackdrop — visible solar-system rings + planets behind the home content.
 * Brighter, more rings, more planets after user feedback.
 */
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';

export function OrbitalBackdrop() {
  return (
    <View pointerEvents="none" style={styles.wrap}>
      {/* Concentric solar-system rings — anchored top-right */}
      <View style={[styles.ring, { width: 480, height: 480, top: -160, right: -180, borderColor: colors.gold + '33' }]} />
      <View style={[styles.ring, { width: 380, height: 380, top: -110, right: -130, borderColor: colors.gold + '44' }]} />
      <View style={[styles.ring, { width: 290, height: 290, top: -65, right: -90, borderColor: colors.gold + '55' }]} />
      <View style={[styles.ring, { width: 210, height: 210, top: -25, right: -50, borderColor: colors.goldHi + '66' }]} />

      {/* Big sun at the centre of the system */}
      <View style={[styles.planet, { width: 36, height: 36, top: 80, right: 60, backgroundColor: colors.gold, opacity: 0.85, shadowColor: colors.goldHi, shadowOpacity: 0.7, shadowRadius: 14 }]} />

      {/* Orbiting planets */}
      <View style={[styles.planet, { width: 14, height: 14, top: 50, right: 230, backgroundColor: colors.emeraldHi }]} />
      <View style={[styles.planet, { width: 18, height: 18, top: 220, right: 30, backgroundColor: colors.amberHi }]} />
      <View style={[styles.planet, { width: 10, height: 10, top: 160, right: 280, backgroundColor: colors.cyanHi }]} />
      <View style={[styles.planet, { width: 22, height: 22, top: -10, right: 100, backgroundColor: colors.violetHi, opacity: 0.7 }]} />

      {/* Lower-left smaller system */}
      <View style={[styles.ring, { width: 200, height: 200, top: 360, left: -90, borderColor: colors.emeraldHi + '44' }]} />
      <View style={[styles.ring, { width: 130, height: 130, top: 395, left: -55, borderColor: colors.emeraldHi + '66' }]} />
      <View style={[styles.planet, { width: 18, height: 18, top: 445, left: 50, backgroundColor: colors.emeraldHi, opacity: 0.85 }]} />
      <View style={[styles.planet, { width: 8, height: 8, top: 380, left: 90, backgroundColor: colors.silverHi }]} />

      {/* Stars sprinkled across the canvas */}
      {[
        { top: 30, left: 50 }, { top: 80, left: 140 }, { top: 200, left: 30 },
        { top: 280, left: 90 }, { top: 350, right: 180 }, { top: 440, left: 200 },
        { top: 540, right: 80 }, { top: 130, right: 200 }, { top: 250, right: 280 },
        { top: 480, right: 240 }, { top: 600, left: 80 }, { top: 650, right: 140 },
      ].map((s, i) => (
        <View key={i} style={[styles.star, s]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, height: 800, overflow: 'hidden' },
  ring: { position: 'absolute', borderRadius: 9999, borderWidth: 1 },
  planet: { position: 'absolute', borderRadius: 9999 },
  star: { position: 'absolute', width: 3, height: 3, borderRadius: 2, backgroundColor: colors.gold + 'CC' },
});
