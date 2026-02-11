import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, StatusBar, Modal, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WebSocketService from '../../services/websocket';
import UserProfileDetailScreen from '../../components/UserProfileDetailScreen';
import Avatar from '../../components/Avatar';
import NotificationCenter from '../../components/NotificationCenter';
import { useTheme, colorSchemeNames } from '../../contexts/ThemeContext';
import API_URL from '../../config/api';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function FindScreen({ onLogout, isActive, pendingNotificationUserId, onNotificationHandled }: { onLogout: () => void; isActive?: boolean; pendingNotificationUserId?: string | null; onNotificationHandled?: () => void }) {
  const { theme, toggleTheme, mode, colorScheme, setColorScheme } = useTheme();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [filterOnline, setFilterOnline] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'likes' | 'age'>('distance');
  const [ageRange, setAgeRange] = useState({ min: 18, max: 60 });
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingProfileId, setPendingProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (isActive) {
      loadProfiles();
      loadUnreadCount();
    }
    
    if (!isActive) return;
    
    const handleStatusChange = (message: any) => {
      if (message.type === 'userOnline') {
        setProfiles((prev: any[]) => prev.map((p: any) => 
          (p._id === message.userId || p.id === message.userId) ? { ...p, online: true } : p
        ));
      } else if (message.type === 'userOffline') {
        setProfiles((prev: any[]) => prev.map((p: any) => 
          (p._id === message.userId || p.id === message.userId) ? { ...p, online: false, lastSeen: new Date() } : p
        ));
      }
    };
    
    WebSocketService.onMessage(handleStatusChange);
    
    const handleLikeNotification = (data: any) => {
      if (data.type === 'like') {
        setUnreadCount(prev => prev + 1);
      }
    };
    
    WebSocketService.onMessage(handleLikeNotification);
    
    return () => {
      WebSocketService.removeMessageListener(handleStatusChange);
      WebSocketService.removeMessageListener(handleLikeNotification);
    };
  }, [isActive]);

  const loadProfiles = async () => {
    const token = await AsyncStorage.getItem('authToken');
    try {
      const response = await fetch(`${API_URL}/api/nearby`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
       console.log('Profiles with isLiked:', data.map((p: any) => ({ name: p.name, isLiked: p.isLiked })));
      setProfiles(data);
    } catch {
      setProfiles([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfiles();
    setRefreshing(false);
  };

  const loadUnreadCount = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Load unread count error:', error);
    }
  };

  useEffect(() => {
    if (pendingNotificationUserId) {
      setPendingProfileId(pendingNotificationUserId);
      setShowNotifications(true);
      onNotificationHandled?.();
    }
  }, [pendingNotificationUserId]);

  const getFilteredProfiles = () => {
    let filtered = [...profiles];
    if (filterOnline) filtered = filtered.filter(p => p.online);
    filtered = filtered.filter(p => p.age >= ageRange.min && p.age <= ageRange.max);
    if (sortBy === 'likes') filtered.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    else if (sortBy === 'age') filtered.sort((a, b) => a.age - b.age);
    return filtered;
  };

  const activeFiltersCount = () => {
    let count = 0;
    if (filterOnline) count++;
    if (ageRange.min !== 18 || ageRange.max !== 60) count++;
    if (sortBy !== 'distance') count++;
    return count;
  };

  const filteredProfiles = getFilteredProfiles();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <Text style={[styles.title, { color: theme.headerText }]}>Discover</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={toggleTheme}>
            <Text style={styles.headerIcon}>{mode === 'light' ? '🌙' : '☀️'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            <Text style={styles.headerIcon}>{viewMode === 'grid' ? '☰' : '⊞'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowNotifications(true)}>
            <Text style={styles.headerIcon}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {profiles.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Profiles Found</Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Check back later for new people nearby</Text>
          </View>
        ) : viewMode === 'grid' ? (
          <View style={styles.grid}>
            {filteredProfiles.map(profile => (
              <View key={profile._id || profile.id} style={styles.cardWrapper}>
                <TouchableOpacity onPress={() => setSelectedProfile(profile)} activeOpacity={1}>
                  <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.imageWrapper}>
                      <Avatar photo={profile?.photo} name={profile.name} size={'100%'} square={true} />
                      <View style={styles.gradient} />
                      {profile.online && <View style={[styles.onlineDot, { backgroundColor: theme.online }]} />}
                    </View>
                    <View style={styles.info}>
                      <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{profile.name}</Text>
                      <View style={styles.row}>
                        <View style={[styles.ageBadge, { backgroundColor: profile.gender === 'Male' ? theme.male : theme.female, borderColor: profile.gender === 'Male' ? theme.maleBorder : theme.femaleBorder }]}>
                          <Text style={[styles.ageText, { color: profile.gender === 'Male' ? theme.maleText : theme.femaleText }]}>{profile.gender === 'Male' ? '♂' : '♀'} {profile.age}</Text>
                        </View>
                        <Text style={[styles.distance, { color: theme.textSecondary }]} numberOfLines={1}>📍 {profile.distance}</Text>
                        <Text style={[styles.likeCount, { color: theme.textSecondary }]}>{profile.isLiked ? '❤️' : '🤍'} {profile.likesCount || 0}</Text>
                      </View>
                      <Text style={[styles.bio, { color: theme.textSecondary }]} numberOfLines={2}>{profile.bio}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.list}>
            {filteredProfiles.map(profile => (
              <View key={profile._id || profile.id} style={styles.listItemWrapper}>
                <TouchableOpacity style={[styles.listItem, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setSelectedProfile(profile)} activeOpacity={1}>
                  <View style={styles.listAvatarWrapper}>
                    <Avatar photo={profile?.photo} name={profile.name} size={80} />
                    {profile.online && <View style={[styles.listOnlineDot, { backgroundColor: theme.online }]} />}
                  </View>
                  <View style={styles.listInfo}>
                    <Text style={[styles.listName, { color: theme.text }]}>{profile.name}</Text>
                    <View style={styles.listRow}>
                      <View style={[styles.ageBadge, { backgroundColor: profile.gender === 'Male' ? theme.male : theme.female, borderColor: profile.gender === 'Male' ? theme.maleBorder : theme.femaleBorder }]}>
                        <Text style={[styles.ageText, { color: profile.gender === 'Male' ? theme.maleText : theme.femaleText }]}>{profile.gender === 'Male' ? '♂' : '♀'} {profile.age}</Text>
                      </View>
                      <Text style={[styles.listDistance, { color: theme.textSecondary }]}>📍 {profile.distance}</Text>
                      <Text style={[styles.likeCount, { color: theme.textSecondary }]}>{profile.isLiked ? '❤️' : '🤍'} {profile.likesCount || 0}</Text>
                    </View>
                    <Text style={[styles.listBio, { color: theme.textSecondary }]} numberOfLines={2}>{profile.bio}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity 
        style={[styles.floatingFilterBtn, { backgroundColor: theme.primary }]}
        onPress={() => setShowFilters(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.floatingFilterIcon}>⚡</Text>
        {activeFiltersCount() > 0 && (
          <View style={styles.floatingBadge}>
            <Text style={styles.floatingBadgeText}>{activeFiltersCount()}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal visible={!!selectedProfile} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setSelectedProfile(null)}>
        {selectedProfile && (
          <UserProfileDetailScreen 
            profile={selectedProfile} 
            onClose={() => setSelectedProfile(null)}
            onLikeUpdate={(liked, count) => {
              setProfiles(prev => prev.map(p => 
                p._id === selectedProfile._id ? { ...p, isLiked: liked, likesCount: count } : p
              ));
              setSelectedProfile({ ...selectedProfile, isLiked: liked, likesCount: count });
            }}
          />
        )}
      </Modal>

      <Modal visible={showNotifications} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShowNotifications(false)}>
        <NotificationCenter onClose={() => { setShowNotifications(false); loadUnreadCount(); }} pendingProfileId={pendingProfileId} onProfileOpened={() => setPendingProfileId(null)} />
      </Modal>

      <Modal visible={showFilters} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.filterModal, { backgroundColor: theme.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Filters & Sort</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Text style={[styles.closeBtn, { color: theme.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Theme Color</Text>
              <View style={styles.colorGrid}>
                {(Object.keys(colorSchemeNames) as Array<keyof typeof colorSchemeNames>).map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[styles.colorOption, { borderColor: colorScheme === color ? theme.primary : theme.border }]}
                    onPress={() => setColorScheme(color)}
                  >
                    <View style={[styles.colorCircle, { backgroundColor: color === 'purple' ? '#667eea' : color === 'pink' ? '#ec4899' : color === 'blue' ? '#3b82f6' : color === 'green' ? '#10b981' : color === 'orange' ? '#f97316' : '#ef4444' }]} />
                    <Text style={[styles.colorName, { color: theme.text }]}>{colorSchemeNames[color]}</Text>
                    {colorScheme === color && <Text style={styles.colorCheck}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.sectionTitle, { color: theme.text }]}>Online Status</Text>
              <TouchableOpacity 
                style={[styles.filterOption, { backgroundColor: theme.background, borderColor: theme.border }]}
                onPress={() => setFilterOnline(!filterOnline)}
              >
                <Text style={[styles.filterOptionText, { color: theme.text }]}>Show only online users</Text>
                <View style={[styles.checkbox, filterOnline && { backgroundColor: theme.primary }]}>
                  {filterOnline && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>

              <Text style={[styles.sectionTitle, { color: theme.text }]}>Age Range: {ageRange.min} - {ageRange.max}</Text>
              <View style={[styles.ageSliders, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <View style={styles.sliderRow}>
                  <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>Min: {ageRange.min}</Text>
                  <View style={styles.ageButtons}>
                    <TouchableOpacity onPress={() => setAgeRange(prev => ({ ...prev, min: Math.max(18, prev.min - 1) }))} style={[styles.ageBtn, { backgroundColor: theme.primary }]}>
                      <Text style={styles.ageBtnText}>-</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setAgeRange(prev => ({ ...prev, min: Math.min(prev.max - 1, prev.min + 1) }))} style={[styles.ageBtn, { backgroundColor: theme.primary }]}>
                      <Text style={styles.ageBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.sliderRow}>
                  <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>Max: {ageRange.max}</Text>
                  <View style={styles.ageButtons}>
                    <TouchableOpacity onPress={() => setAgeRange(prev => ({ ...prev, max: Math.max(prev.min + 1, prev.max - 1) }))} style={[styles.ageBtn, { backgroundColor: theme.primary }]}>
                      <Text style={styles.ageBtnText}>-</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setAgeRange(prev => ({ ...prev, max: Math.min(99, prev.max + 1) }))} style={[styles.ageBtn, { backgroundColor: theme.primary }]}>
                      <Text style={styles.ageBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <Text style={[styles.sectionTitle, { color: theme.text }]}>Sort By</Text>
              <TouchableOpacity 
                style={[styles.filterOption, { backgroundColor: theme.background, borderColor: theme.border }]}
                onPress={() => setSortBy('distance')}
              >
                <Text style={[styles.filterOptionText, { color: theme.text }]}>📍 Distance</Text>
                <View style={[styles.radio, sortBy === 'distance' && { borderColor: theme.primary }]}>
                  {sortBy === 'distance' && <View style={[styles.radioDot, { backgroundColor: theme.primary }]} />}
                </View>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterOption, { backgroundColor: theme.background, borderColor: theme.border }]}
                onPress={() => setSortBy('likes')}
              >
                <Text style={[styles.filterOptionText, { color: theme.text }]}>❤️ Most Liked</Text>
                <View style={[styles.radio, sortBy === 'likes' && { borderColor: theme.primary }]}>
                  {sortBy === 'likes' && <View style={[styles.radioDot, { backgroundColor: theme.primary }]} />}
                </View>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterOption, { backgroundColor: theme.background, borderColor: theme.border }]}
                onPress={() => setSortBy('age')}
              >
                <Text style={[styles.filterOptionText, { color: theme.text }]}>🎂 Age (Low to High)</Text>
                <View style={[styles.radio, sortBy === 'age' && { borderColor: theme.primary }]}>
                  {sortBy === 'age' && <View style={[styles.radioDot, { backgroundColor: theme.primary }]} />}
                </View>
              </TouchableOpacity>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
              <TouchableOpacity 
                style={[styles.resetBtn, { backgroundColor: theme.background }]}
                onPress={() => {
                  setFilterOnline(false);
                  setSortBy('distance');
                  setAgeRange({ min: 18, max: 60 });
                }}
              >
                <Text style={[styles.resetBtnText, { color: theme.textSecondary }]}>Reset All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.applyBtn, { backgroundColor: theme.primary }]}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
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
  title: { fontSize: 28, fontWeight: '800' },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  headerIcon: { fontSize: 20 },
  notificationBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#FF3B30', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  notificationBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  scrollContent: { paddingHorizontal: 4, paddingTop: 16, paddingBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cardWrapper: { width: '48%', position: 'relative' },
  card: { 
    borderRadius: 20, 
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageWrapper: { position: 'relative', width: '100%', height: 200, justifyContent: 'center', alignItems: 'center', borderRadius: 16, overflow: 'hidden' },
  gradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
  onlineDot: { 
    position: 'absolute', 
    top: 12, 
    right: 12, 
    width: 12, 
    height: 12, 
    borderRadius: 6, 
    borderWidth: 2, 
    borderColor: '#fff',
  },
  info: { padding: 12 },
  name: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  ageBadge: { 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 10,
    borderWidth: 1,
  },
  ageText: { fontSize: 11, fontWeight: '700' },
  distance: { fontSize: 11, flex: 1 },
  likeCount: { fontSize: 10, marginLeft: 'auto' },
  bio: { fontSize: 12, lineHeight: 16 },
  list: { paddingHorizontal: 8 },
  listItemWrapper: { marginBottom: 12 },
  listItem: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  listAvatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  listOnlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
  listInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  listName: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  listDistance: {
    fontSize: 12,
    flex: 1,
  },
  listBio: {
    fontSize: 13,
    lineHeight: 18,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  floatingFilterBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    opacity: 0.9,
  },
  floatingFilterIcon: {
    fontSize: 24,
  },
  floatingBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  floatingBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  closeBtn: {
    fontSize: 24,
    fontWeight: '300',
  },
  modalContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  colorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    flex: 1,
    minWidth: '47%',
    gap: 8,
  },
  colorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  colorName: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  colorCheck: {
    fontSize: 16,
    color: '#22c55e',
    fontWeight: '700',
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  filterOptionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  ageSliders: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  sliderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  ageButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  ageBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ageBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
  },
  resetBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  applyBtn: {
    flex: 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
