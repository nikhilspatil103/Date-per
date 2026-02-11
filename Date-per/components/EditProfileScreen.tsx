import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Platform, StatusBar, Image, BackHandler } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { authAPI } from '../services/auth';
import Avatar from '../components/Avatar';
import Toast from '../components/Toast';
import { useTheme } from '../contexts/ThemeContext';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function EditProfileScreen({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [interestIn, setInterestIn] = useState('Female');
  const [height, setHeight] = useState('');
  const [graduation, setGraduation] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [showOnline, setShowOnline] = useState(true);
  const [showDistance, setShowDistance] = useState(true);
  const [allowMessages, setAllowMessages] = useState(true);
  const [showNameEdit, setShowNameEdit] = useState(false);
  const [showInterestEdit, setShowInterestEdit] = useState(false);
  const [showHeightEdit, setShowHeightEdit] = useState(false);
  const [showGraduationEdit, setShowGraduationEdit] = useState(false);
  const [showPrivacyEdit, setShowPrivacyEdit] = useState(false);
  const [showFullPhoto, setShowFullPhoto] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(-1);
  const [fullPhotoUri, setFullPhotoUri] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });

  useEffect(() => {
    loadUserData();
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    
    return () => backHandler.remove();
  }, []);

  const loadUserData = async () => {
    const userName = await AsyncStorage.getItem('userName');
    const userAge = await AsyncStorage.getItem('userAge');
    const userGender = await AsyncStorage.getItem('userGender');
    const userInterest = await AsyncStorage.getItem('userInterestIn');
    const userHeight = await AsyncStorage.getItem('userHeight');
    const userGrad = await AsyncStorage.getItem('userGraduation');
    const userPhoto = await AsyncStorage.getItem('userProfilePhoto');
    const userPhotos = await AsyncStorage.getItem('userPhotos');
    if (userName) setName(userName);
    if (userAge) setAge(userAge);
    if (userGender) setGender(userGender);
    if (userInterest) setInterestIn(userInterest);
    if (userHeight) setHeight(userHeight);
    if (userGrad) setGraduation(userGrad);
    if (userPhoto) setProfilePhoto(userPhoto);
    if (userPhotos) setPhotos(JSON.parse(userPhotos));
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
  };

  const updateProfile = async (data: any) => {
    try {
      const result = await authAPI.updateProfile(data);
      if (result._id) {
        if (data.name) await AsyncStorage.setItem('userName', data.name);
        if (data.age) await AsyncStorage.setItem('userAge', data.age.toString());
        if (data.gender) await AsyncStorage.setItem('userGender', data.gender);
        if (data.interestIn) await AsyncStorage.setItem('userInterestIn', data.interestIn);
        if (data.height) await AsyncStorage.setItem('userHeight', data.height.toString());
        if (data.graduation) await AsyncStorage.setItem('userGraduation', data.graduation);
        if (data.profilePhoto) await AsyncStorage.setItem('userProfilePhoto', data.profilePhoto);
        if (data.photos) await AsyncStorage.setItem('userPhotos', JSON.stringify(data.photos));
        showToast('Profile updated! ✨');
      } else {
        showToast('Update failed', 'error');
      }
    } catch (err) {
      console.error('Update error:', err);
      showToast('Update failed', 'error');
    }
  };

  const pickImage = async (isProfile: boolean) => {
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
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      if (isProfile) {
        setProfilePhoto(base64);
        await updateProfile({ profilePhoto: base64 });
      } else {
        const newPhotos = [...photos, base64];
        console.log('Adding photo, new count:', newPhotos.length);
        setPhotos(newPhotos);
        const result = await updateProfile({ photos: newPhotos });
        console.log('Update result:', result);
      }
    }
  };

  const removePhoto = async (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    await updateProfile({ photos: newPhotos });
    setShowPhotoOptions(false);
  };

  const makeProfilePhoto = async (index: number) => {
    const photo = photos[index];
    setProfilePhoto(photo);
    await updateProfile({ profilePhoto: photo });
    setShowPhotoOptions(false);
    showToast('Profile photo updated! ✨');
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
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: theme.headerText }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.photoSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Profile Photo</Text>
          <TouchableOpacity style={styles.photoContainer} onPress={() => { setFullPhotoUri(profilePhoto); setShowFullPhoto(true); }}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.profileImage} />
            ) : (
              <Avatar name={name || 'User'} size={120} />
            )}
            <TouchableOpacity style={styles.changePhotoBtn} onPress={(e) => { e.stopPropagation(); pickImage(true); }}>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>More Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
            {photos.map((photo, index) => (
              <TouchableOpacity key={index} style={styles.photoItem} onPress={() => { setFullPhotoUri(photo); setShowFullPhoto(true); }} onLongPress={() => { setSelectedPhotoIndex(index); setShowPhotoOptions(true); }}>
                <Image source={{ uri: photo }} style={styles.photoThumb} />
                <TouchableOpacity style={styles.photoMenuBtn} onPress={(e) => { e.stopPropagation(); setSelectedPhotoIndex(index); setShowPhotoOptions(true); }}>
                  <Text style={styles.photoMenuIcon}>⋮</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
            {photos.length < 6 && (
              <TouchableOpacity style={[styles.addPhotoBtn, { borderColor: theme.border }]} onPress={() => pickImage(false)}>
                <Text style={[styles.addPhotoText, { color: theme.textSecondary }]}>+</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Basic Information</Text>
          <TouchableOpacity style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setShowNameEdit(true)}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoEmoji}>👤</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Name</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{name || 'Not set'}</Text>
            </View>
            <Text style={[styles.infoArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoEmoji}>🎂</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Age</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{age || 'Not set'}</Text>
            </View>
          </View>

          <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoEmoji}>{gender === 'Male' ? '♂' : '♀'}</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Gender</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{gender || 'Not set'}</Text>
            </View>
          </View>

          <TouchableOpacity style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setShowInterestEdit(true)}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoEmoji}>❤️</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Interest In</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{interestIn}</Text>
            </View>
            <Text style={[styles.infoArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setShowHeightEdit(true)}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoEmoji}>📏</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Height</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{height ? `${height} cm` : 'Not set'}</Text>
            </View>
            <Text style={[styles.infoArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setShowGraduationEdit(true)}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoEmoji}>🎓</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Education</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{graduation || 'Not set'}</Text>
            </View>
            <Text style={[styles.infoArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Privacy & Settings</Text>
          <TouchableOpacity style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setShowPrivacyEdit(true)}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoEmoji}>🔒</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Privacy Settings</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>Manage visibility</Text>
            </View>
            <Text style={[styles.infoArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setShowPrivacyEdit(true)}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoEmoji}>💬</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Chat Status</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{showOnline ? 'Online' : 'Offline'}</Text>
            </View>
            <Text style={[styles.infoArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showNameEdit} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Name</Text>
              <TouchableOpacity onPress={() => setShowNameEdit(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="#888"
            />
            <TouchableOpacity style={styles.saveBtn} onPress={async () => {
              await updateProfile({ name });
              setShowNameEdit(false);
            }}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showInterestEdit} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Interest In</Text>
              <TouchableOpacity onPress={() => setShowInterestEdit(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={[styles.interestOption, interestIn === 'Male' && styles.interestSelected]} 
              onPress={async () => { 
                setInterestIn('Male'); 
                await updateProfile({ interestIn: 'Male' });
                setShowInterestEdit(false); 
              }}
            >
              <Text style={styles.interestText}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.interestOption, interestIn === 'Female' && styles.interestSelected]} 
              onPress={async () => { 
                setInterestIn('Female'); 
                await updateProfile({ interestIn: 'Female' });
                setShowInterestEdit(false); 
              }}
            >
              <Text style={styles.interestText}>Female</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showHeightEdit} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Height</Text>
              <TouchableOpacity onPress={() => setShowHeightEdit(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              placeholder="Enter height in cm"
              placeholderTextColor="#888"
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.saveBtn} onPress={async () => {
              await updateProfile({ height: parseInt(height) });
              setShowHeightEdit(false);
            }}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showGraduationEdit} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Education</Text>
              <TouchableOpacity onPress={() => setShowGraduationEdit(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={graduation}
              onChangeText={setGraduation}
              placeholder="e.g., Bachelor's, Master's"
              placeholderTextColor="#888"
            />
            <TouchableOpacity style={styles.saveBtn} onPress={async () => {
              await updateProfile({ graduation });
              setShowGraduationEdit(false);
            }}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showPrivacyEdit} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Privacy Settings</Text>
              <TouchableOpacity onPress={() => setShowPrivacyEdit(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.privacyOption} 
              onPress={() => setShowOnline(!showOnline)}
            >
              <Text style={styles.privacyText}>Show Online Status</Text>
              <Text style={styles.privacyValue}>{showOnline ? '✓' : '✕'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.privacyOption} 
              onPress={() => setShowDistance(!showDistance)}
            >
              <Text style={styles.privacyText}>Show Distance</Text>
              <Text style={styles.privacyValue}>{showDistance ? '✓' : '✕'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.privacyOption} 
              onPress={() => setAllowMessages(!allowMessages)}
            >
              <Text style={styles.privacyText}>Allow Messages</Text>
              <Text style={styles.privacyValue}>{allowMessages ? '✓' : '✕'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={async () => {
              await updateProfile({ privacy: { showOnline, showDistance, allowMessages } });
              setShowPrivacyEdit(false);
            }}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showFullPhoto} transparent animationType="fade">
        <View style={[styles.fullPhotoModal, { backgroundColor: theme.overlay }]}>
          <TouchableOpacity style={styles.fullPhotoOverlay} onPress={() => setShowFullPhoto(false)} />
          <View style={styles.fullPhotoContainer}>
            <TouchableOpacity style={styles.closeFullPhoto} onPress={() => setShowFullPhoto(false)}>
              <Text style={styles.closeFullPhotoText}>✕</Text>
            </TouchableOpacity>
            <Image source={{ uri: fullPhotoUri }} style={styles.fullPhotoImage} resizeMode="contain" />
          </View>
        </View>
      </Modal>

      <Modal visible={showPhotoOptions} transparent animationType="fade">
        <View style={styles.optionsModal}>
          <TouchableOpacity style={styles.optionsOverlay} onPress={() => setShowPhotoOptions(false)} />
          <View style={styles.optionsContent}>
            <TouchableOpacity style={styles.optionBtn} onPress={() => makeProfilePhoto(selectedPhotoIndex)}>
              <Text style={styles.optionIcon}>👤</Text>
              <Text style={styles.optionText}>Make Profile Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.optionBtn, styles.deleteBtn]} onPress={() => removePhoto(selectedPhotoIndex)}>
              <Text style={styles.optionIcon}>🗑️</Text>
              <Text style={[styles.optionText, styles.deleteText]}>Delete Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPhotoOptions(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
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
    paddingTop: STATUS_BAR_HEIGHT, 
    paddingBottom: 15, 
    paddingHorizontal: 24, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backIcon: { fontSize: 24, fontWeight: '700' },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  photoSection: { padding: 20, alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16, alignSelf: 'flex-start' },
  photoContainer: { alignItems: 'center', marginBottom: 20 },
  changePhotoBtn: { marginTop: 12, backgroundColor: '#667eea', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  changePhotoText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  infoCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1 },
  infoIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  infoEmoji: { fontSize: 24 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, marginBottom: 4 },
  infoValue: { fontSize: 15, fontWeight: '600' },
  infoArrow: { fontSize: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#2a2a2a', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  closeBtn: { fontSize: 24, color: '#fff' },
  input: { backgroundColor: '#3a3a3a', color: '#fff', padding: 15, borderRadius: 10, fontSize: 16, marginBottom: 20 },
  saveBtn: { backgroundColor: '#667eea', padding: 15, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  interestOption: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#3a3a3a', backgroundColor: '#2a2a2a' },
  interestSelected: { backgroundColor: '#667eea' },
  interestText: { fontSize: 16, color: '#fff' },
  privacyOption: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#3a3a3a' },
  privacyText: { fontSize: 16, color: '#fff' },
  privacyValue: { fontSize: 18, color: '#667eea', fontWeight: 'bold' },
  profileImage: { width: 120, height: 120, borderRadius: 60 },
  photosScroll: { marginBottom: 10 },
  photoItem: { position: 'relative', marginRight: 12 },
  photoThumb: { width: 100, height: 100, borderRadius: 12 },
  photoMenuBtn: { position: 'absolute', top: 4, right: 4, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  photoMenuIcon: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  addPhotoBtn: { width: 100, height: 100, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderStyle: 'dashed' },
  addPhotoText: { fontSize: 40 },
  fullPhotoModal: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fullPhotoOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  fullPhotoContainer: { width: '90%', alignItems: 'center' },
  closeFullPhoto: { position: 'absolute', top: -50, right: 0, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  closeFullPhotoText: { fontSize: 24, color: '#fff', fontWeight: 'bold' },
  fullPhotoImage: { width: '100%', height: 400, borderRadius: 20 },
  optionsModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  optionsOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  optionsContent: { backgroundColor: '#2a2a2a', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 12, marginBottom: 12 },
  deleteBtn: { backgroundColor: 'rgba(255,68,68,0.2)' },
  optionIcon: { fontSize: 24, marginRight: 12 },
  optionText: { fontSize: 16, color: '#fff', fontWeight: '600' },
  deleteText: { color: '#ff4444' },
  cancelBtn: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  cancelText: { fontSize: 16, color: '#fff', fontWeight: '600' },
});
