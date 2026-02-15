import API_URL from '../../config/api';
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, StatusBar, Modal, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { authAPI } from '../../services/auth';
import AvatarV3 from '../../components/AvatarV3';
import HeartLoader from '../../components/HeartLoader';
import EditProfileScreen from '../../components/EditProfileScreen';
import CoinsScreen from '../../components/CoinsScreen';
import BuyCoinsScreen from '../../components/BuyCoinsScreen';
import PrivacyPolicyScreen from '../../components/PrivacyPolicyScreen';
import TermsScreen from '../../components/TermsScreen';
import AboutScreen from '../../components/AboutScreen';
import DeleteAccountScreen from '../../components/DeleteAccountScreen';
import BlockedUsersScreen from '../../components/BlockedUsersScreen';
import UserProfileDetailScreen from '../../components/UserProfileDetailScreen';
import Toast from '../../components/Toast';
import CustomAlert from '../../components/CustomAlert';
import { useAlert, Alert } from '../../hooks/useAlert';
import { useTheme } from '../../contexts/ThemeContext';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function ProfileScreen({ onLogout }: { onLogout: () => void }) {
  const { theme } = useTheme();
  const { alertConfig, visible, showAlert, hideAlert } = useAlert();
  const [coins, setCoins] = useState(100);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showCoins, setShowCoins] = useState(false);
  const [showBuyCoins, setShowBuyCoins] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [showFullPhoto, setShowFullPhoto] = useState(false);
  const [showMyProfile, setShowMyProfile] = useState(false);
  const [myProfileData, setMyProfileData] = useState<any>(null);
  const [name, setName] = useState('User Name');
  const [email, setEmail] = useState('user@example.com');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [likesCount, setLikesCount] = useState(0);
  const [deletionScheduledAt, setDeletionScheduledAt] = useState<string | null>(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });
  const [loading, setLoading] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState(0);

  useEffect(() => {
    loadUserData();
  }, []);

  const calculateProfileCompletion = (userData: any) => {
    const fields = [
      userData.name,
      userData.email,
      userData.profilePhoto,
      userData.bio,
      userData.height,
      userData.bodyType,
      userData.smoking,
      userData.drinking,
      userData.exercise,
      userData.diet,
      userData.occupation,
      userData.company,
      userData.graduation,
      userData.school,
      userData.hometown,
      userData.currentCity,
      userData.lookingFor,
      userData.relationshipStatus,
      userData.kids,
      userData.interests?.length > 0,
      userData.languages?.length > 0,
    ];
    
    const filledFields = fields.filter(field => field && field !== '').length;
    return Math.round((filledFields / fields.length) * 100);
  };
  const loadUserData = async () => {
    try {
      setLoading(true);
      const userName = await AsyncStorage.getItem('userName');
      const userEmail = await AsyncStorage.getItem('userEmail');
      const userPhoto = await AsyncStorage.getItem('userProfilePhoto');
      if (userName) setName(userName);
      if (userEmail) setEmail(userEmail);
      if (userPhoto) setProfilePhoto(userPhoto);
      
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setLikesCount(data.likesCount || 0);
      setDeletionScheduledAt(data.deletionScheduledAt || null);
      setMyProfileData(data);
      
      // Calculate profile completion
      const completion = calculateProfileCompletion(data);
      setProfileCompletion(completion);
      
      // Update coins
      if (data.coins !== undefined) {
        setCoins(data.coins);
        await AsyncStorage.setItem('userCoins', data.coins.toString());
      }
    } catch (err) {
      console.log('Failed to load user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCoins = async () => {
    try {
      const storedCoins = await AsyncStorage.getItem('userCoins');
      if (storedCoins) {
        setCoins(parseInt(storedCoins));
      }
    } catch (err) {
      console.log('Failed to load coins:', err);
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  const handleDeleteAccount = async (reason: string, feedback: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/auth/account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason, feedback })
      });

      if (response.ok) {
        const data = await response.json();
        setShowDeleteAccount(false);
        setDeletionScheduledAt(data.deletionDate);
        showToast('Account will be deleted in 24 hours');
        await loadUserData();
      } else {
        showToast('Failed to schedule deletion', 'error');
      }
    } catch (error) {
      showToast('Error scheduling deletion', 'error');
    }
  };

  const handleCancelDeletion = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/auth/cancel-deletion`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setDeletionScheduledAt(null);
        showToast('Account deletion cancelled');
      } else {
        showToast('Failed to cancel deletion', 'error');
      }
    } catch (error) {
      showToast('Error cancelling deletion', 'error');
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
        <TouchableOpacity style={styles.settingsBtn} onPress={() => setShowSettings(true)}>
          <Text style={styles.settingsIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {loading ? (
          <HeartLoader message="Loading profile..." subtext="" />
        ) : (
          <>
        <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.profileGrad}>
            <TouchableOpacity style={styles.avatarWrapper} onPress={handleAvatarPress} onLongPress={pickProfileImage}>
              <AvatarV3 photo={profilePhoto} name={name} size={120} />
              <View style={styles.editBadge}>
                <Text style={styles.editBadgeText}>✏️</Text>
              </View>
            </TouchableOpacity>
            <Text style={[styles.profileName, { color: theme.text }]}>{name}</Text>
            <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>{email}</Text>
            <View style={[styles.completionBar, { backgroundColor: theme.border }]}>
              <View style={[styles.completionFill, { width: `${profileCompletion}%`, backgroundColor: '#FF6B9D' }]} />
            </View>
            <Text style={[styles.completionText, { color: theme.textSecondary }]}>{profileCompletion}% Profile Completed</Text>
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
          <TouchableOpacity style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => myProfileData && setShowMyProfile(true)}>
            <View style={styles.statGrad3}>
              <Text style={styles.statIcon}>👤</Text>
              <Text style={styles.statValue}>View</Text>
              <Text style={styles.statLabel}>My Profile</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
          {deletionScheduledAt && (
            <View style={[styles.deletionWarningCard, { backgroundColor: theme.card, borderColor: '#ff4444' }]}>
              <View style={styles.deletionWarningHeader}>
                <View style={styles.deletionIconContainer}>
                  <Text style={styles.deletionWarningIcon}>⏳</Text>
                </View>
                <View style={styles.deletionWarningContent}>
                  <Text style={[styles.deletionWarningTitle, { color: '#ff4444' }]}>Account Deletion Pending</Text>
                  <Text style={[styles.deletionWarningSubtitle, { color: theme.textSecondary }]}>Your account will be permanently deleted</Text>
                </View>
              </View>
              <View style={[styles.deletionTimeBox, { backgroundColor: 'rgba(255,68,68,0.1)' }]}>
                <View style={styles.deletionTimeRow}>
                  <Text style={styles.deletionTimeIcon}>📅</Text>
                  <View style={styles.deletionTimeInfo}>
                    <Text style={[styles.deletionTimeLabel, { color: theme.textSecondary }]}>Deletion Date</Text>
                    <Text style={[styles.deletionTimeValue, { color: theme.text }]}>{new Date(deletionScheduledAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                  </View>
                </View>
                <View style={styles.deletionTimeRow}>
                  <Text style={styles.deletionTimeIcon}>⏰</Text>
                  <View style={styles.deletionTimeInfo}>
                    <Text style={[styles.deletionTimeLabel, { color: theme.textSecondary }]}>Time</Text>
                    <Text style={[styles.deletionTimeValue, { color: theme.text }]}>{new Date(deletionScheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.cancelDeletionBtn} onPress={handleCancelDeletion}>
                <Text style={styles.cancelDeletionIcon}>✕</Text>
                <Text style={styles.cancelDeletionText}>Cancel Account Deletion</Text>
              </TouchableOpacity>
            </View>
          )}
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
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setShowBuyCoins(true)}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionEmoji}>🛍️</Text>
            </View>
            <View style={styles.actionInfo}>
              <Text style={[styles.actionTitle, { color: theme.text }]}>Buy Coins</Text>
              <Text style={[styles.actionDesc, { color: theme.textSecondary }]}>Get more coins to chat</Text>
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
              <TouchableOpacity style={styles.vipBtn} onPress={() => showAlert(Alert.comingSoon())}>
                <Text style={styles.vipBtnText}>Get VIP Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
          </>
        )}
      </ScrollView>

      <Modal visible={showEditProfile} animationType="slide" presentationStyle="fullScreen" onRequestClose={handleCloseEdit}>
        <EditProfileScreen onClose={handleCloseEdit} />
      </Modal>

      <Modal visible={showCoins} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => { setShowCoins(false); loadCoins(); }}>
        <CoinsScreen onClose={() => { setShowCoins(false); loadCoins(); }} />
      </Modal>

      <Modal visible={showBuyCoins} animationType="slide">
        <BuyCoinsScreen onClose={() => { setShowBuyCoins(false); loadCoins(); }} currentCoins={coins} />
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
              <AvatarV3 photo={profilePhoto} name={name} size={300} />
            )}
            <TouchableOpacity style={styles.changePhotoBtn} onPress={() => { setShowFullPhoto(false); pickProfileImage(); }}>
              <Text style={styles.changePhotoBtnText}>Change Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showSettings} animationType="slide" transparent>
        <View style={styles.settingsModal}>
          <TouchableOpacity style={styles.settingsOverlay} onPress={() => setShowSettings(false)} />
          <View style={[styles.settingsContent, { backgroundColor: theme.card }]}>
            <View style={[styles.settingsHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.settingsTitle, { color: theme.text }]}>Settings</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Text style={[styles.settingsClose, { color: theme.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.settingsItem, { borderBottomColor: theme.border }]} onPress={() => { setShowSettings(false); setShowPrivacy(true); }}>
              <Text style={styles.settingsItemIcon}>🔒</Text>
              <Text style={[styles.settingsItemText, { color: theme.text }]}>Privacy Policy</Text>
              <Text style={[styles.settingsItemArrow, { color: theme.textSecondary }]}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.settingsItem, { borderBottomColor: theme.border }]} onPress={() => { setShowSettings(false); setShowTerms(true); }}>
              <Text style={styles.settingsItemIcon}>📜</Text>
              <Text style={[styles.settingsItemText, { color: theme.text }]}>Terms & Conditions</Text>
              <Text style={[styles.settingsItemArrow, { color: theme.textSecondary }]}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.settingsItem, { borderBottomColor: theme.border }]} onPress={() => { setShowSettings(false); setShowBlockedUsers(true); }}>
              <Text style={styles.settingsItemIcon}>🚫</Text>
              <Text style={[styles.settingsItemText, { color: theme.text }]}>Blocked Users</Text>
              <Text style={[styles.settingsItemArrow, { color: theme.textSecondary }]}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsItem} onPress={() => { setShowSettings(false); setShowAbout(true); }}>
              <Text style={styles.settingsItemIcon}>ℹ️</Text>
              <Text style={[styles.settingsItemText, { color: theme.text }]}>About</Text>
              <Text style={[styles.settingsItemArrow, { color: theme.textSecondary }]}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.settingsItem, { borderTopWidth: 1, borderTopColor: theme.border }]} onPress={() => { setShowSettings(false); setShowDeleteAccount(true); }}>
              <Text style={styles.settingsItemIcon}>🗑️</Text>
              <Text style={[styles.settingsItemText, { color: '#ff4444' }]}>Delete Account</Text>
              <Text style={[styles.settingsItemArrow, { color: theme.textSecondary }]}>›</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showPrivacy} animationType="slide">
        <PrivacyPolicyScreen onClose={() => setShowPrivacy(false)} />
      </Modal>

      <Modal visible={showTerms} animationType="slide">
        <TermsScreen onClose={() => setShowTerms(false)} />
      </Modal>

      <Modal visible={showAbout} animationType="slide">
        <AboutScreen onClose={() => setShowAbout(false)} />
      </Modal>

      <Modal visible={showDeleteAccount} animationType="slide">
        <DeleteAccountScreen onClose={() => setShowDeleteAccount(false)} onDelete={handleDeleteAccount} />
      </Modal>

      <Modal visible={showBlockedUsers} animationType="slide">
        <BlockedUsersScreen onClose={() => setShowBlockedUsers(false)} />
      </Modal>

      <Modal visible={showMyProfile} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShowMyProfile(false)}>
        {myProfileData && <UserProfileDetailScreen profile={myProfileData} onClose={() => setShowMyProfile(false)} isOwnProfile={true} />}
      </Modal>

      <CustomAlert
        visible={visible}
        title={alertConfig?.title || ''}
        message={alertConfig?.message || ''}
        icon={alertConfig?.icon}
        type={alertConfig?.type}
        buttons={alertConfig?.buttons}
        onDismiss={hideAlert}
      />
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
  completionFill: { height: '100%' },
  completionText: { fontSize: 12 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  statGrad: { padding: 16, alignItems: 'center', gap: 6, backgroundColor: '#667eea' },
  statGrad2: { padding: 16, alignItems: 'center', gap: 6, backgroundColor: '#4ECDC4' },
  statGrad3: { padding: 16, alignItems: 'center', gap: 6, backgroundColor: '#FF6B9D' },
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
  settingsModal: { flex: 1, justifyContent: 'flex-end' },
  settingsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  settingsContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 },
  settingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  settingsTitle: { fontSize: 20, fontWeight: '800' },
  settingsClose: { fontSize: 24 },
  settingsItem: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  settingsItemIcon: { fontSize: 24, marginRight: 16 },
  settingsItemText: { flex: 1, fontSize: 16, fontWeight: '600' },
  settingsItemArrow: { fontSize: 24 },
  deletionWarningCard: { padding: 20, borderRadius: 20, marginBottom: 16, borderWidth: 2 },
  deletionWarningHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  deletionIconContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,68,68,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  deletionWarningIcon: { fontSize: 32 },
  deletionWarningContent: { flex: 1 },
  deletionWarningTitle: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  deletionWarningSubtitle: { fontSize: 13 },
  deletionTimeBox: { borderRadius: 12, padding: 16, marginBottom: 16 },
  deletionTimeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  deletionTimeIcon: { fontSize: 24, marginRight: 12, width: 32 },
  deletionTimeInfo: { flex: 1 },
  deletionTimeLabel: { fontSize: 12, marginBottom: 2 },
  deletionTimeValue: { fontSize: 15, fontWeight: '700' },
  cancelDeletionBtn: { backgroundColor: '#ff4444', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  cancelDeletionIcon: { fontSize: 18, color: '#fff', marginRight: 8 },
  cancelDeletionText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
