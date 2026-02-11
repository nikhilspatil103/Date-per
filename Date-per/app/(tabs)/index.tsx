import { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text, ActivityIndicator, Animated, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WebSocketService from '../../services/websocket';
import LocationService from '../../services/location';
import PushNotificationService from '../../services/pushNotifications';
import FindScreen from './find';
import ChatListScreen from './chat';
import ContactsScreen from './contacts';
import ProfileScreen from './profile';
import Toast from '../../components/Toast';
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext';
import API_URL from '../../config/api';

function HomeScreen() {
  const { theme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('find');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [interestIn, setInterestIn] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });
  const [unreadCount, setUnreadCount] = useState(0);
  const [locationAsked, setLocationAsked] = useState(false);
  const [pendingChatUserId, setPendingChatUserId] = useState<string | null>(null);
  const [pendingNotificationUserId, setPendingNotificationUserId] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const unreadDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isLoggedIn && !locationAsked) {
      WebSocketService.connect();
      requestLocationPermission();
      setLocationAsked(true);
      
      // Handle notification taps
      const notificationResponseListener = PushNotificationService.addNotificationResponseListener((response) => {
        const data = response.notification.request.content.data;
        if (data.type === 'message' && data.sender) {
          setPendingChatUserId(data.sender);
          setActiveTab('chat');
        } else if (data.type === 'like' && data.likerId) {
          setPendingNotificationUserId(data.likerId);
          setActiveTab('find');
        }
      });
      
      const globalMessageHandler = (message: any) => {
        console.log('Global message handler received:', message);
        // Debounced unread count update
        if (unreadDebounceTimer.current) clearTimeout(unreadDebounceTimer.current);
        unreadDebounceTimer.current = setTimeout(() => {
          loadUnreadCount();
        }, 500);
      };
      
      WebSocketService.onMessage(globalMessageHandler);
      
      return () => {
        WebSocketService.removeMessageListener(globalMessageHandler);
        notificationResponseListener.remove();
        if (unreadDebounceTimer.current) clearTimeout(unreadDebounceTimer.current);
      };
    }
  }, [isLoggedIn]);

  const requestLocationPermission = async () => {
    const hasPermission = await LocationService.hasPermission();
    if (hasPermission) {
      await LocationService.updateLocationOnServer();
      return;
    }

    const lastDenied = await AsyncStorage.getItem('locationDeniedAt');
    if (lastDenied) {
      const deniedTime = parseInt(lastDenied);
      const now = Date.now();
      const hoursPassed = (now - deniedTime) / (1000 * 60 * 60);
      if (hoursPassed < 24) return;
    }

    Alert.alert(
      'Location Permission',
      'DatePer needs your location to show nearby users and calculate distances.',
      [
        { 
          text: 'Not Now', 
          style: 'cancel',
          onPress: async () => {
            await AsyncStorage.setItem('locationDeniedAt', Date.now().toString());
          }
        },
        {
          text: 'Allow',
          onPress: async () => {
            await AsyncStorage.removeItem('locationDeniedAt');
            await LocationService.updateLocationOnServer();
          }
        }
      ]
    );
  };

  const loadUnreadCount = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/messages/chats/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      const total = data.reduce((sum: number, chat: any) => sum + chat.unreadCount, 0);
      console.log('Unread count:', total, 'from', data.length, 'chats');
      setUnreadCount(total);
    } catch (error) {
      console.error('Load unread count error:', error);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'chat') {
      loadUnreadCount();
    }
  };

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
  };

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && (!name || !age || !gender || !interestIn))) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    if (!isLogin && parseInt(age) < 18) {
      showToast('You must be at least 18 years old', 'error');
      return;
    }

    if (!validateEmail(email)) {
      showToast('Please enter a valid email', 'error');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const body = isLogin ? { email, password } : { email, password, name, age: parseInt(age), gender, interestIn };
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      console.log('API Response:', { status: response.status, data });

      if (response.ok && data.token) {
        await AsyncStorage.setItem('authToken', data.token);
        await AsyncStorage.setItem('userId', data.userId);
        await AsyncStorage.setItem('userEmail', data.email);
        await AsyncStorage.setItem('userName', data.name);
        if (data.interestIn) await AsyncStorage.setItem('userInterestIn', data.interestIn);
        if (data.gender) await AsyncStorage.setItem('userGender', data.gender);
        if (data.height) await AsyncStorage.setItem('userHeight', data.height.toString());
        if (data.graduation) await AsyncStorage.setItem('userGraduation', data.graduation);
        if (data.age) await AsyncStorage.setItem('userAge', data.age.toString());
        if (data.bio) await AsyncStorage.setItem('userBio', data.bio);
        if (data.profilePhoto) await AsyncStorage.setItem('userProfilePhoto', data.profilePhoto);
        if (data.photos) await AsyncStorage.setItem('userPhotos', JSON.stringify(data.photos));
        setIsLoggedIn(true);
        showToast(isLogin ? 'Login successful! 🎉' : 'Account created! 🎉');
      } else {
        showToast(data.message || 'Request failed', 'error');
      }
    } catch (error) {
      console.error('API Error:', error);
      showToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      WebSocketService.disconnect();
      await AsyncStorage.multiRemove([
        'authToken', 
        'userId', 
        'userEmail', 
        'userName',
        'userInterestIn',
        'userGender',
        'userHeight',
        'userGraduation',
        'userAge',
        'userBio',
        'userProfilePhoto',
        'userPhotos',
        'locationDeniedAt'
      ]);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FF6B9D" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading...</Text>
      </View>
    );
  }

  if (isLoggedIn) {
    return (
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          {activeTab === 'find' ? (
            <FindScreen onLogout={handleLogout} isActive={activeTab === 'find'} pendingNotificationUserId={pendingNotificationUserId} onNotificationHandled={() => setPendingNotificationUserId(null)} />
          ) : activeTab === 'chat' ? (
            <ChatListScreen onChatSelect={() => {}} onUnreadChange={setUnreadCount} isActive={activeTab === 'chat'} pendingChatUserId={pendingChatUserId} onChatOpened={() => setPendingChatUserId(null)} />
          ) : activeTab === 'contacts' ? (
            <ContactsScreen isActive={activeTab === 'contacts'} />
          ) : (
            <ProfileScreen onLogout={handleLogout} />
          )}
        </View>
        <View style={[styles.tabBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'find' && styles.activeTab]} 
            onPress={() => handleTabChange('find')}
          >
            <View style={styles.tabLogoContainer}>
              <View style={styles.tabLogo}>
                <View style={styles.tabHeartLeft} />
                <View style={styles.tabHeartRight} />
                <View style={styles.tabHeartBottom} />
              </View>
            </View>
            <Text style={[styles.tabLabel, { color: theme.textSecondary }, activeTab === 'find' && { color: theme.primary, fontWeight: '600' }]}>Nearby</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'chat' && styles.activeTab]} 
            onPress={() => handleTabChange('chat')}
          >
            <View style={styles.tabIconContainer}>
              <Text style={styles.tabIcon}>💬</Text>
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, { color: theme.textSecondary }, activeTab === 'chat' && { color: theme.primary, fontWeight: '600' }]}>Chats</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'contacts' && styles.activeTab]} 
            onPress={() => handleTabChange('contacts')}
          >
            <Text style={styles.tabIcon}>👥</Text>
            <Text style={[styles.tabLabel, { color: theme.textSecondary }, activeTab === 'contacts' && { color: theme.primary, fontWeight: '600' }]}>Contacts</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'profile' && styles.activeTab]} 
            onPress={() => handleTabChange('profile')}
          >
            <Text style={styles.tabIcon}>👤</Text>
            <Text style={[styles.tabLabel, { color: theme.textSecondary }, activeTab === 'profile' && { color: theme.primary, fontWeight: '600' }]}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.container}>
      <Toast 
        message={toast.message} 
        type={toast.type} 
        visible={toast.visible} 
        onHide={() => setToast({ ...toast, visible: false })} 
      />
      <Text style={styles.logo}>💕</Text>
      <Text style={styles.title}>DatePer</Text>
      <Text style={styles.subtitle}>{isLogin ? 'Welcome back!' : 'Create your account'}</Text>
      
      {!isLogin && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            onChangeText={setName}
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Age"
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
            editable={!loading}
          />
          <View style={styles.pickerRow}>
            <TouchableOpacity 
              style={[styles.pickerButton, gender === 'Male' && styles.pickerButtonActive]} 
              onPress={() => setGender('Male')}
            >
              <Text style={[styles.pickerText, gender === 'Male' && styles.pickerTextActive]}>♂ Male</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.pickerButton, gender === 'Female' && styles.pickerButtonActive]} 
              onPress={() => setGender('Female')}
            >
              <Text style={[styles.pickerText, gender === 'Female' && styles.pickerTextActive]}>♀ Female</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>Interested In</Text>
          <View style={styles.pickerRow}>
            <TouchableOpacity 
              style={[styles.pickerButton, interestIn === 'Male' && styles.pickerButtonActive]} 
              onPress={() => setInterestIn('Male')}
            >
              <Text style={[styles.pickerText, interestIn === 'Male' && styles.pickerTextActive]}>♂ Male</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.pickerButton, interestIn === 'Female' && styles.pickerButtonActive]} 
              onPress={() => setInterestIn('Female')}
            >
              <Text style={[styles.pickerText, interestIn === 'Female' && styles.pickerTextActive]}>♀ Female</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.pickerButton, interestIn === 'Both' && styles.pickerButtonActive]} 
              onPress={() => setInterestIn('Both')}
            >
              <Text style={[styles.pickerText, interestIn === 'Both' && styles.pickerTextActive]}>⚥ Both</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleAuth}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{isLogin ? 'Login' : 'Sign Up'}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchButton}>
        <Text style={styles.switchText}>
          {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
        </Text>
      </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  logo: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#FF6B9D',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#FFB3C9',
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#FF6B9D',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#FFB3C9',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: '#FF6B9D',
    fontSize: 14,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    marginTop: 5,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  pickerButton: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#FFB3C9',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  pickerButtonActive: {
    backgroundColor: '#FF6B9D',
    borderColor: '#FF6B9D',
  },
  pickerText: {
    color: '#666',
    fontSize: 16,
  },
  pickerTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: 20,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderTopWidth: 2,
    borderTopColor: '#667eea',
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
  },
  tabLogoContainer: {
    width: 28,
    height: 28,
    marginBottom: 4,
  },
  tabLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF6B9D',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  tabHeartLeft: {
    position: 'absolute',
    top: 6,
    left: 8,
    width: 6,
    height: 9,
    backgroundColor: '#fff',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    transform: [{ rotate: '-45deg' }],
  },
  tabHeartRight: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 6,
    height: 9,
    backgroundColor: '#fff',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    transform: [{ rotate: '45deg' }],
  },
  tabHeartBottom: {
    position: 'absolute',
    bottom: 6,
    left: 11,
    width: 6,
    height: 6,
    backgroundColor: '#fff',
    transform: [{ rotate: '45deg' }],
  },
  tabIconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#FF6B9D',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default function App() {
  return (
    <ThemeProvider>
      <HomeScreen />
    </ThemeProvider>
  );
}
