import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Platform, StatusBar } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

const REASONS = [
  'Found someone special',
  'Not getting enough matches',
  'Privacy concerns',
  'Too expensive',
  'Technical issues',
  'Taking a break from dating',
  'Other'
];

export default function DeleteAccountScreen({ onClose, onDelete }: { onClose: () => void; onDelete: (reason: string, feedback: string) => void }) {
  const { theme } = useTheme();
  const [selectedReason, setSelectedReason] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleDelete = () => {
    if (!selectedReason) return;
    onDelete(selectedReason, feedback);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onClose}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.headerText }]}>Delete Account</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.warningBox}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningTitle}>Account Deletion Scheduled</Text>
          <Text style={styles.warningText}>
            Your account will be scheduled for deletion in 24 hours. You can cancel anytime before then.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Why are you leaving?</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Help us improve by sharing your reason
        </Text>

        {REASONS.map((reason) => (
          <TouchableOpacity
            key={reason}
            style={[
              styles.reasonOption,
              { backgroundColor: theme.card, borderColor: selectedReason === reason ? theme.primary : theme.border }
            ]}
            onPress={() => setSelectedReason(reason)}
          >
            <View style={[styles.radio, { borderColor: theme.border }]}>
              {selectedReason === reason && <View style={[styles.radioSelected, { backgroundColor: theme.primary }]} />}
            </View>
            <Text style={[styles.reasonText, { color: theme.text }]}>{reason}</Text>
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>
          Additional Feedback (Optional)
        </Text>
        <TextInput
          style={[styles.feedbackInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
          placeholder="Tell us more about your experience..."
          placeholderTextColor={theme.textSecondary}
          multiline
          numberOfLines={4}
          value={feedback}
          onChangeText={setFeedback}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.deleteBtn, { opacity: selectedReason ? 1 : 0.5 }]}
          onPress={handleDelete}
          disabled={!selectedReason}
        >
          <Text style={styles.deleteBtnText}>Schedule Account Deletion</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text style={[styles.cancelBtnText, { color: theme.text }]}>Cancel</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 24, color: '#fff' },
  title: { fontSize: 20, fontWeight: '800' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  warningBox: { backgroundColor: 'rgba(255,68,68,0.1)', padding: 20, borderRadius: 16, marginBottom: 24, alignItems: 'center', borderWidth: 1, borderColor: '#ff4444' },
  warningIcon: { fontSize: 48, marginBottom: 12 },
  warningTitle: { fontSize: 18, fontWeight: '700', color: '#ff4444', marginBottom: 8 },
  warningText: { fontSize: 14, color: '#ff4444', textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 16 },
  reasonOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  radioSelected: { width: 10, height: 10, borderRadius: 5 },
  reasonText: { fontSize: 15, fontWeight: '500' },
  feedbackInput: { borderWidth: 1, borderRadius: 12, padding: 16, fontSize: 15, minHeight: 100, marginBottom: 24 },
  deleteBtn: { backgroundColor: '#ff4444', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  deleteBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { padding: 16, borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { fontSize: 16, fontWeight: '600' },
});
