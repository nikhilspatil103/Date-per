import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useState } from 'react';

export default function LogoTestScreen() {
  const { theme } = useTheme();
  const [selectedLogo, setSelectedLogo] = useState(1);

  const renderLogo = (logoNum: number) => {
    switch(logoNum) {
      case 1:
        return (
          <View style={styles.logo1}>
            <View style={[styles.loop1Left, { borderColor: '#fff' }]} />
            <View style={[styles.loop1Right, { borderColor: '#fff' }]} />
          </View>
        );
      case 2:
        return (
          <View style={styles.logo2}>
            <View style={[styles.infinity2Left, { borderColor: '#fff' }]} />
            <View style={[styles.infinity2Right, { borderColor: '#fff' }]} />
          </View>
        );
      case 3:
        return (
          <View style={styles.logo3}>
            <View style={[styles.heart3Left, { backgroundColor: '#fff' }]} />
            <View style={[styles.heart3Right, { backgroundColor: '#fff' }]} />
            <View style={[styles.heart3Bottom, { backgroundColor: '#fff' }]} />
          </View>
        );
      case 4:
        return (
          <View style={styles.logo4}>
            <View style={[styles.circle4, { borderColor: '#fff' }]} />
            <View style={[styles.arrow4, { backgroundColor: '#fff' }]} />
          </View>
        );
      case 5:
        return (
          <View style={styles.logo5}>
            <View style={[styles.loop5Outer, { borderColor: '#fff' }]} />
            <View style={[styles.loop5Inner, { borderColor: '#fff' }]} />
          </View>
        );
      case 6:
        return <Text style={styles.logo6}>L</Text>;
      case 7:
        return (
          <View style={styles.logo7}>
            <View style={[styles.chain7Top, { backgroundColor: '#fff' }]} />
            <View style={[styles.chain7Bottom, { backgroundColor: '#fff' }]} />
          </View>
        );
      case 8:
        return (
          <View style={styles.logo8}>
            <View style={[styles.spiral8, { borderColor: '#fff' }]} />
          </View>
        );
      default:
        return null;
    }
  };

  const logoNames = [
    'Interlocking Circles',
    'Infinity Symbol',
    'Connected Hearts',
    'Circular Arrow',
    'Double Loop',
    'Letter L',
    'Chain Link',
    'Spiral Loop'
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Loop Logo Samples</Text>
      
      <View style={[styles.preview, { backgroundColor: theme.primary }]}>
        {renderLogo(selectedLogo)}
      </View>

      <Text style={[styles.selectedName, { color: theme.text }]}>
        {selectedLogo}. {logoNames[selectedLogo - 1]}
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selector}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
          <TouchableOpacity
            key={num}
            style={[
              styles.option,
              { backgroundColor: theme.card, borderColor: selectedLogo === num ? theme.primary : theme.border }
            ]}
            onPress={() => setSelectedLogo(num)}
          >
            <View style={[styles.miniPreview, { backgroundColor: theme.primary }]}>
              {renderLogo(num)}
            </View>
            <Text style={[styles.optionText, { color: theme.text }]}>{num}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 30,
    marginTop: 40,
  },
  preview: {
    width: 150,
    height: 150,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  selectedName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 30,
  },
  selector: {
    maxHeight: 120,
  },
  option: {
    width: 80,
    padding: 10,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
  },
  miniPreview: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionText: {
    fontSize: 12,
    fontWeight: '600',
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

  // Logo 7: Chain Link
  logo7: {
    width: 50,
    height: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chain7Top: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: -6,
  },
  chain7Bottom: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: -6,
  },

  // Logo 8: Spiral Loop
  logo8: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spiral8: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 4,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
});
