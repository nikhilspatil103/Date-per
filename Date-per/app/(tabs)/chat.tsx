import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Platform, StatusBar, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WebSocketService from '../../services/websocket';
import ChatScreen from '../../components/ChatScreen';
import SystemChatScreen from '../../components/SystemChatScreen';
import Avatar from '../../components/Avatar';
import { useTheme } from '../../contexts/ThemeContext';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function ChatListScreen({ onChatSelect, onUnreadChange, isActive, pendingChatUserId, onChatOpened }: { onChatSelect: (chat: any) => void; onUnreadChange?: (count: number) => void; isActive?: boolean; pendingChatUserId?: string | null; onChatOpened?: () => void }) {
  const { theme } = useTheme();
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isActive) {
      loadChats();
    }
    
    if (!isActive) return;
    
    const handleNewMessage = (message: any) => {
      console.log('Chat list received new message:', message);
      loadChats();
    };
    
    WebSocketService.onMessage(handleNewMessage);
    
    return () => {
      WebSocketService.removeMessageListener(handleNewMessage);
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
      
      const response = await fetch(`${API_URL}}/api/messages/chats/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('Chat list response:', data);
      
      if (!data || data.length === 0) {
        console.log('No chats found, showing system chat only');
        setChats([systemChat]);
        setUnreadCount(0);
        if (onUnreadChange) onUnreadChange(0);
        return;
      }
      
      const contactsResponse = await fetch(`${API_URL}}/api/contacts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const contacts = await contactsResponse.json();
      
      const formattedChats = await Promise.all(data.map(async (chat: any) => {
        const contact = contacts.find((c: any) => c._id === chat._id);
        let userInfo = contact;
        
        // Fetch user from database if not in contacts
        if (!userInfo) {
          try {
            const userResponse = await fetch(`http://192.168.1.102:3000}/api/user/${chat._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (userResponse.ok) {
              userInfo = await userResponse.json();
            }
          } catch (err) {
            console.log(`Failed to fetch user ${chat._id}:`, err);
          }
        }
        
        return {
          id: chat._id,
          _id: chat._id,
          name: userInfo?.name || 'User',
          photo: userInfo?.photo || userInfo?.profilePhoto,
          lastMessage: chat.lastMessage.text,
          time: new Date(chat.lastMessage.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date(chat.lastMessage.createdAt).getTime(),
          unread: chat.unreadCount,
          online: userInfo?.online || false
        };
      }));
      
      const sortedChats = formattedChats.sort((a: any, b: any) => b.timestamp - a.timestamp);
      
      // Add system chat at the top
      const allChats = [systemChat, ...sortedChats];
      
      console.log('Formatted chats:', allChats);
      setChats(allChats);
      const total = allChats.reduce((sum: number, chat: any) => sum + chat.unread, 0);
      setUnreadCount(total);
      if (onUnreadChange) {
        onUnreadChange(total);
      }
    } catch (error) {
      console.error('Load chats error:', error);
    }
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
            <Avatar photo={item.photo} name={item.name} size={56} />
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
        <TouchableOpacity style={styles.headerBtn}>
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
      />

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
});
