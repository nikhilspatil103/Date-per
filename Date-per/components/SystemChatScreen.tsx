import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Platform, StatusBar, KeyboardAvoidingView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function SystemChatScreen({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [userName, setUserName] = useState('User');

  useEffect(() => {
    loadUserName();
    loadSystemMessages();
  }, []);

  const loadUserName = async () => {
    const name = await AsyncStorage.getItem('userName');
    if (name) setUserName(name);
  };

  const loadSystemMessages = () => {
    const welcomeMessages = [
      {
        id: 1,
        text: `Welcome to DatePer! 🎉`,
        sender: 'system',
        time: 'Now'
      },
      {
        id: 2,
        text: `Here's how it works:\n\n💰 You start with 100 free coins\n💬 Each new chat costs 10 coins\n⏰ Once you start a chat, you get 24hr unlimited access\n🎁 Earn more coins through daily check-ins and invites\n\nHappy dating! ❤️`,
        sender: 'system',
        time: 'Now'
      }
    ];
    setMessages(welcomeMessages);
  };

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: inputText,
      sender: 'user',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMessage]);
    setInputText('');

    // Auto-reply from system
    setTimeout(() => {
      const reply = {
        id: Date.now() + 1,
        text: 'Thanks for your message! Our team will get back to you soon. 😊',
        sender: 'system',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, reply]);
    }, 1000);
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>DatePer Team</Text>
          <Text style={styles.headerStatus}>Notification Center</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.messagesContainer} contentContainerStyle={styles.messagesContent}>
        {messages.map((msg) => (
          <View key={msg.id} style={[styles.messageBubble, msg.sender === 'user' ? styles.userBubble : styles.systemBubble]}>
            <Text style={[styles.messageText, msg.sender === 'user' ? styles.userText : styles.systemText]}>
              {msg.text}
            </Text>
            <Text style={[styles.messageTime, msg.sender === 'user' ? styles.userTime : styles.systemTime]}>
              {msg.time}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.inputContainer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
          placeholder="Send a message to DatePer team..."
          placeholderTextColor={theme.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity style={[styles.sendBtn, { backgroundColor: theme.primary }]} onPress={sendMessage}>
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    paddingTop: STATUS_BAR_HEIGHT + 15, 
    paddingBottom: 15, 
    paddingHorizontal: 16, 
    flexDirection: 'row', 
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backIcon: { fontSize: 24, color: '#fff', fontWeight: '700' },
  headerInfo: { flex: 1, marginLeft: 8 },
  headerName: { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerStatus: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 12 },
  systemBubble: { alignSelf: 'flex-start', backgroundColor: 'rgba(102,126,234,0.2)' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#667eea' },
  messageText: { fontSize: 15, lineHeight: 20 },
  systemText: { color: '#fff' },
  userText: { color: '#fff' },
  messageTime: { fontSize: 11, marginTop: 4 },
  systemTime: { color: 'rgba(255,255,255,0.6)' },
  userTime: { color: 'rgba(255,255,255,0.8)', textAlign: 'right' },
  inputContainer: { flexDirection: 'row', padding: 12, alignItems: 'flex-end', borderTopWidth: 1 },
  input: { flex: 1, maxHeight: 100, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, borderWidth: 1 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  sendIcon: { fontSize: 20, color: '#fff' },
});
