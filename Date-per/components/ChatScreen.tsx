import API_URL from '../config/api';
import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Platform, StatusBar, Modal, BackHandler, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import WebSocketService from '../services/websocket';
import Avatar from '../components/Avatar';
import UserProfileDetailScreen from '../components/UserProfileDetailScreen';
import { useTheme } from '../contexts/ThemeContext';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function ChatScreen({ chat, onClose }: { chat: any; onClose: () => void }) {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [myProfilePhoto, setMyProfilePhoto] = useState('');
  const [myName, setMyName] = useState('Me');
  const [myUserId, setMyUserId] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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

        const { imageUrl } = await uploadResponse.json();
        
        // Remove temp message and send actual image URL
        setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
        
        WebSocketService.sendMessage(myUserId, chat._id, imageUrl);
        const newMsg = {
          id: Date.now(),
          text: imageUrl,
          sender: 'me',
          time: new Date(),
          status: 'sent'
        };
        setMessages(prev => [...prev, newMsg]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image');
    }
  };

  const renderMessage = ({ item }: any) => {
    const timeStr = new Date(item.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const isImage = item.text?.startsWith('http') && (item.text.includes('cloudinary') || item.text.includes('res.cloudinary'));
    
    return (
      <View style={[styles.messageRow, item.sender === 'me' ? styles.myMessageRow : styles.otherMessageRow]}>
        {item.sender === 'other' && (
          <TouchableOpacity onPress={() => setShowProfile(true)}>
            <Avatar photo={chat.photo} name={chat.name} size={36} />
          </TouchableOpacity>
        )}
        <View style={styles.messageContent}>
          <View style={[styles.messageBubble, item.sender === 'me' ? [styles.myMessage, { backgroundColor: theme.primary }] : [styles.otherMessage, { backgroundColor: theme.card }]]}>
            {isImage ? (
              <Image 
                source={{ uri: item.text }} 
                style={styles.messageImage}
                resizeMode="cover"
                onError={() => console.log('Image load error')}
              />
            ) : (
              <Text style={[styles.messageText, { color: item.sender === 'me' ? '#fff' : theme.text }]}>{item.text}</Text>
            )}
          </View>
          <View style={[styles.messageFooter, item.sender === 'me' ? styles.myMessageFooter : styles.otherMessageFooter]}>
            <Text style={[styles.timeText, { color: theme.textSecondary }]}>{timeStr}</Text>
            {item.sender === 'me' && <Text style={styles.statusText}>✓✓</Text>}
          </View>
        </View>
        {item.sender === 'me' && <Avatar photo={myProfilePhoto} name={myName} size={36} />}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerCenter} onPress={() => setShowProfile(true)}>
          <Avatar photo={chat.photo} name={chat.name} size={40} />
          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, { color: theme.headerText }]}>{chat.name}</Text>
            <Text style={[styles.headerStatus, { color: 'rgba(255,255,255,0.8)' }]}>{getStatusText()}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuBtn}>
          <Text style={styles.menuIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id.toString()}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
      />

      <View style={[styles.inputContainer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={pickMedia}>
          <Text style={styles.iconText}>📎</Text>
        </TouchableOpacity>
        <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Type a message..."
            placeholderTextColor={theme.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={sendMessage}
            multiline
          />
          <TouchableOpacity style={styles.emojiBtn} onPress={() => setShowEmojiPicker(!showEmojiPicker)}>
            <Text style={styles.emojiText}>😊</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={sendMessage} style={[styles.sendBtn, { backgroundColor: theme.primary }]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    paddingTop: STATUS_BAR_HEIGHT, 
    paddingBottom: 15, 
    paddingHorizontal: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backIcon: { fontSize: 24, color: '#fff', fontWeight: '700' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 12 },
  headerAvatar: { fontSize: 40 },
  headerInfo: { marginLeft: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerStatus: { fontSize: 12 },
  menuBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
  menuIcon: { fontSize: 24, color: '#fff' },
  messagesList: { flex: 1 },
  messagesContent: { padding: 16 },
  messageRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end', gap: 8 },
  myMessageRow: { justifyContent: 'flex-end' },
  otherMessageRow: { justifyContent: 'flex-start' },
  messageAvatar: { fontSize: 32 },
  messageContent: { maxWidth: '70%' },
  messageBubble: { padding: 12, borderRadius: 16, overflow: 'hidden' },
  myMessage: { borderBottomRightRadius: 4 },
  otherMessage: { borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 20 },
  messageImage: { width: 200, height: 200, borderRadius: 8 },
  messageFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 4, paddingHorizontal: 4, gap: 6 },
  myMessageFooter: { justifyContent: 'flex-end' },
  otherMessageFooter: { justifyContent: 'flex-start' },
  timeText: { fontSize: 11 },
  statusText: { fontSize: 11, color: '#4ECDC4' },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 16, borderTopWidth: 1, gap: 12 },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  iconText: { fontSize: 20 },
  inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 24, paddingHorizontal: 16, borderWidth: 1 },
  input: { flex: 1, fontSize: 15, paddingVertical: 12, maxHeight: 100 },
  emojiBtn: { paddingLeft: 8 },
  emojiText: { fontSize: 20 },
  emojiPicker: { borderTopWidth: 1, padding: 16 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiItem: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.05)' },
  emojiItemText: { fontSize: 28 },
  sendBtn: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  sendIcon: { fontSize: 20, color: '#fff', fontWeight: '700' }
});
