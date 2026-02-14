import { View, StyleSheet } from 'react-native';

export default function LoopLogo({ size = 32, color = '#FF6B9D' }: { size?: number; color?: string }) {
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[styles.outerRing, { 
        width: size, 
        height: size, 
        borderRadius: size / 2,
        borderWidth: size * 0.1,
        borderColor: color,
        opacity: 0.4,
      }]} />
      <View style={[styles.middleRing, { 
        width: size * 0.7, 
        height: size * 0.7, 
        borderRadius: size * 0.35,
        borderWidth: size * 0.1,
        borderColor: color,
      }]} />
      <View style={[styles.innerDot, { 
        width: size * 0.25, 
        height: size * 0.25, 
        borderRadius: size * 0.125,
        backgroundColor: color,
      }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  outerRing: {
    position: 'absolute',
  },
  middleRing: {
    position: 'absolute',
  },
  innerDot: {
    position: 'absolute',
  },
});
