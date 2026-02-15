import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { TEST_LOCATIONS, isTestMode } from '../config/testLocations';
import LocationService from '../services/location';

export default function DeveloperSettingsScreen({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  if (!isTestMode) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Developer mode not available in production</Text>
      </View>
    );
  }

  const handleRefreshLocation = async () => {
    await LocationService.updateLocationOnServer();
    setSelectedLocation(null);
    alert('Location refreshed from GPS');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={[styles.closeText, { color: theme.primary }]}>✕</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>🛠️ Developer Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Location Settings</Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          Refresh your current GPS location.
        </Text>

        <TouchableOpacity
          style={[styles.clearBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={handleRefreshLocation}
        >
          <Text style={[styles.clearText, { color: theme.primary }]}>Refresh Location</Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Text style={[styles.infoTitle, { color: theme.text }]}>💡 Developer Info:</Text>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            • Location updates automatically on app start{'\n'}
            • Requires location permission{'\n'}
            • Works on real devices with GPS{'\n'}
            • May not work on simulators/emulators
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  closeBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  closeText: { fontSize: 24, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700' },
  content: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  description: { fontSize: 14, marginBottom: 20, lineHeight: 20 },
  locationBtn: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  locationText: { fontSize: 16, fontWeight: '600' },
  clearBtn: {
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 30,
    borderWidth: 1,
    alignItems: 'center',
  },
  clearText: { fontSize: 16, fontWeight: '700' },
  infoBox: {
    padding: 16,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 12,
    marginBottom: 20,
  },
  infoTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  infoText: { fontSize: 14, lineHeight: 22 },
});
