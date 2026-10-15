import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import Colors, { spacing } from '@/constants/Colors';
import { API_BASE_URL } from '@/src/api/client';

export default function AboutScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.text }]} maxFontSizeMultiplier={1.4}>
        DevX Tasks
      </Text>
      <Text style={[styles.version, { color: colors.muted }]} maxFontSizeMultiplier={1.2}>
        Version 1.0.0
      </Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]} maxFontSizeMultiplier={1.3}>
          About this app
        </Text>
        <Text style={[styles.text, { color: colors.text }]} maxFontSizeMultiplier={1.2}>
          A teaching demo for mobile testing tools. This app demonstrates real vs mocked API
          requests, error scenarios, and offline handling using MSW (Mock Service Worker).
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]} maxFontSizeMultiplier={1.3}>
          Testing Tools
        </Text>
        <Text style={[styles.text, { color: colors.text }]} maxFontSizeMultiplier={1.2}>
          • MSW for API mocking{'\n'}• React Query for data fetching{'\n'}• Jest and React Native
          Testing Library{'\n'}• Comprehensive error scenarios
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]} maxFontSizeMultiplier={1.3}>
          API Connection
        </Text>
        <Text style={[styles.text, { color: colors.text }]} maxFontSizeMultiplier={1.2}>
          Connected to:{' '}
          <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
            {API_BASE_URL}
          </Text>
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]} maxFontSizeMultiplier={1.3}>
          Learn more
        </Text>
        <TouchableOpacity
          style={[styles.linkButton, { backgroundColor: colors.surface }]}
          onPress={() => router.push('/onboarding')}
          accessibilityRole="button"
        >
          <Text style={[styles.link, { color: colors.tint }]} maxFontSizeMultiplier={1.2}>
            🎓 Replay Walkthrough →
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => Linking.openURL('https://devxtools.dev')}
          accessibilityRole="link"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.link, { color: colors.tint }]} maxFontSizeMultiplier={1.2}>
            Visit devxtools.dev →
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.footer, { color: colors.muted }]} maxFontSizeMultiplier={1.1}>
        Built with Expo {'\n'}© 2026 devxtools.dev
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  version: {
    fontSize: 14,
    marginBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
  },
  link: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  linkButton: {
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  footer: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
});
