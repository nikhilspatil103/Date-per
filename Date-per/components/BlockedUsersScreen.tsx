import API_URL from '../config/api';
import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AvatarV3 from './AvatarV3';
import { useTheme } from '../contexts/ThemeContext';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function BlockedUsersScreen({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/messages/blocked-users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setBlockedUsers(data);
    } catch (error) {
      console.error('Load blocked users error:', error);
    } finally {
      setLoading(false);
    }
  };

  const unblockUser = async (userId: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      await fetch(`${API_URL}/api/messages/unblock/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      setBlockedUsers(prev => prev.filter(user => user._id !== userId));
    } catch (error) {
      console.error('Unblock user error:', error);
      alert('Failed to unblock user');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: theme.headerText }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>Blocked Users</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Loading...</Text>
        </View>
      ) : blockedUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🚫</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No Blocked Users</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>You haven't blocked anyone yet</Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={[styles.userCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <AvatarV3 photo={item.profilePhoto} name={item.name} size={50} />
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.userStatus, { color: theme.textSecondary }]}>Blocked</Text>
              </View>
              <TouchableOpacity style={styles.unblockBtn} onPress={() => unblockUser(item._id)}>
                <Text style={styles.unblockText}>Unblock</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    paddingTop: STATUS_BAR_HEIGHT + 10, 
    paddingBottom: 15, 
    paddingHorizontal: 24, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backIcon: { fontSize: 24, fontWeight: '700' },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  listContent: { padding: 20 },
  userCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1 },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  userStatus: { fontSize: 13 },
  unblockBtn: { backgroundColor: '#667eea', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  unblockText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  emptyText: { fontSize: 15, textAlign: 'center' },
});
