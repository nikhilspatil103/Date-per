import API_URL from '../config/api';
import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, Platform, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WebSocketService from '../services/websocket';
import ChatScreen from './ChatScreen';
import AvatarV3 from './AvatarV3';
import HeartLoader from './HeartLoader';
import { useTheme } from '../contexts/ThemeContext';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function ContactsScreen({ isActive }: { isActive?: boolean }) {
  const { theme } = useTheme();
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isActive) {
      loadContacts();
    }
    
    if (!isActive) return;
    
    const handleStatusChange = (message: any) => {
      if (message.type === 'userOnline') {
        setContacts((prev: any[]) => prev.map((c: any) => 
          (c._id === message.userId || c.id === message.userId) ? { ...c, online: true } : c
        ));
      } else if (message.type === 'userOffline') {
        setContacts((prev: any[]) => prev.map((c: any) => 
          (c._id === message.userId || c.id === message.userId) ? { ...c, online: false, lastSeen: new Date() } : c
        ));
      }
    };
    
    WebSocketService.onMessage(handleStatusChange);
    
    return () => {
      WebSocketService.removeMessageListener(handleStatusChange);
    };
  }, [isActive]);

  const loadContacts = async () => {
    const token = await AsyncStorage.getItem('authToken');
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/contacts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setContacts(data);
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContacts();
    setRefreshing(false);
  };

  const renderContact = ({ item }: any) => {
    const getStatusText = () => {
      if (item.online) return 'Online';
      if (item.lastSeen) {
        const lastSeenDate = new Date(item.lastSeen);
        const now = new Date();
        const diffMs = now.getTime() - lastSeenDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 10) return 'Offline';
        
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 60) return `Last seen ${diffMins}m ago`;
        if (diffHours < 24) return `Last seen ${diffHours}h ago`;
        if (diffDays < 7) return `Last seen ${diffDays}d ago`;
        return `Last seen ${lastSeenDate.toLocaleDateString()}`;
      }
      return 'Offline';
    };
    
    return (
      <TouchableOpacity style={[styles.contactCard, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setSelectedUser(item)}>
        <View style={styles.avatarContainer}>
          <AvatarV3 photo={item.photo} name={item.name} size={64} />
          {item.online && <View style={[styles.onlineDot, { backgroundColor: theme.online }]} />}
        </View>
        <View style={styles.contactInfo}>
          <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
          <View style={styles.row}>
            <View style={[styles.ageBadge, { backgroundColor: item.gender === 'Male' ? theme.male : theme.female, borderColor: item.gender === 'Male' ? theme.maleBorder : theme.femaleBorder }]}>
              <Text style={[styles.ageText, { color: item.gender === 'Male' ? theme.maleText : theme.femaleText }]}>{item.gender === 'Male' ? '♂' : '♀'} {item.age}</Text>
            </View>
            <Text style={[styles.distance, { color: theme.textSecondary }]}>📍 {item.distance}</Text>
          </View>
          <Text style={[styles.status, { color: theme.textSecondary }]} numberOfLines={1}>{getStatusText()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <Text style={[styles.title, { color: theme.headerText }]}>Contacts</Text>
        <TouchableOpacity style={styles.headerBtn}>
          <Text style={styles.headerIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.statsBar, { backgroundColor: theme.statBg, borderColor: theme.statBorder }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.text }]}>{contacts.length}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.text }]}>{contacts.filter(c => c.online).length}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Online</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.text }]}>{contacts.filter(c => c.distance?.includes('km')).length}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Nearby</Text>
        </View>
      </View>

      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={item => item.id || item._id || item.email}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          loading ? (
            <HeartLoader message="Loading contacts..." subtext="" />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No Contacts Yet</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Add contacts from the Discover tab to keep in touch even when they're offline</Text>
            </View>
          )
        }
      />

      <Modal visible={!!selectedUser} animationType="slide">
        {selectedUser && (
          <ChatScreen 
            chat={selectedUser} 
            onClose={() => setSelectedUser(null)} 
          />
        )}
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
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  title: { fontSize: 28, fontWeight: '800' },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerIcon: { fontSize: 20 },
  statsBar: { 
    flexDirection: 'row', 
    marginHorizontal: 20, 
    marginTop: 20, 
    marginBottom: 16,
    borderRadius: 16, 
    padding: 16,
    borderWidth: 1,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 12 },
  statDivider: { width: 1, marginHorizontal: 8 },
  listContent: { paddingHorizontal: 20, paddingBottom: 20, flexGrow: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  contactCard: { 
    flexDirection: 'row', 
    borderRadius: 20, 
    padding: 16, 
    marginBottom: 12,
    borderWidth: 1,
  },
  avatarContainer: { position: 'relative', marginRight: 16 },
  onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#fff' },
  contactInfo: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  ageBadge: { 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 10,
    borderWidth: 1,
  },
  ageText: { fontSize: 11, fontWeight: '700' },
  distance: { fontSize: 11 },
  status: { fontSize: 13 }
});
