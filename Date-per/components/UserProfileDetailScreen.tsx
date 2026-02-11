import API_URL from '../config/api';
import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, StatusBar, Modal, Dimensions, BackHandler, FlatList, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ChatScreen from './ChatScreen';
import Avatar from '../components/Avatar';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function UserProfileDetailScreen({ profile, onClose, onLikeUpdate }: { profile: any; onClose: () => void; onLikeUpdate?: (liked: boolean, count: number) => void }) {
  const { theme } = useTheme();
  const [showChat, setShowChat] = useState(false);
  const [isContact, setIsContact] = useState(false);
  const [isLiked, setIsLiked] = useState(profile.isLiked || false);
  const [likesCount, setLikesCount] = useState(profile.likesCount || 0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const photoScrollRef = useRef<FlatList>(null);
  const fullscreenScrollRef = useRef<FlatList>(null);
  const autoScrollInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const photos = profile.photos && profile.photos.length > 0 ? profile.photos : [profile.photo];

  useEffect(() => {
    checkIfContact();
    
    if (photos.length > 1) {
      autoScrollInterval.current = setInterval(() => {
        setCurrentPhotoIndex(prev => {
          const next = (prev + 1) % photos.length;
          photoScrollRef.current?.scrollToIndex({ index: next, animated: true });
          return next;
        });
      }, 3000);
    }
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showFullscreen) {
        setShowFullscreen(false);
        return true;
      }
      onClose();
      return true;
    });
    
    return () => {
      if (autoScrollInterval.current) clearInterval(autoScrollInterval.current);
      backHandler.remove();
    };
  }, [photos.length, showFullscreen]);

  const checkIfContact = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const contacts = await response.json();
      setIsContact(contacts.some((c: any) => c._id === profile._id));
    } catch (error) {
      console.error('Check contact error:', error);
    }
  };

  const toggleContact = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const endpoint = isContact ? '/api/contacts/remove' : '/api/contacts/add';
      await fetch(`http://192.168.1.102:3000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ contactId: profile._id })
      });
      setIsContact(!isContact);
    } catch (error) {
      console.error('Toggle contact error:', error);
    }
  };

  const toggleLike = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/likes/toggle/${profile._id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setIsLiked(data.liked);
      setLikesCount(data.likesCount);
      onLikeUpdate?.(data.liked, data.likesCount);
    } catch (error) {
      console.error('Toggle like error:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <FlatList
            ref={photoScrollRef}
            data={photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentPhotoIndex(index);
            }}
            renderItem={({ item }) => (
              <TouchableOpacity activeOpacity={1} onPress={() => setShowFullscreen(true)} style={{ width }}>
                {item ? (
                  <Image source={{ uri: item }} style={styles.photoImage} />
                ) : (
                  <Avatar photo={item} name={profile.name} fullscreen={true} />
                )}
              </TouchableOpacity>
            )}
            keyExtractor={(item, index) => index.toString()}
          />
          <View style={styles.heroOverlay}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
            {profile.online && (
              <View style={[styles.statusPill, { backgroundColor: theme.online }]}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Active now</Text>
              </View>
            )}
          </View>
          {photos.length > 1 && (
            <View style={styles.photoIndicator}>
              {photos.map((_, index) => (
                <View
                  key={index}
                  style={[styles.dot, { backgroundColor: index === currentPhotoIndex ? '#fff' : 'rgba(255,255,255,0.4)' }]}
                />
              ))}
            </View>
          )}
        </View>
        
        <View style={[styles.profileCard, { backgroundColor: theme.background }]}>
          <View style={styles.headerSection}>
            <View>
              <Text style={[styles.profileName, { color: theme.text }]}>{profile.name}</Text>
              <View style={styles.tagRow}>
                <View style={[styles.tag, { backgroundColor: theme.primary + '15' }]}>
                  <Text style={[styles.tagText, { color: theme.primary }]}>{profile.age} years</Text>
                </View>
                <View style={[styles.tag, { backgroundColor: theme.primary + '15' }]}>
                  <Text style={[styles.tagText, { color: theme.primary }]}>📍 {profile.distance}</Text>
                </View>
                <View style={[styles.tag, { backgroundColor: theme.primary + '15' }]}>
                  <Text style={[styles.tagText, { color: theme.primary }]}>❤️ {likesCount}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.heartBtn, { backgroundColor: isLiked ? theme.primary : theme.card, borderColor: theme.border }]} 
              onPress={toggleLike}
            >
              <Text style={styles.heartIcon}>{isLiked ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          </View>

          {profile.bio && (
            <View style={[styles.bioCard, { backgroundColor: theme.card }]}>
              <Text style={[styles.bioTitle, { color: theme.text }]}>“</Text>
              <Text style={[styles.bioContent, { color: theme.textSecondary }]}>{profile.bio}</Text>
              <Text style={[styles.bioTitle, { color: theme.text }]}>”</Text>
            </View>
          )}

          <View style={[styles.detailsCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.detailsTitle, { color: theme.text }]}>Profile Details</Text>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>♀️</Text>
                <View>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Gender</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{profile.gender || 'Female'}</Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>💕</Text>
                <View>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Looking for</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>Connection</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>
      
      <View style={[styles.actionBar, { backgroundColor: theme.background }]}>
        <TouchableOpacity 
          style={[styles.actionBtnSecondary, { backgroundColor: theme.card, borderColor: theme.border }]} 
          onPress={toggleContact}
        >
          <Text style={[styles.actionIconSecondary, { color: theme.text }]}>{isContact ? '✓' : '+'}</Text>
          <Text style={[styles.actionTextSecondary, { color: theme.text }]}>{isContact ? 'Added' : 'Add'}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtnPrimary, { backgroundColor: theme.primary }]} 
          onPress={() => setShowChat(true)}
        >
          <Text style={styles.actionIconPrimary}>💬</Text>
          <Text style={styles.actionTextPrimary}>Send Message</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showChat} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShowChat(false)}>
        <ChatScreen chat={profile} onClose={() => setShowChat(false)} />
      </Modal>

      <Modal visible={showFullscreen} animationType="fade" presentationStyle="fullScreen" onRequestClose={() => setShowFullscreen(false)}>
        <View style={styles.fullscreenContainer}>
          <FlatList
            ref={fullscreenScrollRef}
            data={photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={currentPhotoIndex}
            getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentPhotoIndex(index);
            }}
            renderItem={({ item }) => (
              <TouchableOpacity activeOpacity={1} onPress={() => setShowFullscreen(false)} style={{ width, height: '100%', justifyContent: 'center' }}>
                {item ? (
                  <Image source={{ uri: item }} style={styles.fullscreenImage} resizeMode="contain" />
                ) : (
                  <Avatar photo={item} name={profile.name} fullscreen={true} />
                )}
              </TouchableOpacity>
            )}
            keyExtractor={(item, index) => `fullscreen-${index}`}
          />
          <TouchableOpacity style={styles.fullscreenCloseBtn} onPress={() => setShowFullscreen(false)}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          {photos.length > 1 && (
            <View style={styles.fullscreenIndicator}>
              {photos.map((_, index) => (
                <View
                  key={index}
                  style={[styles.dot, { backgroundColor: index === currentPhotoIndex ? '#fff' : 'rgba(255,255,255,0.4)' }]}
                />
              ))}
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroSection: { position: 'relative', height: 420, backgroundColor: '#1a1a1a' },
  photoImage: { width: '100%', height: 420, resizeMode: 'cover' },
  photoIndicator: { position: 'absolute', bottom: 20, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  fullscreenContainer: { flex: 1, backgroundColor: '#000' },
  fullscreenImage: { width: '100%', height: '100%' },
  fullscreenCloseBtn: { position: 'absolute', top: STATUS_BAR_HEIGHT + 10, right: 20, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  fullscreenIndicator: { position: 'absolute', bottom: 40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, padding: 20, paddingTop: STATUS_BAR_HEIGHT + 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  statusPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  profileCard: { marginTop: -40, borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingHorizontal: 24, paddingTop: 28 },
  headerSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  profileName: { fontSize: 34, fontWeight: '900', marginBottom: 12, letterSpacing: -0.5 },
  tagRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tag: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  tagText: { fontSize: 13, fontWeight: '700' },
  heartBtn: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 },
  heartIcon: { fontSize: 26 },
  bioCard: { padding: 24, borderRadius: 24, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  bioTitle: { fontSize: 32, fontWeight: '800', opacity: 0.2, lineHeight: 32 },
  bioContent: { fontSize: 17, lineHeight: 28, marginVertical: 12, letterSpacing: 0.2 },
  detailsCard: { padding: 24, borderRadius: 24, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  detailsTitle: { fontSize: 22, fontWeight: '800', marginBottom: 24, letterSpacing: -0.3 },
  detailRow: { gap: 24 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 18, paddingVertical: 8 },
  detailIcon: { fontSize: 36, width: 48, textAlign: 'center' },
  detailLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
  actionBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 20, gap: 12, paddingBottom: 32, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10 },
  actionBtnSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 24, gap: 8, borderWidth: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  actionIconSecondary: { fontSize: 22, fontWeight: '800' },
  actionTextSecondary: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  actionBtnPrimary: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 24, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 10 },
  actionIconPrimary: { fontSize: 22 },
  actionTextPrimary: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: -0.2 }
});
