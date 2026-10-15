import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors, { spacing } from '@/constants/Colors';

export default function NotFoundScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]} maxFontSizeMultiplier={1.4}>
          Not found
        </Text>
        <Text style={[styles.text, { color: colors.muted }]} maxFontSizeMultiplier={1.2}>
          We couldn't find that page.
        </Text>

        <Link href="/" asChild>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.tint }]}
            accessibilityRole="button"
            accessibilityLabel="Back to tasks"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.buttonText} maxFontSizeMultiplier={1.2}>
              Back to tasks
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  button: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 8,
    minHeight: 44,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
