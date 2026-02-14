import API_URL from '../config/api';
import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Platform, StatusBar, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

const SEGMENTS = [
  { coins: 10, color: '#FF6B9D', probability: 0.233 },
  { coins: 20, color: '#667eea', probability: 0.167 },
  { coins: 10, color: '#4ECDC4', probability: 0.233 },
  { coins: 50, color: '#FFD700', probability: 0.05 },
  { coins: 10, color: '#f093fb', probability: 0.233 },
  { coins: 20, color: '#FF6B9D', probability: 0.167 },
];

export default function SpinWheelScreen({ onClose, onCoinsUpdate }: { onClose: () => void; onCoinsUpdate: () => void }) {
  const { theme } = useTheme();
  const [canSpin, setCanSpin] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [wonCoins, setWonCoins] = useState(0);
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkSpinAvailability();
  }, []);

  const checkSpinAvailability = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/spin/check`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setCanSpin(data.canSpin);
      if (!data.canSpin && data.nextSpinTime) {
        startCountdown(data.nextSpinTime);
      }
    } catch (error) {
      console.error('Check spin error:', error);
    }
  };

  const startCountdown = (nextSpinTime: string) => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const target = new Date(nextSpinTime).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setCanSpin(true);
        setTimeLeft('');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      setTimeout(updateTimer, 1000);
    };
    updateTimer();
  };

  const selectReward = () => {
    const random = Math.random();
    let cumulative = 0;
    for (let i = 0; i < SEGMENTS.length; i++) {
      cumulative += SEGMENTS[i].probability;
      if (random <= cumulative) {
        return i;
      }
    }
    return 0;
  };

  const handleSpin = async () => {
    if (!canSpin || spinning) return;

    setSpinning(true);
    const winningIndex = selectReward();
    const segmentAngle = 360 / SEGMENTS.length;
    // Adjust for pointer at top (270 degrees) and ensure it lands centered on the circle
    const targetAngle = 360 * 5 + (winningIndex * segmentAngle) + 90;

    spinValue.setValue(0);
    Animated.timing(spinValue, {
      toValue: targetAngle,
      duration: 4000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(async () => {
      const coins = SEGMENTS[winningIndex].coins;
      setWonCoins(coins);
      setSpinning(false);
      
      // TODO: Show ad here before claiming reward
      // Example: await showRewardedAd();
      
      try {
        const token = await AsyncStorage.getItem('authToken');
        const response = await fetch(`${API_URL}/api/spin/claim`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ coins })
        });
        const data = await response.json();
        
        // Update local storage with new coin balance
        await AsyncStorage.setItem('userCoins', data.coins.toString());
        
        setShowResult(true);
        setCanSpin(false);
        onCoinsUpdate();
      } catch (error) {
        console.error('Claim spin error:', error);
      }
    });
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>Spin & Win</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>🎡 Daily Spin Wheel</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Spin once every 24 hours to win coins!</Text>

        <View style={styles.wheelContainer}>
          <View style={styles.pointer}>
            <Text style={styles.pointerText}>▼</Text>
          </View>
          
          <Animated.View style={[styles.wheel, { transform: [{ rotate: spin }] }]}>
            {SEGMENTS.map((segment, index) => {
              const angle = (360 / SEGMENTS.length) * index;
              const radian = (angle * Math.PI) / 180;
              const radius = 90;
              const x = Math.cos(radian) * radius;
              const y = Math.sin(radian) * radius;
              
              return (
                <View
                  key={index}
                  style={[
                    styles.circleSegment,
                    {
                      backgroundColor: segment.color,
                      left: 150 + x - 35,
                      top: 150 + y - 35,
                    },
                  ]}
                >
                  <Text style={styles.coinText}>{segment.coins}</Text>
                  <Text style={styles.coinLabel}>coins</Text>
                </View>
              );
            })}
            <View style={styles.centerCircle}>
              <Text style={styles.centerText}>SPIN</Text>
            </View>
          </Animated.View>
        </View>

        {canSpin ? (
          <TouchableOpacity
            style={[styles.spinBtn, { backgroundColor: spinning ? '#999' : '#667eea' }]}
            onPress={handleSpin}
            disabled={spinning}
          >
            <Text style={styles.spinBtnText}>{spinning ? '🎡 Spinning...' : '🎯 Spin Now!'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.timerCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.timerTitle, { color: theme.text }]}>⏰ Next Spin Available In</Text>
            <Text style={[styles.timerValue, { color: '#667eea' }]}>{timeLeft}</Text>
          </View>
        )}

        <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.infoTitle, { color: theme.text }]}>💡 How it works</Text>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>• Spin once every 24 hours</Text>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>• Win 10, 20, or 50 coins</Text>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>• 50 coins is rare - good luck! 🍀</Text>
        </View>
      </View>

      <Modal visible={showResult} transparent animationType="fade">
        <View style={styles.resultModal}>
          <View style={[styles.resultCard, { backgroundColor: theme.card }]}>
            <Text style={styles.resultEmoji}>🎉</Text>
            <Text style={[styles.resultTitle, { color: theme.text }]}>Congratulations!</Text>
            <Text style={[styles.resultCoins, { color: '#FFD700' }]}>+{wonCoins} Coins</Text>
            <Text style={[styles.resultText, { color: theme.textSecondary }]}>Added to your account</Text>
            <TouchableOpacity
              style={styles.resultBtn}
              onPress={() => {
                setShowResult(false);
                checkSpinAvailability();
              }}
            >
              <Text style={styles.resultBtnText}>Awesome!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: STATUS_BAR_HEIGHT + 15,
    paddingBottom: 15,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  closeBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { fontSize: 24, color: '#fff' },
  content: { flex: 1, padding: 20, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', marginTop: 20 },
  subtitle: { fontSize: 14, marginTop: 8, marginBottom: 40 },
  wheelContainer: { position: 'relative', width: 300, height: 300, marginBottom: 40 },
  pointer: { position: 'absolute', top: -10, left: '50%', marginLeft: -15, zIndex: 10 },
  pointerText: { fontSize: 40, color: '#000' },
  wheel: { width: 300, height: 300, borderRadius: 150, borderWidth: 8, borderColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 10, backgroundColor: 'rgba(255,255,255,0.1)' },
  circleSegment: { position: 'absolute', width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5 },
  coinText: { fontSize: 20, fontWeight: '800', color: '#fff' },
  coinLabel: { fontSize: 10, color: '#fff', fontWeight: '600' },
  centerCircle: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', top: '50%', left: '50%', marginLeft: -40, marginTop: -40, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#667eea' },
  centerText: { fontSize: 14, fontWeight: '800', color: '#667eea' },
  spinBtn: { paddingVertical: 18, paddingHorizontal: 60, borderRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  spinBtnText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  timerCard: { padding: 24, borderRadius: 20, alignItems: 'center', width: '100%' },
  timerTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  timerValue: { fontSize: 32, fontWeight: '800' },
  infoCard: { marginTop: 30, padding: 20, borderRadius: 16, width: '100%' },
  infoTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  infoText: { fontSize: 14, marginBottom: 6 },
  resultModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  resultCard: { width: '80%', padding: 40, borderRadius: 24, alignItems: 'center' },
  resultEmoji: { fontSize: 64, marginBottom: 16 },
  resultTitle: { fontSize: 24, fontWeight: '800', marginBottom: 12 },
  resultCoins: { fontSize: 48, fontWeight: '900', marginBottom: 8 },
  resultText: { fontSize: 14, marginBottom: 24 },
  resultBtn: { backgroundColor: '#667eea', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 20 },
  resultBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
