import API_URL from '../config/api';
import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, StatusBar, Modal, Dimensions, BackHandler, FlatList, Image, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ChatScreen from './ChatScreen';
import AvatarV3 from '../components/AvatarV3';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function UserProfileDetailScreen({ profile, onClose, onLikeUpdate, isOwnProfile }: { profile: any; onClose: () => void; onLikeUpdate?: (liked: boolean, count: number) => void; isOwnProfile?: boolean }) {
  const { theme } = useTheme();
  const [showChat, setShowChat] = useState(false);
  const [isContact, setIsContact] = useState(false);
  const [isLiked, setIsLiked] = useState(profile.isLiked || false);
  const [likesCount, setLikesCount] = useState(profile.likesCount || 0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [customReportReason, setCustomReportReason] = useState('');
  const [fullProfile, setFullProfile] = useState(profile);
  const photoScrollRef = useRef<FlatList>(null);
  const fullscreenScrollRef = useRef<FlatList>(null);
  const autoScrollInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const photos = (() => {
    const allPhotos = [];
    if (fullProfile.photo) allPhotos.push(fullProfile.photo);
    if (fullProfile.photos && fullProfile.photos.length > 0) {
      allPhotos.push(...fullProfile.photos);
    }
    return allPhotos.length > 0 ? allPhotos : [fullProfile.photo];
  })();

  useEffect(() => {
    let isMounted = true;
    
    const loadProfileData = async () => {
      if (isMounted) {
        await Promise.all([checkIfContact(), fetchFullProfile()]);
      }
    };
    
    loadProfileData();
    
    if (photos.length > 1) {
      const timer = setTimeout(() => {
        autoScrollInterval.current = setInterval(() => {
          setCurrentPhotoIndex(prev => {
            const next = (prev + 1) % photos.length;
            photoScrollRef.current?.scrollToIndex({ index: next, animated: true });
            return next;
          });
        }, 3000);
      }, 1000);
      
      return () => {
        clearTimeout(timer);
        isMounted = false;
      };
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
      isMounted = false;
      if (autoScrollInterval.current) clearInterval(autoScrollInterval.current);
      backHandler.remove();
    };
  }, []);

  const fetchFullProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/profile/${profile._id || profile.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        console.log('Profile API not available, using existing data');
        return;
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('FULL PROFILE DATA:', data);
        setFullProfile(data);
      }
    } catch (error) {
      console.log('Profile API not available:', error);
    }
  };

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
      await fetch(`${API_URL}${endpoint}`, {
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
    const newLiked = !isLiked;
    const newCount = newLiked ? likesCount + 1 : likesCount - 1;
    setIsLiked(newLiked);
    setLikesCount(newCount);
    onLikeUpdate?.(newLiked, newCount);
    
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
      setIsLiked(!newLiked);
      setLikesCount(likesCount);
      onLikeUpdate?.(!newLiked, likesCount);
    }
  };

  const blockUser = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      await fetch(`${API_URL}/api/messages/block/${profile._id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowMenu(false);
      alert('User blocked successfully');
      onClose();
    } catch (error) {
      console.error('Block user error:', error);
      alert('Failed to block user');
    }
  };

  const submitReport = async () => {
    const finalReason = reportReason === 'Other' ? customReportReason : reportReason;
    if (!finalReason.trim()) {
      alert('Please provide a reason');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('authToken');
      await fetch(`${API_URL}/api/messages/report/${profile._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: finalReason })
      });
      setShowReportModal(false);
      setShowMenu(false);
      setReportReason('');
      setCustomReportReason('');
      alert('Report submitted successfully');
    } catch (error) {
      console.error('Report user error:', error);
      alert('Failed to submit report');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity style={styles.fixedCloseBtn} onPress={onClose}>
        <Text style={styles.closeBtnText}>✕</Text>
      </TouchableOpacity>
      {!isOwnProfile && (
        <TouchableOpacity style={styles.fixedMenuBtn} onPress={() => setShowMenu(true)}>
          <Text style={styles.closeBtnText}>⋮</Text>
        </TouchableOpacity>
      )}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <FlatList
            ref={photoScrollRef}
            data={photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={2}
            windowSize={3}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentPhotoIndex(index);
            }}
            renderItem={({ item }) => (
              <TouchableOpacity activeOpacity={0.9} onPress={() => setShowFullscreen(true)} style={{ width, height: 420, justifyContent: 'center', alignItems: 'center' }}>
                {item ? (
                  <Image source={{ uri: item }} style={styles.photoImage} />
                ) : (
                  <AvatarV3 photo={item} name={profile.name} size={200} />
                )}
              </TouchableOpacity>
            )}
            keyExtractor={(item, index) => index.toString()}
          />
          {profile.online && (
            <View style={[styles.statusPill, { backgroundColor: theme.online }]}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Active now</Text>
            </View>
          )}
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
              <Text style={[styles.profileName, { color: theme.text }]}>{fullProfile.name}</Text>
              <View style={styles.tagRow}>
                <View style={[styles.tag, { backgroundColor: theme.primary + '15' }]}>
                  <Text style={[styles.tagText, { color: theme.primary }]}>{fullProfile.age} years</Text>
                </View>
                <View style={[styles.tag, { backgroundColor: theme.primary + '15' }]}>
                  <Text style={[styles.tagText, { color: theme.primary }]}>📍 {fullProfile.distance}</Text>
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

          {fullProfile.bio && (
            <View style={[styles.bioCard, { backgroundColor: theme.card }]}>
              <Text style={[styles.bioContent, { color: theme.textSecondary }]}>{fullProfile.bio}</Text>
            </View>
          )}

          {fullProfile.interests && fullProfile.interests.length > 0 && (
            <View style={[styles.detailsCard, { backgroundColor: theme.card }]}>
              <Text style={[styles.detailsTitle, { color: theme.text }]}>Interests</Text>
              <View style={styles.interestsRow}>
                {fullProfile.interests.map((interest: string, index: number) => (
                  <View key={index} style={[styles.interestTag, { backgroundColor: theme.primary + '15' }]}>
                    <Text style={[styles.interestText, { color: theme.primary }]}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={[styles.detailsCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.detailsTitle, { color: theme.text }]}>About</Text>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>👤</Text>
                <View>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Gender</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{fullProfile.gender}</Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>📏</Text>
                <View>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Height</Text>
                  <Text style={[styles.detailValue, { color: theme.text, opacity: fullProfile.height ? 1 : 0.4 }]}>{fullProfile.height ? `${fullProfile.height} cm` : 'Not mentioned'}</Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>💪</Text>
                <View>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Body Type</Text>
                  <Text style={[styles.detailValue, { color: theme.text, opacity: fullProfile.bodyType ? 1 : 0.4 }]}>{fullProfile.bodyType || 'Not mentioned'}</Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>💕</Text>
                <View>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Looking for</Text>
                  <Text style={[styles.detailValue, { color: theme.text, opacity: fullProfile.lookingFor ? 1 : 0.4 }]}>{fullProfile.lookingFor || 'Not mentioned'}</Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>💑</Text>
                <View>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Status</Text>
                  <Text style={[styles.detailValue, { color: theme.text, opacity: fullProfile.relationshipStatus ? 1 : 0.4 }]}>{fullProfile.relationshipStatus || 'Not mentioned'}</Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>👶</Text>
                <View>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Kids</Text>
                  <Text style={[styles.detailValue, { color: theme.text, opacity: fullProfile.kids ? 1 : 0.4 }]}>{fullProfile.kids || 'Not mentioned'}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.detailsCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.detailsTitle, { color: theme.text }]}>Lifestyle</Text>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>🚬</Text>
                <View>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Smoking</Text>
                  <Text style={[styles.detailValue, { color: theme.text, opacity: fullProfile.smoking ? 1 : 0.4 }]}>{fullProfile.smoking || 'Not mentioned'}</Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>🍷</Text>
                <View>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Drinking</Text>
                  <Text style={[styles.detailValue, { color: theme.text, opacity: fullProfile.drinking ? 1 : 0.4 }]}>{fullProfile.drinking || 'Not mentioned'}</Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>🏃</Text>
                <View>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Exercise</Text>
                  <Text style={[styles.detailValue, { color: theme.text, opacity: fullProfile.exercise ? 1 : 0.4 }]}>{fullProfile.exercise || 'Not mentioned'}</Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>🥗</Text>
                <View>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Diet</Text>
                  <Text style={[styles.detailValue, { color: theme.text, opacity: fullProfile.diet ? 1 : 0.4 }]}>{fullProfile.diet || 'Not mentioned'}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.detailsCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.detailsTitle, { color: theme.text }]}>Work & Education</Text>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>💼</Text>
                <View>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Occupation</Text>
                  <Text style={[styles.detailValue, { color: theme.text, opacity: fullProfile.occupation ? 1 : 0.4 }]}>{fullProfile.occupation || 'Not mentioned'}</Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>🏢</Text>
                <View>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Company</Text>
                  <Text style={[styles.detailValue, { color: theme.text, opacity: fullProfile.company ? 1 : 0.4 }]}>{fullProfile.company || 'Not mentioned'}</Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>🎓</Text>
                <View>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Education</Text>
                  <Text style={[styles.detailValue, { color: theme.text, opacity: fullProfile.graduation ? 1 : 0.4 }]}>{fullProfile.graduation || 'Not mentioned'}</Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>🏫</Text>
                <View>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>School</Text>
                  <Text style={[styles.detailValue, { color: theme.text, opacity: fullProfile.school ? 1 : 0.4 }]}>{fullProfile.school || 'Not mentioned'}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.detailsCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.detailsTitle, { color: theme.text }]}>Location & Languages</Text>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>🏠</Text>
                <View>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Hometown</Text>
                  <Text style={[styles.detailValue, { color: theme.text, opacity: fullProfile.hometown ? 1 : 0.4 }]}>{fullProfile.hometown || 'Not mentioned'}</Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>📍</Text>
                <View>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Lives in</Text>
                  <Text style={[styles.detailValue, { color: theme.text, opacity: fullProfile.currentCity ? 1 : 0.4 }]}>{fullProfile.currentCity || 'Not mentioned'}</Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>🗣️</Text>
                <View>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Languages</Text>
                  <Text style={[styles.detailValue, { color: theme.text, opacity: fullProfile.languages && fullProfile.languages.length > 0 ? 1 : 0.4 }]}>{fullProfile.languages && fullProfile.languages.length > 0 ? fullProfile.languages.join(', ') : 'Not mentioned'}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>
      
      {!isOwnProfile && (
        <View style={[styles.actionBar]}>
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
      )}

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
            removeClippedSubviews={true}
            maxToRenderPerBatch={2}
            windowSize={3}
            initialScrollIndex={currentPhotoIndex}
            getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentPhotoIndex(index);
            }}
            renderItem={({ item }) => (
              <TouchableOpacity activeOpacity={1} onPress={() => setShowFullscreen(false)} style={{ width, height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                {item ? (
                  <Image source={{ uri: item }} style={styles.fullscreenImage} resizeMode="contain" />
                ) : (
                  <AvatarV3 photo={item} name={profile.name} size={300} />
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

      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <View style={styles.menuModal}>
          <TouchableOpacity style={styles.menuOverlay} onPress={() => setShowMenu(false)} />
          <View style={[styles.menuContent, { backgroundColor: theme.card }]}>
            <TouchableOpacity style={styles.menuOption} onPress={blockUser}>
              <Text style={styles.menuOptionIcon}>🚫</Text>
              <Text style={[styles.menuOptionText, { color: theme.text }]}>Block User</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuOption} onPress={() => { setShowMenu(false); setShowReportModal(true); }}>
              <Text style={styles.menuOptionIcon}>⚠️</Text>
              <Text style={[styles.menuOptionText, { color: theme.text }]}>Report User</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuCancel} onPress={() => setShowMenu(false)}>
              <Text style={[styles.menuCancelText, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showReportModal} transparent animationType="slide" onRequestClose={() => setShowReportModal(false)}>
        <View style={styles.reportModalOverlay}>
          <View style={[styles.reportModalContent, { backgroundColor: theme.card }]}>
            <View style={styles.reportHeader}>
              <Text style={[styles.reportTitle, { color: theme.text }]}>Report User</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <Text style={[styles.reportClose, { color: theme.text }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.reportLabel, { color: theme.textSecondary }]}>Select a reason or describe the issue:</Text>
            <View style={styles.reportReasons}>
              {['Spam', 'Harassment', 'Inappropriate content', 'Fake profile', 'Other'].map((reason) => (
                <TouchableOpacity key={reason} style={[styles.reportReasonBtn, reportReason === reason && { backgroundColor: '#667eea' }]} onPress={() => setReportReason(reason)}>
                  <Text style={[styles.reportReasonText, { color: reportReason === reason ? '#fff' : theme.text }]}>{reason}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {reportReason === 'Other' && (
              <TextInput
                style={[styles.reportInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                placeholder="Describe the issue..."
                placeholderTextColor={theme.textSecondary}
                value={customReportReason}
                onChangeText={setCustomReportReason}
                multiline
              />
            )}
            <TouchableOpacity style={[styles.reportSubmitBtn, { backgroundColor: '#667eea' }]} onPress={submitReport}>
              <Text style={styles.reportSubmitText}>Submit Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fixedCloseBtn: { position: 'absolute', top: STATUS_BAR_HEIGHT + 10, left: 20, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  fixedMenuBtn: { position: 'absolute', top: STATUS_BAR_HEIGHT + 10, right: 20, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  heroSection: { position: 'relative', height: 420, backgroundColor: '#1a1a1a' },
  photoImage: { width: '100%', height: 420, resizeMode: 'cover', backgroundColor: '#1a1a1a' },
  photoIndicator: { position: 'absolute', bottom: 20, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  fullscreenContainer: { flex: 1, backgroundColor: '#000' },
  fullscreenImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  fullscreenCloseBtn: { position: 'absolute', top: STATUS_BAR_HEIGHT + 10, right: 20, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  fullscreenIndicator: { position: 'absolute', bottom: 40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  statusPill: { position: 'absolute', top: STATUS_BAR_HEIGHT + 10, right: 20, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  closeBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  profileCard: { marginTop: -40, borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingHorizontal: 24, paddingTop: 28 },
  headerSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  profileName: { fontSize: 34, fontWeight: '900', marginBottom: 12, letterSpacing: -0.5 },
  tagRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tag: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  tagText: { fontSize: 13, fontWeight: '700' },
  heartBtn: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 },
  heartIcon: { fontSize: 26 },
  bioCard: { padding: 12, borderRadius: 24, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  bioTitle: { fontSize: 32, fontWeight: '800', opacity: 0.2, lineHeight: 32 },
  bioContent: { fontSize: 17, lineHeight: 28, marginVertical: 12, letterSpacing: 0.2 },
  interestsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  interestTag: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  interestText: { fontSize: 14, fontWeight: '600' },
  detailsCard: { padding: 24, borderRadius: 24, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  detailsTitle: { fontSize: 22, fontWeight: '800', marginBottom: 24, letterSpacing: -0.3 },
  detailRow: { gap: 24 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 18, paddingVertical: 8 },
  detailIcon: { fontSize: 36, width: 48, textAlign: 'center' },
  detailLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
  actionBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 20, gap: 12, paddingBottom: 32, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10 },
  actionBtnSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, gap: 8, borderWidth: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  actionIconSecondary: { fontSize: 20, fontWeight: '700' },
  actionTextSecondary: { fontSize: 15, fontWeight: '700' },
  actionBtnPrimary: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 8 },
  actionIconPrimary: { fontSize: 20 },
  actionTextPrimary: { color: '#fff', fontSize: 15, fontWeight: '700' },
  menuModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  menuOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  menuContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  menuOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  menuOptionIcon: { fontSize: 24, marginRight: 12 },
  menuOptionText: { fontSize: 16, fontWeight: '600' },
  menuCancel: { paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  menuCancelText: { fontSize: 16, fontWeight: '600' },
  reportModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  reportModalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  reportTitle: { fontSize: 20, fontWeight: '800' },
  reportClose: { fontSize: 24 },
  reportLabel: { fontSize: 14, marginBottom: 12 },
  reportReasons: { marginBottom: 16 },
  reportReasonBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.1)' },
  reportReasonText: { fontSize: 15, fontWeight: '600' },
  reportInput: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 16, minHeight: 80, textAlignVertical: 'top' },
  reportSubmitBtn: { paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  reportSubmitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
