import { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Platform, StatusBar, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WebSocketService from '../../services/websocket';
import ChatScreen from '../../components/ChatScreen';
import SystemChatScreen from '../../components/SystemChatScreen';
import AvatarV3 from '../../components/AvatarV3';
import HeartLoader from '../../components/HeartLoader';
import { useTheme } from '../../contexts/ThemeContext';
import API_URL from '../../config/api';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function ChatListScreen({ onChatSelect, onUnreadChange, isActive, pendingChatUserId, onChatOpened }: { onChatSelect: (chat: any) => void; onUnreadChange?: (count: number) => void; isActive?: boolean; pendingChatUserId?: string | null; onChatOpened?: () => void }) {
  const { theme } = useTheme();
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isActive) {
      loadChats();
    }
    
    if (!isActive) return;
    
    const handleNewMessage = (message: any) => {
      console.log('Chat list received new message:', message);
      
      // Optimistic update: Update chat list immediately
      setChats(prevChats => {
        const otherUserId = message.sender === message.receiver ? message.sender : 
                           (prevChats.find(c => c._id === message.sender)?._id === message.sender ? message.sender : message.receiver);
        
        const existingChatIndex = prevChats.findIndex(c => c._id === otherUserId);
        
        if (existingChatIndex > -1) {
          const updatedChats = [...prevChats];
          const chat = { ...updatedChats[existingChatIndex] };
          chat.lastMessage = message.text;
          chat.time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          chat.timestamp = Date.now();
          
          // Increment unread if not from current user
          const currentUserId = AsyncStorage.getItem('userId');
          if (message.sender !== currentUserId) {
            chat.unread = (chat.unread || 0) + 1;
          }
          
          updatedChats.splice(existingChatIndex, 1);
          updatedChats.unshift(chat);
          return updatedChats;
        }
        
        return prevChats;
      });
      
      // Debounced full reload (backup)
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        loadChats();
      }, 2000);
    };
    
    WebSocketService.onMessage(handleNewMessage);
    
    return () => {
      WebSocketService.removeMessageListener(handleNewMessage);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [isActive]);

  useEffect(() => {
    if (pendingChatUserId && chats.length > 0) {
      const chat = chats.find(c => c._id === pendingChatUserId);
      if (chat) {
        setSelectedChat(chat);
        onChatOpened?.();
      }
    }
  }, [pendingChatUserId, chats]);

  const loadChats = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const userId = await AsyncStorage.getItem('userId');
      console.log('Loading chats for userId:', userId);
      
      // System notification chat
      const systemChat = {
        id: 'system',
        _id: 'system',
        name: 'DatePer Team',
        photo: '',
        lastMessage: 'Welcome! Start chatting for 10 coins per person (24hr access). You have 100 free coins!',
        time: 'Now',
        timestamp: Date.now(),
        unread: 0,
        online: false,
        isSystem: true
      };
      
      const response = await fetch(`${API_URL}/api/messages/chats/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('Chat list response with user data:', data);
      
      if (!data || data.length === 0) {
        console.log('No chats found, showing system chat only');
        setChats([systemChat]);
        setUnreadCount(0);
        if (onUnreadChange) onUnreadChange(0);
        return;
      }
      
      // Backend now returns user data, no need for extra API calls
      const formattedChats = data.map((chat: any) => {
        const messageText = chat.lastMessage.text;
        const isImage = messageText?.startsWith('http') && (messageText.includes('cloudinary') || messageText.includes('res.cloudinary'));
        
        return {
          id: chat._id,
          _id: chat._id,
          name: chat.user?.name || 'User',
          photo: chat.user?.profilePhoto,
          lastMessage: isImage ? '📷 Picture' : messageText,
          time: new Date(chat.lastMessage.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date(chat.lastMessage.createdAt).getTime(),
          unread: chat.unreadCount,
          online: chat.user?.online || false
        };
      });
      
      const sortedChats = formattedChats.sort((a: any, b: any) => b.timestamp - a.timestamp);
      
      // Add system chat at the top
      const allChats = [systemChat, ...sortedChats];
      
      console.log('Formatted chats:', allChats.length);
      setChats(allChats);
      const total = allChats.reduce((sum: number, chat: any) => sum + chat.unread, 0);
      setUnreadCount(total);
      if (onUnreadChange) {
        onUnreadChange(total);
      }
    } catch (error) {
      console.error('Load chats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = () => {
    setChats(prev => prev.map(chat => ({ ...chat, unread: 0 })));
    setUnreadCount(0);
    if (onUnreadChange) onUnreadChange(0);
    setShowActionsMenu(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

  const renderChat = ({ item }: any) => (
    <TouchableOpacity 
      style={[styles.chatItem, { backgroundColor: theme.card, borderColor: item.isSystem ? theme.primary : theme.border }]} 
      onPress={() => setSelectedChat(item)}
      activeOpacity={1}
    >
      <View style={styles.avatarContainer}>
        {item.isSystem ? (
          <View style={[styles.systemAvatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.systemAvatarText}>🔔</Text>
          </View>
        ) : (
          <>
            <AvatarV3 photo={item.photo} name={item.name} size={56} />
            {item.online && <View style={[styles.onlineDot, { backgroundColor: theme.online }]} />}
          </>
        )}
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={[styles.chatName, { color: theme.text }]}>{item.name}</Text>
          <Text style={[styles.chatTime, { color: theme.textSecondary }]}>{item.time}</Text>
        </View>
        <View style={styles.chatFooter}>
          <Text style={[styles.lastMessage, { color: theme.textSecondary }]} numberOfLines={1}>{item.lastMessage}</Text>
          {item.unread > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <Text style={[styles.title, { color: theme.headerText }]}>Messages</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setShowActionsMenu(true)}>
          <Text style={styles.headerIcon}>✏️</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={chats}
        renderItem={renderChat}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={loading ? <HeartLoader message="Loading chats..." subtext="" /> : null}
      />

      <Modal visible={showActionsMenu} animationType="slide" transparent onRequestClose={() => setShowActionsMenu(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.actionsModal, { backgroundColor: theme.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Chat Actions</Text>
              <TouchableOpacity onPress={() => setShowActionsMenu(false)}>
                <Text style={[styles.closeBtn, { color: theme.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.actionsContent}>
              <TouchableOpacity style={[styles.actionItem, { backgroundColor: theme.background }]} onPress={markAllAsRead}>
                <Text style={styles.actionIcon}>✓</Text>
                <Text style={[styles.actionText, { color: theme.text }]}>Mark all as read</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!selectedChat} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setSelectedChat(null)}>
        {selectedChat && (
          selectedChat.isSystem ? (
            <SystemChatScreen onClose={() => setSelectedChat(null)} />
          ) : (
            <ChatScreen 
              chat={selectedChat} 
              onClose={() => {
                setSelectedChat(null);
                loadChats();
              }} 
            />
          )
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
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerIcon: { fontSize: 20 },
  listContent: { padding: 16 },
  chatItem: { 
    flexDirection: 'row', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarContainer: { position: 'relative', marginRight: 12 },
  systemAvatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  systemAvatarText: { fontSize: 28 },
  onlineDot: { 
    position: 'absolute', 
    bottom: 2, 
    right: 2, 
    width: 14, 
    height: 14, 
    borderRadius: 7, 
    borderWidth: 2, 
    borderColor: '#fff',
  },
  chatInfo: { flex: 1, justifyContent: 'center' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  chatName: { fontSize: 17, fontWeight: '700' },
  chatTime: { fontSize: 12 },
  chatFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMessage: { fontSize: 14, flex: 1 },
  unreadBadge: { 
    borderRadius: 10, 
    minWidth: 20, 
    height: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  actionsModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  closeBtn: { fontSize: 24, fontWeight: '300' },
  actionsContent: { padding: 16 },
  actionItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 8 },
  actionIcon: { fontSize: 24, marginRight: 12 },
  actionText: { fontSize: 16, fontWeight: '600' }
});
