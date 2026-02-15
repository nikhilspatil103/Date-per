import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, StatusBar, BackHandler } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

const FIRST_TIME_OFFER = { id: 0, coins: 100, price: 99, popular: false, bonus: 0, isFirstTime: true };

const REGULAR_PACKAGES = [
  { id: 2, coins: 120, price: 199, popular: false, bonus: 20, isFirstTime: false },
  { id: 3, coins: 250, price: 399, popular: true, bonus: 50, isFirstTime: false },
  { id: 4, coins: 500, price: 699, popular: false, bonus: 100, isFirstTime: false },
  { id: 5, coins: 1000, price: 1299, popular: false, bonus: 200, isFirstTime: false },
];

export default function BuyCoinsScreen({ onClose, currentCoins }: { onClose: () => void; currentCoins: number }) {
  const { theme } = useTheme();
  const [isFirstTimeBuyer, setIsFirstTimeBuyer] = useState(true);

  useEffect(() => {
    checkFirstTimeBuyer();
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    
    return () => backHandler.remove();
  }, [onClose]);

  const checkFirstTimeBuyer = async () => {
    const hasRecharge = await AsyncStorage.getItem('hasFirstRecharge');
    setIsFirstTimeBuyer(!hasRecharge);
  };

  const handlePurchase = async (pkg: any) => {
    // Mark as not first time buyer after purchase
    if (pkg.isFirstTime) {
      await AsyncStorage.setItem('hasFirstRecharge', 'true');
    }
    alert(`Payment integration coming soon!\n\nYou selected:\n${pkg.coins} coins for ₹${pkg.price}`);
  };

  const packages = isFirstTimeBuyer ? [FIRST_TIME_OFFER, ...REGULAR_PACKAGES] : REGULAR_PACKAGES;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onClose}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.headerText }]}>Buy Coins</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceIcon}>💰</Text>
          <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>Current Balance</Text>
          <Text style={[styles.balanceValue, { color: theme.text }]}>{currentCoins} Coins</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Choose Your Package</Text>

        {packages.map((pkg) => (
          <TouchableOpacity
            key={pkg.id}
            style={[
              styles.packageCard,
              { backgroundColor: theme.card, borderColor: pkg.isFirstTime ? '#FF6B9D' : pkg.popular ? '#FFD700' : theme.border },
              (pkg.popular || pkg.isFirstTime) && styles.popularCard
            ]}
            onPress={() => handlePurchase(pkg)}
          >
            {pkg.isFirstTime && (
              <View style={[styles.popularBadge, { backgroundColor: '#FF6B9D' }]}>
                <Text style={styles.popularText}>🎉 FIRST RECHARGE OFFER</Text>
              </View>
            )}
            {pkg.popular && !pkg.isFirstTime && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>MOST POPULAR</Text>
              </View>
            )}
            <View style={styles.packageHeader}>
              <View style={styles.coinsInfo}>
                <Text style={styles.coinIcon}>🪙</Text>
                <View>
                  <Text style={[styles.coinAmount, { color: theme.text }]}>{pkg.coins} Coins</Text>
                  {pkg.bonus > 0 && (
                    <Text style={styles.bonusText}>+{pkg.bonus} Bonus</Text>
                  )}
                </View>
              </View>
              <View style={styles.priceInfo}>
                <Text style={[styles.priceAmount, { color: theme.text }]}>₹{pkg.price}</Text>
                <Text style={[styles.pricePerCoin, { color: theme.textSecondary }]}>
                  ₹{(pkg.price / pkg.coins).toFixed(1)}/coin
                </Text>
              </View>
            </View>
            {pkg.bonus > 0 && (
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsText}>💎 Save {Math.round((pkg.bonus / pkg.coins) * 100)}%</Text>
              </View>
            )}
            <View style={[styles.buyBtn, { backgroundColor: pkg.isFirstTime ? '#FF6B9D' : pkg.popular ? '#FFD700' : '#667eea' }]}>
              <Text style={[styles.buyBtnText, { color: (pkg.popular || pkg.isFirstTime) ? '#000' : '#fff' }]}>Buy Now</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={[styles.infoBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: theme.text }]}>How Coins Work</Text>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              • 10 coins = 24 hours chat access with one person{'\n'}
              • Coins never expire{'\n'}
              • Secure payment via Razorpay{'\n'}
              • Instant delivery
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 24, color: '#fff', fontWeight: '700' },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  closeIcon: { fontSize: 20, color: '#fff', fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '800' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  balanceCard: { alignItems: 'center', padding: 24, marginBottom: 24 },
  balanceIcon: { fontSize: 64, marginBottom: 12 },
  balanceLabel: { fontSize: 14, marginBottom: 4 },
  balanceValue: { fontSize: 32, fontWeight: '800' },
  sectionTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16 },
  packageCard: { borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 2, position: 'relative' },
  popularCard: { borderWidth: 3 },
  popularBadge: { position: 'absolute', top: -12, right: 20, backgroundColor: '#FFD700', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  popularText: { fontSize: 11, fontWeight: '800', color: '#000' },
  packageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  coinsInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  coinIcon: { fontSize: 40 },
  coinAmount: { fontSize: 24, fontWeight: '800' },
  bonusText: { fontSize: 12, color: '#4ECDC4', fontWeight: '700' },
  priceInfo: { alignItems: 'flex-end' },
  priceAmount: { fontSize: 28, fontWeight: '800' },
  pricePerCoin: { fontSize: 12 },
  savingsBadge: { backgroundColor: 'rgba(78, 205, 196, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 12 },
  savingsText: { fontSize: 13, fontWeight: '700', color: '#4ECDC4' },
  buyBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  buyBtnText: { fontSize: 16, fontWeight: '700' },
  infoBox: { flexDirection: 'row', padding: 16, borderRadius: 16, borderWidth: 1, marginTop: 8 },
  infoIcon: { fontSize: 24, marginRight: 12 },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  infoText: { fontSize: 13, lineHeight: 20 },
});
