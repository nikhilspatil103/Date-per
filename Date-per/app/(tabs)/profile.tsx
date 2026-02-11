import API_URL from '../../config/api';
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, StatusBar, Modal, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { authAPI } from '../../services/auth';
import Avatar from '../../components/Avatar';
import EditProfileScreen from '../../components/EditProfileScreen';
import CoinsScreen from '../../components/CoinsScreen';
import Toast from '../../components/Toast';
import { useTheme } from '../../contexts/ThemeContext';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function ProfileScreen({ onLogout }: { onLogout: () => void }) {
  const { theme } = useTheme();
  const [coins, setCoins] = useState(100);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showCoins, setShowCoins] = useState(false);
  const [showFullPhoto, setShowFullPhoto] = useState(false);
  const [name, setName] = useState('User Name');
  const [email, setEmail] = useState('user@example.com');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [likesCount, setLikesCount] = useState(0);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });

  useEffect(() => {
    loadUserData();
    loadCoins();
  }, []);

  const loadUserData = async () => {
    const userName = await AsyncStorage.getItem('userName');
    const userEmail = await AsyncStorage.getItem('userEmail');
    const userPhoto = await AsyncStorage.getItem('userProfilePhoto');
    if (userName) setName(userName);
    if (userEmail) setEmail(userEmail);
    if (userPhoto) setProfilePhoto(userPhoto);
    
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setLikesCount(data.likesCount || 0);
    } catch (err) {
      console.log('Failed to load likes count:', err);
    }
  };

  const loadCoins = async () => {
    const savedCoins = await AsyncStorage.getItem('userCoins');
    if (savedCoins) {
      setCoins(parseInt(savedCoins));
    } else {
      await AsyncStorage.setItem('userCoins', '100');
    }
  };

  const handleCloseEdit = async () => {
    setShowEditProfile(false);
    await loadUserData();
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
  };

  const pickProfileImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast('Permission denied', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setProfilePhoto(uri);
      try {
        await authAPI.updateProfile({ profilePhoto: uri });
        await AsyncStorage.setItem('userProfilePhoto', uri);
        showToast('Profile photo updated! ✨');
      } catch (err) {
        showToast('Update failed', 'error');
      }
    }
  };

  const handleAvatarPress = () => {
    if (profilePhoto) {
      setShowFullPhoto(true);
    } else {
      pickProfileImage();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Toast 
        message={toast.message} 
        type={toast.type} 
        visible={toast.visible} 
        onHide={() => setToast({ ...toast, visible: false })} 
      />
      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>My Profile</Text>
        <TouchableOpacity style={styles.settingsBtn}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.profileGrad}>
            <TouchableOpacity style={styles.avatarWrapper} onPress={handleAvatarPress} onLongPress={pickProfileImage}>
              <Avatar photo={profilePhoto} name={name} size={120} />
              <View style={styles.editBadge}>
                <Text style={styles.editBadgeText}>✏️</Text>
              </View>
            </TouchableOpacity>
            <Text style={[styles.profileName, { color: theme.text }]}>{name}</Text>
            <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>{email}</Text>
            <View style={[styles.completionBar, { backgroundColor: theme.border }]}>
              <View style={styles.completionFill} />
            </View>
            <Text style={[styles.completionText, { color: theme.textSecondary }]}>30% Profile Completed</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.statGrad}>
              <Text style={styles.statIcon}>💰</Text>
              <Text style={styles.statValue}>{coins}</Text>
              <Text style={styles.statLabel}>Coins</Text>
            </View>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.statGrad2}>
              <Text style={styles.statIcon}>❤️</Text>
              <Text style={styles.statValue}>{likesCount}</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.statGrad3}>
              <Text style={styles.statIcon}>👥</Text>
              <Text style={styles.statValue}>42</Text>
              <Text style={styles.statLabel}>Matches</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setShowEditProfile(true)}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionEmoji}>✏️</Text>
            </View>
            <View style={styles.actionInfo}>
              <Text style={[styles.actionTitle, { color: theme.text }]}>Edit Profile</Text>
              <Text style={[styles.actionDesc, { color: theme.textSecondary }]}>Update your information</Text>
            </View>
            <Text style={[styles.actionArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setShowCoins(true)}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionEmoji}>💰</Text>
            </View>
            <View style={styles.actionInfo}>
              <Text style={[styles.actionTitle, { color: theme.text }]}>My Coins</Text>
              <Text style={[styles.actionDesc, { color: theme.textSecondary }]}>{coins} coins available</Text>
            </View>
            <Text style={[styles.actionArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionEmoji}>⭐</Text>
            </View>
            <View style={styles.actionInfo}>
              <Text style={[styles.actionTitle, { color: theme.text }]}>Boost Profile</Text>
              <Text style={[styles.actionDesc, { color: theme.textSecondary }]}>Get more visibility</Text>
            </View>
            <Text style={[styles.actionArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Premium Features</Text>
          <View style={styles.vipCard}>
            <View style={styles.vipGrad}>
              <Text style={styles.vipIcon}>👑</Text>
              <Text style={styles.vipTitle}>Upgrade to VIP</Text>
              <Text style={styles.vipDesc}>Unlock all premium features</Text>
              <TouchableOpacity style={styles.vipBtn}>
                <Text style={styles.vipBtnText}>Get VIP Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={showEditProfile} animationType="slide" presentationStyle="fullScreen" onRequestClose={handleCloseEdit}>
        <EditProfileScreen onClose={handleCloseEdit} />
      </Modal>

      <Modal visible={showCoins} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => { setShowCoins(false); loadCoins(); }}>
        <CoinsScreen onClose={() => { setShowCoins(false); loadCoins(); }} />
      </Modal>

      <Modal visible={showFullPhoto} transparent animationType="fade">
        <View style={[styles.fullPhotoModal, { backgroundColor: theme.overlay }]}>
          <TouchableOpacity style={styles.fullPhotoOverlay} onPress={() => setShowFullPhoto(false)} />
          <View style={styles.fullPhotoContainer}>
            <TouchableOpacity style={styles.closeFullPhoto} onPress={() => setShowFullPhoto(false)}>
              <Text style={styles.closeFullPhotoText}>✕</Text>
            </TouchableOpacity>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.fullPhotoImage} resizeMode="contain" />
            ) : (
              <Avatar photo={profilePhoto} name={name} size={300} />
            )}
            <TouchableOpacity style={styles.changePhotoBtn} onPress={() => { setShowFullPhoto(false); pickProfileImage(); }}>
              <Text style={styles.changePhotoBtnText}>Change Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  headerTitle: { fontSize: 24, fontWeight: '800' },
  settingsBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  settingsIcon: { fontSize: 24 },
  profileCard: { margin: 20, borderRadius: 24, overflow: 'hidden', borderWidth: 1 },
  profileGrad: { padding: 30, alignItems: 'center', backgroundColor: 'transparent' },
  avatarWrapper: { position: 'relative', marginBottom: 16 },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#FF6B9D', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  editBadgeText: { fontSize: 16 },
  profileName: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  profileEmail: { fontSize: 14, marginBottom: 16 },
  completionBar: { width: '100%', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  completionFill: { width: '30%', height: '100%', backgroundColor: '#FF6B9D' },
  completionText: { fontSize: 12 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  statGrad: { padding: 16, alignItems: 'center', gap: 6, backgroundColor: '#667eea' },
  statGrad2: { padding: 16, alignItems: 'center', gap: 6, backgroundColor: '#4ECDC4' },
  statGrad3: { padding: 16, alignItems: 'center', gap: 6, backgroundColor: '#f093fb' },
  statIcon: { fontSize: 28 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.9)' },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  actionCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1 },
  actionIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#667eea', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  actionEmoji: { fontSize: 24 },
  actionInfo: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  actionDesc: { fontSize: 12 },
  actionArrow: { fontSize: 24 },
  vipCard: { borderRadius: 20, overflow: 'hidden', backgroundColor: 'rgba(255,215,0,0.15)', borderWidth: 2, borderColor: '#FFD700' },
  vipGrad: { padding: 24, alignItems: 'center', backgroundColor: 'transparent' },
  vipIcon: { fontSize: 48, marginBottom: 12 },
  vipTitle: { fontSize: 22, fontWeight: '800', color: '#FFD700', marginBottom: 8 },
  vipDesc: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 16 },
  vipBtn: { backgroundColor: '#FFD700', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  vipBtnText: { fontSize: 15, color: '#000', fontWeight: '700' },
  logoutBtn: { marginHorizontal: 20, backgroundColor: 'rgba(255,68,68,0.15)', padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#ff4444' },
  logoutText: { color: '#ff4444', fontSize: 16, fontWeight: '700' },
  fullPhotoModal: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fullPhotoOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  fullPhotoContainer: { width: '90%', alignItems: 'center' },
  closeFullPhoto: { position: 'absolute', top: -50, right: 0, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  closeFullPhotoText: { fontSize: 24, color: '#fff', fontWeight: 'bold' },
  fullPhotoImage: { width: '100%', height: 400, borderRadius: 20 },
  changePhotoBtn: { marginTop: 20, backgroundColor: '#667eea', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25 },
  changePhotoBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
