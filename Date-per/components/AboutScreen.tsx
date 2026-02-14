import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function AboutScreen({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onClose}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.headerText }]}>About</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.logoSection}>
          <Text style={styles.logo}>💕</Text>
          <Text style={[styles.appName, { color: theme.text }]}>Dating Loop</Text>
          <Text style={[styles.tagline, { color: theme.textSecondary }]}>Where Connections Come Full Circle</Text>
          <Text style={[styles.version, { color: theme.textSecondary }]}>Version 1.0.0</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Our Mission</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          Dating Loop is designed to help people find meaningful connections - whether it's friendship or love. We believe in creating a safe, respectful platform where genuine relationships can flourish.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>What Makes Us Different</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          • Location-based matching to find people nearby{'\n'}
          • Real-time messaging for instant connections{'\n'}
          • Privacy controls to manage your visibility{'\n'}
          • Safe and respectful community{'\n'}
          • Simple and intuitive interface
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Our Values</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          Safety First: We prioritize user safety with reporting tools and moderation.{'\n\n'}
          Authenticity: We encourage genuine profiles and real connections.{'\n\n'}
          Respect: We foster a community built on mutual respect and kindness.{'\n\n'}
          Privacy: Your data and privacy are important to us.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Community Guidelines</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          Be yourself, be respectful, and be safe. Treat others how you'd like to be treated. Report any inappropriate behavior to help us maintain a positive community.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Contact & Support</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          Email: support@dilse.app{'\n'}
          Website: www.dilse.app{'\n'}
          Follow us on social media @dilseapp
        </Text>

        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Made with ❤️ for meaningful connections
          </Text>
          <Text style={[styles.copyright, { color: theme.textSecondary }]}>
            © 2024 Dating Loop. All rights reserved.
          </Text>
        </View>

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
  logoSection: { alignItems: 'center', paddingVertical: 30 },
  logo: { fontSize: 80, marginBottom: 16 },
  appName: { fontSize: 32, fontWeight: '800', marginBottom: 8 },
  tagline: { fontSize: 16, marginBottom: 8 },
  version: { fontSize: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 24, marginBottom: 12 },
  text: { fontSize: 14, lineHeight: 22, marginBottom: 16 },
  footer: { marginTop: 40, paddingTop: 24, borderTopWidth: 1, alignItems: 'center' },
  footerText: { fontSize: 14, marginBottom: 8 },
  copyright: { fontSize: 12 },
});
