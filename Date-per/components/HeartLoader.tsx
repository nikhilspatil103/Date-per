import { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function HeartLoader({ message = 'Loading...', subtext = '' }: { message?: string; subtext?: string }) {
  const { theme } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.circle, { transform: [{ scale: pulseAnim }], backgroundColor: theme.primary + '20' }]}>
        <Animated.View style={[styles.inner, { 
          backgroundColor: theme.primary,
          transform: [{
            rotate: rotateAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg']
            })
          }]
        }]}>
          <View style={styles.logoShape}>
            <View style={styles.heartLeft} />
            <View style={styles.heartRight} />
            <View style={styles.heartBottom} />
          </View>
        </Animated.View>
      </Animated.View>
      <Text style={[styles.text, { color: theme.text }]}>{message}</Text>
      {subtext ? <Text style={[styles.subtext, { color: theme.textSecondary }]}>{subtext}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  circle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  inner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoShape: {
    width: 40,
    height: 40,
    position: 'relative',
  },
  heartLeft: {
    position: 'absolute',
    top: 0,
    left: 8,
    width: 16,
    height: 24,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    transform: [{ rotate: '-45deg' }],
  },
  heartRight: {
    position: 'absolute',
    top: 0,
    right: 8,
    width: 16,
    height: 24,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    transform: [{ rotate: '45deg' }],
  },
  heartBottom: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    width: 16,
    height: 16,
    backgroundColor: '#fff',
    transform: [{ rotate: '45deg' }],
  },
  text: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '700',
  },
  subtext: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '500',
  },
});
