import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PushNotificationService from './pushNotifications';
import API_URL from '../config/api';

class WebSocketService {
  private socket: Socket | null = null;
  private messageCallbacks: ((message: any) => void)[] = [];

  connect = async () => {
    const token = await AsyncStorage.getItem('authToken');
    const userId = await AsyncStorage.getItem('userId');
    
    this.socket = io(API_URL, {
      transports: ['websocket'],
      reconnection: true,
      auth: { token }
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket?.id, 'userId:', userId);
      console.log('Registering message listeners, callbacks count:', this.messageCallbacks.length);
      if (token) {
        this.socket?.emit('authenticate', token);
        console.log('Authenticated with token');
      }
    });

    this.socket.on('newMessage', (message) => {
      console.log('!!! NEW MESSAGE EVENT RECEIVED !!!', message);
      console.log('Callbacks to notify:', this.messageCallbacks.length);
      
      // Show push notification for new message
      PushNotificationService.showLocalNotification(
        '💬 New Message',
        `New message received`,
        { type: 'message', ...message }
      );
      
      this.messageCallbacks.forEach(callback => {
        console.log('Calling callback');
        callback(message);
      });
    });

    this.socket.on('userOnline', (data) => {
      console.log('User came online:', data.userId);
      this.messageCallbacks.forEach(callback => callback({ type: 'userOnline', ...data }));
    });

    this.socket.on('userOffline', (data) => {
      console.log('User went offline:', data.userId);
      this.messageCallbacks.forEach(callback => callback({ type: 'userOffline', ...data }));
    });

    this.socket.on('likeNotification', async (data) => {
      console.log('Like notification received:', data);
      
      // Show push notification
      await PushNotificationService.showLocalNotification(
        '❤️ New Like!',
        data.message,
        { type: 'like', ...data }
      );
      
      // Save to AsyncStorage for persistence
      try {
        const stored = await AsyncStorage.getItem('notifications');
        const notifications = stored ? JSON.parse(stored) : [];
        notifications.unshift({ ...data, timestamp: new Date().toISOString(), read: false });
        await AsyncStorage.setItem('notifications', JSON.stringify(notifications.slice(0, 100)));
      } catch (e) {
        console.error('Failed to save notification:', e);
      }
      
      this.messageCallbacks.forEach(callback => callback({ type: 'like', ...data }));
    });

    this.socket.on('connect_error', (error) => {
      console.log('WebSocket connection issue (will retry automatically)');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });
  };

  disconnect = () => {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  };

  sendMessage = (sender: string, receiver: string, text: string) => {
    console.log('WebSocket sendMessage called');
    console.log('Socket exists:', !!this.socket);
    console.log('Socket connected:', this.socket?.connected);
    console.log('Message data:', { sender, receiver, text });
    
    if (!this.socket) {
      console.log('Socket not initialized, connecting now...');
      this.connect().then(() => {
        if (this.socket && this.socket.connected) {
          this.socket.emit('sendMessage', { sender, receiver, text });
          console.log('Message emitted to server after reconnect');
        }
      });
      return;
    }
    
    if (this.socket && this.socket.connected) {
      this.socket.emit('sendMessage', { sender, receiver, text });
      console.log('Message emitted to server');
    } else {
      console.error('Socket not connected. Socket:', !!this.socket, 'Connected:', this.socket?.connected);
      console.log('Attempting to reconnect...');
      this.socket?.connect();
    }
  };

  onMessage = (callback: (message: any) => void) => {
    this.messageCallbacks.push(callback);
  };

  removeMessageListener = (callback: (message: any) => void) => {
    this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
  };
}

export default new WebSocketService();
