import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function LogoSamples() {
  const { theme } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Loop Logo Variations</Text>

      {/* Logo 1: Interlocking Circles */}
      <View style={styles.logoCard}>
        <Text style={[styles.logoTitle, { color: theme.text }]}>1. Interlocking Circles</Text>
        <View style={[styles.logoBox, { backgroundColor: theme.primary }]}>
          <View style={styles.logo1}>
            <View style={[styles.loop1Left, { borderColor: '#fff' }]} />
            <View style={[styles.loop1Right, { borderColor: '#fff' }]} />
          </View>
        </View>
      </View>

      {/* Logo 2: Infinity Symbol */}
      <View style={styles.logoCard}>
        <Text style={[styles.logoTitle, { color: theme.text }]}>2. Infinity Symbol</Text>
        <View style={[styles.logoBox, { backgroundColor: theme.primary }]}>
          <View style={styles.logo2}>
            <View style={[styles.infinity2Left, { borderColor: '#fff' }]} />
            <View style={[styles.infinity2Right, { borderColor: '#fff' }]} />
          </View>
        </View>
      </View>

      {/* Logo 3: Connected Hearts */}
      <View style={styles.logoCard}>
        <Text style={[styles.logoTitle, { color: theme.text }]}>3. Connected Hearts</Text>
        <View style={[styles.logoBox, { backgroundColor: theme.primary }]}>
          <View style={styles.logo3}>
            <View style={[styles.heart3Left, { backgroundColor: '#fff' }]} />
            <View style={[styles.heart3Right, { backgroundColor: '#fff' }]} />
            <View style={[styles.heart3Bottom, { backgroundColor: '#fff' }]} />
          </View>
        </View>
      </View>

      {/* Logo 4: Circular Arrow Loop */}
      <View style={styles.logoCard}>
        <Text style={[styles.logoTitle, { color: theme.text }]}>4. Circular Arrow Loop</Text>
        <View style={[styles.logoBox, { backgroundColor: theme.primary }]}>
          <View style={styles.logo4}>
            <View style={[styles.circle4, { borderColor: '#fff' }]} />
            <View style={[styles.arrow4, { backgroundColor: '#fff' }]} />
          </View>
        </View>
      </View>

      {/* Logo 5: Double Loop */}
      <View style={styles.logoCard}>
        <Text style={[styles.logoTitle, { color: theme.text }]}>5. Double Loop</Text>
        <View style={[styles.logoBox, { backgroundColor: theme.primary }]}>
          <View style={styles.logo5}>
            <View style={[styles.loop5Outer, { borderColor: '#fff' }]} />
            <View style={[styles.loop5Inner, { borderColor: '#fff' }]} />
          </View>
        </View>
      </View>

      {/* Logo 6: Letter L Loop */}
      <View style={styles.logoCard}>
        <Text style={[styles.logoTitle, { color: theme.text }]}>6. Letter 'L' Loop</Text>
        <View style={[styles.logoBox, { backgroundColor: theme.primary }]}>
          <Text style={styles.logo6}>L</Text>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
  },
  logoCard: {
    marginBottom: 24,
  },
  logoTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  logoBox: {
    width: 100,
    height: 100,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Logo 1: Interlocking Circles
  logo1: {
    width: 50,
    height: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loop1Left: {
    width: 20,
    height: 28,
    borderRadius: 14,
    borderWidth: 4,
    borderRightWidth: 0,
    marginRight: -2,
  },
  loop1Right: {
    width: 20,
    height: 28,
    borderRadius: 14,
    borderWidth: 4,
    borderLeftWidth: 0,
    marginLeft: -2,
  },

  // Logo 2: Infinity Symbol
  logo2: {
    width: 60,
    height: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infinity2Left: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 4,
    transform: [{ rotate: '45deg' }],
    marginRight: -8,
  },
  infinity2Right: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 4,
    transform: [{ rotate: '-45deg' }],
    marginLeft: -8,
  },

  // Logo 3: Connected Hearts
  logo3: {
    width: 40,
    height: 40,
    position: 'relative',
  },
  heart3Left: {
    position: 'absolute',
    top: 0,
    left: 8,
    width: 16,
    height: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    transform: [{ rotate: '-45deg' }],
  },
  heart3Right: {
    position: 'absolute',
    top: 0,
    right: 8,
    width: 16,
    height: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    transform: [{ rotate: '45deg' }],
  },
  heart3Bottom: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    width: 16,
    height: 16,
    transform: [{ rotate: '45deg' }],
  },

  // Logo 4: Circular Arrow Loop
  logo4: {
    width: 50,
    height: 50,
    position: 'relative',
  },
  circle4: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 4,
    borderTopColor: 'transparent',
  },
  arrow4: {
    position: 'absolute',
    top: -2,
    right: 8,
    width: 12,
    height: 12,
    transform: [{ rotate: '45deg' }],
  },

  // Logo 5: Double Loop
  logo5: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loop5Outer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 4,
    position: 'absolute',
  },
  loop5Inner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
  },

  // Logo 6: Letter L
  logo6: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
  },
});
