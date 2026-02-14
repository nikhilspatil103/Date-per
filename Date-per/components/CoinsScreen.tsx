import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, StatusBar, BackHandler, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BuyCoinsScreen from './BuyCoinsScreen';
import SpinWheelScreen from './SpinWheelScreen';
import { useTheme } from '../contexts/ThemeContext';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function CoinsScreen({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const [coins, setCoins] = useState(100);
  const [showBuyCoins, setShowBuyCoins] = useState(false);
  const [showSpinWheel, setShowSpinWheel] = useState(false);

  useEffect(() => {
    loadCoins();
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    
    return () => backHandler.remove();
  }, []);

  const loadCoins = async () => {
    const savedCoins = await AsyncStorage.getItem('userCoins');
    if (savedCoins) {
      setCoins(parseInt(savedCoins));
    } else {
      await AsyncStorage.setItem('userCoins', '100');
    }
  };

  const handleBuyCoinsClose = () => {
    setShowBuyCoins(false);
    loadCoins();
  };

  const handleSpinWheelClose = () => {
    setShowSpinWheel(false);
    loadCoins();
  };

  const transactions = [
    { id: 1, type: 'credit', amount: 100, desc: 'Welcome Bonus', date: 'Today' },
    { id: 2, type: 'debit', amount: 10, desc: 'Chat Initiated', date: 'Yesterday' },
    { id: 3, type: 'credit', amount: 50, desc: 'Daily Reward', date: '2 days ago' }
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Coins</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.balanceCard, { backgroundColor: 'rgb(156 249 199)' }]}>
          <Text style={[styles.balanceLabel, { color: 'rgba(0,0,0,0.7)' }]}>Total Balance</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.coinIcon}>💰</Text>
            <Text style={[styles.balanceAmount, { color: '#000' }]}>{coins}</Text>
            <Text style={[styles.balanceText, { color: '#000' }]}>Coins</Text>
          </View>
          <Text style={[styles.infoText, { color: 'rgba(0,0,0,0.6)' }]}>10 coins = 24hr chat access</Text>
          <TouchableOpacity style={[styles.buyBtn, { backgroundColor: 'rgba(0,0,0,0.15)' }]} onPress={() => setShowBuyCoins(true)}>
            <Text style={[styles.buyBtnText, { color: '#000' }]}>+ Buy More Coins</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Earn More Coins</Text>
          <TouchableOpacity style={[styles.earnCard, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setShowSpinWheel(true)}>
            <Text style={styles.earnIcon}>🎡</Text>
            <View style={styles.earnInfo}>
              <Text style={[styles.earnTitle, { color: theme.text }]}>Spin the Wheel</Text>
              <Text style={[styles.earnDesc, { color: theme.textSecondary }]}>Win 10, 20, or 50 coins daily!</Text>
            </View>
            <View style={styles.earnBtn}>
              <Text style={styles.earnBtnText}>Spin</Text>
            </View>
          </TouchableOpacity>
          <View style={[styles.earnCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={styles.earnIcon}>👥</Text>
            <View style={styles.earnInfo}>
              <Text style={[styles.earnTitle, { color: theme.text }]}>Invite Friends</Text>
              <Text style={[styles.earnDesc, { color: theme.textSecondary }]}>Get 50 coins per friend</Text>
            </View>
            <TouchableOpacity style={styles.earnBtn}>
              <Text style={styles.earnBtnText}>Invite</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Transactions</Text>
          {transactions.map((txn) => (
            <View key={txn.id} style={[styles.txnCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.txnIcon, txn.type === 'credit' ? styles.txnCredit : styles.txnDebit]}>
                <Text style={styles.txnIconText}>{txn.type === 'credit' ? '+' : '-'}</Text>
              </View>
              <View style={styles.txnInfo}>
                <Text style={[styles.txnDesc, { color: theme.text }]}>{txn.desc}</Text>
                <Text style={[styles.txnDate, { color: theme.textSecondary }]}>{txn.date}</Text>
              </View>
              <Text style={[styles.txnAmount, txn.type === 'credit' ? styles.txnAmountCredit : styles.txnAmountDebit]}>
                {txn.type === 'credit' ? '+' : '-'}{txn.amount}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showBuyCoins} animationType="slide">
        <BuyCoinsScreen onClose={handleBuyCoinsClose} currentCoins={coins} />
      </Modal>

      <Modal visible={showSpinWheel} animationType="slide">
        <SpinWheelScreen onClose={handleSpinWheelClose} onCoinsUpdate={loadCoins} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    paddingTop: STATUS_BAR_HEIGHT, 
    paddingBottom: 15, 
    paddingHorizontal: 24, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backIcon: { fontSize: 24, color: '#fff', fontWeight: '700' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  balanceCard: { margin: 20, borderRadius: 24, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  balanceLabel: { fontSize: 14, marginBottom: 12 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  coinIcon: { fontSize: 40 },
  balanceAmount: { fontSize: 48, fontWeight: '900' },
  balanceText: { fontSize: 20, fontWeight: '600' },
  infoText: { fontSize: 13, marginBottom: 16 },
  buyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  buyBtnText: { fontSize: 15, fontWeight: '700' },
  quickActions: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  quickCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', gap: 6, borderWidth: 1 },
  quickIcon: { fontSize: 28 },
  quickLabel: { fontSize: 13, fontWeight: '700' },
  quickCost: { fontSize: 11 },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  txnCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1 },
  txnIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txnCredit: { backgroundColor: 'rgba(78,205,196,0.2)' },
  txnDebit: { backgroundColor: 'rgba(255,107,157,0.2)' },
  txnIconText: { fontSize: 20, color: '#fff', fontWeight: '700' },
  txnInfo: { flex: 1 },
  txnDesc: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  txnDate: { fontSize: 12 },
  txnAmount: { fontSize: 16, fontWeight: '800' },
  txnAmountCredit: { color: '#4ECDC4' },
  txnAmountDebit: { color: '#FF6B9D' },
  earnCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1 },
  earnIcon: { fontSize: 32, marginRight: 12 },
  earnInfo: { flex: 1 },
  earnTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  earnDesc: { fontSize: 12 },
  earnBtn: { backgroundColor: '#FF6B9D', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 16 },
  earnBtnText: { fontSize: 13, color: '#fff', fontWeight: '700' }
});
