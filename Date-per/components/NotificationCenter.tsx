import API_URL from '../config/api';
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, StatusBar, RefreshControl, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Avatar from './Avatar';
import UserProfileDetailScreen from './UserProfileDetailScreen';
import { useTheme } from '../contexts/ThemeContext';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function NotificationCenter({ onClose, pendingProfileId, onProfileOpened }: { onClose: () => void; pendingProfileId?: string | null; onProfileOpened?: () => void }) {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    if (pendingProfileId && notifications.length > 0) {
      const notification = notifications.find(n => n.sender?._id === pendingProfileId);
      if (notification) {
        openProfile(notification.sender._id);
        onProfileOpened?.();
      }
    }
  }, [pendingProfileId, notifications]);

  const loadNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Load notifications error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      await fetch(`${API_URL/api/notifications/read/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      await fetch(`${API_URL/api/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Mark all as read error:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      await fetch(`${API_URL/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (error) {
      console.error('Delete notification error:', error);
    }
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const openProfile = async (userId: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL/api/user/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const profile = await response.json();
      setSelectedProfile(profile);
    } catch (error) {
      console.error('Load profile error:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: theme.headerText }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>Notifications</Text>
        <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
          <Text style={[styles.markAllText, { color: theme.headerText }]}>Mark all</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Notifications</Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>You're all caught up!</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification._id}
                style={[
                  styles.notificationItem,
                  { backgroundColor: notification.read ? theme.card : theme.primary + '10', borderColor: theme.border }
                ]}
                onPress={() => {
                  if (!notification.read) markAsRead(notification._id);
                  if (notification.sender?._id) openProfile(notification.sender._id);
                }}
              >
                <Avatar photo={notification.sender?.profilePhoto} name={notification.sender?.name} size={50} />
                <View style={styles.notificationContent}>
                  <Text style={[styles.notificationMessage, { color: theme.text }]}>
                    {notification.message}
                  </Text>
                  <Text style={[styles.notificationTime, { color: theme.textSecondary }]}>
                    {getTimeAgo(notification.createdAt)}
                  </Text>
                </View>
                {!notification.read && (
                  <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
                )}
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deleteNotification(notification._id)}
                >
                  <Text style={styles.deleteIcon}>✕</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={!!selectedProfile} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setSelectedProfile(null)}>
        {selectedProfile && (
          <UserProfileDetailScreen profile={selectedProfile} onClose={() => setSelectedProfile(null)} />
        )}
      </Modal>
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
  markAllBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  markAllText: { fontSize: 14, fontWeight: '600' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 100 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyText: { fontSize: 14 },
  list: { padding: 16 },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    position: 'relative',
  },
  notificationContent: { flex: 1, marginLeft: 12 },
  notificationMessage: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  notificationTime: { fontSize: 12 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  deleteBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,0,0,0.1)', justifyContent: 'center', alignItems: 'center' },
  deleteIcon: { color: '#ff4444', fontSize: 14, fontWeight: '700' },
});
