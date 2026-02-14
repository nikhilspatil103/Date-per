import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function TermsScreen({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onClose}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.headerText }]}>Terms & Conditions</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.updated, { color: theme.textSecondary }]}>Last updated: January 2024</Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>1. Acceptance of Terms</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          By using Dating Loop, you agree to these Terms & Conditions. If you don't agree, please don't use our services.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>2. Eligibility</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          You must be at least 18 years old to use Dating Loop. By creating an account, you confirm that you meet this age requirement and will comply with all applicable laws.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>3. Account Responsibilities</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          • You are responsible for maintaining account security{'\n'}
          • Provide accurate and truthful information{'\n'}
          • One person per account - no sharing{'\n'}
          • Keep your password confidential{'\n'}
          • Notify us of unauthorized access
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>4. Prohibited Conduct</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          You may not:{'\n'}
          • Harass, abuse, or harm other users{'\n'}
          • Post inappropriate or offensive content{'\n'}
          • Impersonate others or create fake profiles{'\n'}
          • Solicit money or engage in commercial activity{'\n'}
          • Use the app for illegal purposes{'\n'}
          • Share explicit content without consent
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>5. Content Guidelines</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          All photos and content must be appropriate and comply with our community guidelines. We reserve the right to remove content that violates these terms.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>6. Virtual Currency (Coins)</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          Coins are virtual currency used within the app. Coins have no real-world value and cannot be exchanged for cash. All coin purchases are final.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>7. Premium Features</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          Premium subscriptions provide additional features. Subscriptions auto-renew unless cancelled. Refunds are subject to our refund policy.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>8. Safety & Reporting</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          Your safety is important. Report suspicious behavior, harassment, or violations. We investigate all reports and may suspend or ban violating accounts.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>9. Termination</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          We may suspend or terminate accounts that violate these terms. You can delete your account at any time from settings.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>10. Disclaimer</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          Dating Loop is a platform to meet people. We don't guarantee matches or relationships. Use the app at your own risk and exercise caution when meeting people.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>11. Changes to Terms</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          We may update these terms. Continued use after changes means you accept the new terms.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>12. Contact</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          Questions about these terms? Contact us at support@dilse.app
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
