import API_URL from '../config/api';
import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Platform, StatusBar, Modal, BackHandler, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import WebSocketService from '../services/websocket';
import AvatarV3 from '../components/AvatarV3';
import UserProfileDetailScreen from '../components/UserProfileDetailScreen';
import { useTheme } from '../contexts/ThemeContext';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function ChatScreen({ chat, onClose }: { chat: any; onClose: () => void }) {
  const { theme, mode } = useTheme();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [myProfilePhoto, setMyProfilePhoto] = useState('');
  const [myName, setMyName] = useState('Me');
  const [myUserId, setMyUserId] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const emojis = ['😊', '😂', '❤️', '👍', '🎉', '😍', '🔥', '💯', '😎', '🤔', '😢', '😡', '🙏', '👏', '💪', '🎊', '✨', '🌟', '💕', '🥰'];

  const getStatusText = () => {
    if (chat.online) return 'Online';
    if (chat.lastSeen) {
      const lastSeenDate = new Date(chat.lastSeen);
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

  useEffect(() => {
    loadMyProfile();
    loadMessages();
    cacheUserData();
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    
    const handleNewMessage = (message: any) => {
      if ((message.sender === chat._id && message.receiver === myUserId) || 
          (message.sender === myUserId && message.receiver === chat._id)) {
        setMessages(prev => [...prev, {
          id: message._id || message.messageId,
          text: message.text,
          sender: message.sender === myUserId ? 'me' : 'other',
          time: new Date(message.timestamp || message.createdAt),
          status: 'sent'
        }]);
      }
    };
    WebSocketService.onMessage(handleNewMessage);
    
    return () => {
      backHandler.remove();
      WebSocketService.removeMessageListener(handleNewMessage);
    };
  }, [chat._id, myUserId]);

  const cacheUserData = async () => {
    if (chat.name && chat.name !== 'User') {
      try {
        await AsyncStorage.setItem(`user_${chat._id}`, JSON.stringify({
          _id: chat._id,
          name: chat.name,
          photo: chat.photo,
          profilePhoto: chat.profilePhoto
        }));
      } catch (err) {
        console.log('Failed to cache user data:', err);
      }
    }
  };

  const loadMyProfile = async () => {
    const photo = await AsyncStorage.getItem('userProfilePhoto');
    const name = await AsyncStorage.getItem('userName');
    const userId = await AsyncStorage.getItem('userId');
    if (photo) setMyProfilePhoto(photo);
    if (name) setMyName(name);
    if (userId) setMyUserId(userId);
  };

  const loadMessages = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/messages/${chat._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      const formattedMessages = data.map((msg: any) => ({
        id: msg._id,
        text: msg.text,
        sender: msg.sender === chat._id ? 'other' : 'me',
        time: new Date(msg.createdAt),
        status: 'sent'
      }));
      setMessages(formattedMessages);
      console.log('Loaded', formattedMessages.length, 'messages');
    } catch (error) {
      console.error('Load messages error:', error);
    }
  };

  const sendMessage = () => {
    console.log('Send clicked, inputText:', inputText, 'myUserId:', myUserId);
    if (inputText.trim() && myUserId) {
      WebSocketService.sendMessage(myUserId, chat._id, inputText);
      const newMsg = {
        id: Date.now(),
        text: inputText,
        sender: 'me',
        time: new Date(),
        status: 'sent'
      };
      setMessages(prev => [...prev, newMsg]);
      setInputText('');
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } else {
      console.log('Cannot send - missing data');
    }
  };

  const pickMedia = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission denied');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
        
        // Show uploading message
        const tempMsg = {
          id: Date.now(),
          text: '📤 Uploading image...',
          sender: 'me',
          time: new Date(),
          status: 'sending'
        };
        setMessages(prev => [...prev, tempMsg]);

        // Upload to Cloudinary via backend
        const token = await AsyncStorage.getItem('authToken');
        const uploadResponse = await fetch(`${API_URL}/api/upload-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ image: base64 })
        });

        if (!uploadResponse.ok) {
          throw new Error('Upload failed');
        }

        const data = await uploadResponse.json();
        
        if (!data.imageUrl) {
          throw new Error('No image URL returned');
        }
        
        // Remove temp message and send actual image URL
        setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
        
        WebSocketService.sendMessage(myUserId, chat._id, data.imageUrl);
        const newMsg = {
          id: Date.now(),
          text: data.imageUrl,
          sender: 'me',
          time: new Date(),
          status: 'sent'
        };
        setMessages(prev => [...prev, newMsg]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image. Please try again.');
      // Remove uploading message if it exists
      setMessages(prev => prev.filter(m => m.status !== 'sending'));
    }
  };

  const getDateLabel = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const messageDate = new Date(date);
    messageDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    
    if (messageDate.getTime() === today.getTime()) return 'Today';
    if (messageDate.getTime() === yesterday.getTime()) return 'Yesterday';
    return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const shouldShowDateSeparator = (currentMsg: any, prevMsg: any) => {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.time).toDateString();
    const prevDate = new Date(prevMsg.time).toDateString();
    return currentDate !== prevDate;
  };

  const renderMessage = ({ item, index }: any) => {
    const timeStr = new Date(item.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const isImage = item.text?.startsWith('http') && (item.text.includes('cloudinary') || item.text.includes('res.cloudinary'));
    
    const showDateSeparator = shouldShowDateSeparator(item, messages[index - 1]);
    
    return (
      <>
        {showDateSeparator && (
          <View style={styles.dateSeparator}>
            <Text style={[styles.dateSeparatorText, { color: mode === 'dark' ? '#6b7280' : '#6b7280' }]}>{getDateLabel(item.time)}</Text>
          </View>
        )}
      <View style={[styles.messageRow, item.sender === 'me' ? styles.myMessageRow : styles.otherMessageRow]}>
        {item.sender === 'other' && (
          <TouchableOpacity onPress={() => setShowProfile(true)}>
            <AvatarV3 photo={chat.photo} name={chat.name} size={36} />
          </TouchableOpacity>
        )}
        <View style={styles.messageContent}>
          <View style={[styles.messageBubble, item.sender === 'me' ? [styles.myMessage, { backgroundColor: mode === 'dark' ? '#005c4b' : '#dcf8c6' }] : [styles.otherMessage, { backgroundColor: mode === 'dark' ? '#2d2438' : '#e8e0f5' }]]}>
            {isImage ? (
              <TouchableOpacity onPress={() => setFullScreenImage(item.text)} activeOpacity={0.9}>
                <Image 
                  source={{ uri: item.text }} 
                  style={styles.messageImage}
                  resizeMode="cover"
                  onError={() => console.log('Image load error')}
                />
              </TouchableOpacity>
            ) : (
              <Text style={[styles.messageText, { color: item.sender === 'me' ? (mode === 'dark' ? '#fff' : '#000') : (mode === 'dark' ? '#e8e0f5' : '#4a148c') }]}>{item.text}</Text>
            )}
          </View>
          <View style={[styles.messageFooter, item.sender === 'me' ? styles.myMessageFooter : styles.otherMessageFooter]}>
            <Text style={[styles.timeText, { color: theme.textSecondary }]}>{timeStr}</Text>
            {item.sender === 'me' && <Text style={styles.statusText}>✓✓</Text>}
          </View>
        </View>
        {item.sender === 'me' && <AvatarV3 photo={myProfilePhoto} name={myName} size={36} />}
      </View>
      </>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: mode === 'dark' ? '#0d1418' : '#f5f1ed' }]}>
      <View style={[styles.header, { backgroundColor: mode === 'dark' ? '#1a2f2f' : '#4db6ac', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 4 }]}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: '#fff' }]}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerCenter} onPress={() => setShowProfile(true)}>
          <AvatarV3 photo={chat.photo} name={chat.name} size={46} />
          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, { color: '#fff' }]}>{chat.name}</Text>
            <Text style={[styles.headerStatus, { color: 'rgba(255,255,255,0.85)' }]}>{getStatusText()}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuBtn}>
          <Text style={[styles.menuIcon, { color: '#fff' }]}>⋮</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={({ item, index }) => renderMessage({ item, index })}
        keyExtractor={item => item.id.toString()}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
      />

      <View style={[styles.inputContainer, { backgroundColor: mode === 'dark' ? '#1a2f2f' : '#f0f0f0', borderTopColor: mode === 'dark' ? '#2d4a4a' : '#d0d0d0' }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={pickMedia}>
          <Text style={styles.iconText}>📎</Text>
        </TouchableOpacity>
        <View style={[styles.inputWrapper, { backgroundColor: mode === 'dark' ? '#0d1418' : '#fff', borderColor: 'transparent' }]}>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Type a message..."
            placeholderTextColor={mode === 'dark' ? '#6b7280' : '#9ca3af'}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={sendMessage}
            multiline
          />
          <TouchableOpacity style={styles.emojiBtn} onPress={() => setShowEmojiPicker(!showEmojiPicker)}>
            <Text style={styles.emojiText}>😊</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={sendMessage} style={[styles.sendBtn, { backgroundColor: mode === 'dark' ? '#4db6ac' : '#4db6ac' }]}>
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>

      {showEmojiPicker && (
        <View style={[styles.emojiPicker, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <View style={styles.emojiGrid}>
            {emojis.map((emoji, index) => (
              <TouchableOpacity
                key={index}
                style={styles.emojiItem}
                onPress={() => {
                  setInputText(prev => prev + emoji);
                  setShowEmojiPicker(false);
                }}
              >
                <Text style={styles.emojiItemText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <Modal visible={showProfile} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShowProfile(false)}>
        <UserProfileDetailScreen 
          profile={chat} 
          onClose={() => setShowProfile(false)} 
        />
      </Modal>

      <Modal visible={!!fullScreenImage} animationType="fade" transparent onRequestClose={() => setFullScreenImage(null)}>
        <View style={styles.fullScreenImageContainer}>
          <TouchableOpacity style={styles.fullScreenClose} onPress={() => setFullScreenImage(null)}>
            <Text style={styles.fullScreenCloseText}>✕</Text>
          </TouchableOpacity>
          {fullScreenImage && (
            <Image 
              source={{ uri: fullScreenImage }} 
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    paddingTop: STATUS_BAR_HEIGHT + 10, 
    paddingBottom: 10, 
    paddingHorizontal: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 28, fontWeight: '400' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  headerAvatar: { fontSize: 46 },
  headerInfo: { marginLeft: 14, justifyContent: 'center' },
  headerTitle: { fontSize: 19, fontWeight: '700', letterSpacing: 0.3 },
  headerStatus: { fontSize: 13, marginTop: 2, fontWeight: '400' },
  menuBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
  menuIcon: { fontSize: 24, color: '#fff' },
  messagesList: { flex: 1, backgroundColor: 'transparent' },
  messagesContent: { padding: 16 },
  dateSeparator: { alignItems: 'center', paddingVertical: 4 },
  dateSeparatorText: { fontSize: 11, fontWeight: '500' },
  messageRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end', gap: 8 },
  myMessageRow: { justifyContent: 'flex-end' },
  otherMessageRow: { justifyContent: 'flex-start' },
  messageAvatar: { fontSize: 32 },
  messageContent: { maxWidth: '70%' },
  messageBubble: { padding: 14, borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  myMessage: { borderBottomRightRadius: 6 },
  otherMessage: { borderBottomLeftRadius: 6 },
  messageText: { fontSize: 16, lineHeight: 22 },
  messageImage: { width: 200, height: 200, borderRadius: 8 },
  messageFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 4, paddingHorizontal: 4, gap: 6 },
  myMessageFooter: { justifyContent: 'flex-end' },
  otherMessageFooter: { justifyContent: 'flex-start' },
  timeText: { fontSize: 11 },
  statusText: { fontSize: 11, color: '#4ECDC4' },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopWidth: 1, gap: 10 },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  iconText: { fontSize: 20 },
  inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 24, paddingHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  input: { flex: 1, fontSize: 15, paddingVertical: 12, maxHeight: 100 },
  emojiBtn: { paddingLeft: 8 },
  emojiText: { fontSize: 20 },
  emojiPicker: { borderTopWidth: 1, padding: 16 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiItem: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.05)' },
  emojiItemText: { fontSize: 28 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 3 },
  sendIcon: { fontSize: 20, color: '#fff', fontWeight: '700' },
  fullScreenImageContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  fullScreenImage: { width: '100%', height: '100%' },
  fullScreenClose: { position: 'absolute', top: STATUS_BAR_HEIGHT + 10, right: 20, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  fullScreenCloseText: { color: '#fff', fontSize: 20, fontWeight: '600' }
});
