import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function PrivacyPolicyScreen({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onClose}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.headerText }]}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.updated, { color: theme.textSecondary }]}>Last updated: January 2024</Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>1. Information We Collect</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          We collect information you provide directly to us, including your name, email, age, gender, photos, location, and preferences. We also collect information about your usage of the app and interactions with other users.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>2. How We Use Your Information</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          • To provide and maintain our dating services{'\n'}
          • To match you with compatible users{'\n'}
          • To send you notifications about matches and messages{'\n'}
          • To improve our app and user experience{'\n'}
          • To prevent fraud and ensure safety
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>3. Information Sharing</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          Your profile information is visible to other users. We do not sell your personal information to third parties. We may share information with service providers who help us operate the app.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>4. Location Data</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          We use your location to show you nearby matches. You can control location permissions in your device settings. Distance information is approximate and shown to other users.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>5. Data Security</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          We implement security measures to protect your information. However, no method of transmission over the internet is 100% secure. Please use strong passwords and report suspicious activity.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>6. Your Rights</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          You can access, update, or delete your account information at any time. You can also control privacy settings and block users. Contact us to exercise your data rights.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>7. Age Restrictions</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          You must be at least 18 years old to use Dating Loop. We do not knowingly collect information from users under 18.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>8. Contact Us</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          If you have questions about this Privacy Policy, contact us at privacy@dilse.app
        </Text>

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
  updated: { fontSize: 12, marginBottom: 24, fontStyle: 'italic' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 20, marginBottom: 12 },
  text: { fontSize: 14, lineHeight: 22, marginBottom: 16 },
});
