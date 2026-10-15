import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Linking,
} from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors, { spacing } from '@/constants/Colors';
import type { ScenarioName } from '@/src/mocks/scenarios';

interface CodeViewerProps {
  visible: boolean;
  onClose: () => void;
  scenario?: ScenarioName;
}

const HANDLER_CODE: Record<ScenarioName, string> = {
  empty: `// Empty scenario handler
http.get('*/tasks', async () => {
  return HttpResponse.json({ tasks: [] });
});`,
  slow: `// Slow (3s) scenario handler
http.get('*/tasks', async () => {
  await delay(3000);
  return HttpResponse.json({
    tasks: [{
      id: 'slow-1',
      title: 'This took 3 seconds to load',
      completed: false,
      createdAt: new Date().toISOString(),
    }],
  });
});`,
  error500: `// Server error 500 scenario handler
http.get('*/tasks', async () => {
  return HttpResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
});`,
  validation400: `// Validation 400 scenario handler
http.post('*/tasks', async () => {
  return HttpResponse.json(
    { error: 'Title cannot be empty' },
    { status: 400 }
  );
});`,
  offline: `// Offline scenario handler
http.get('*/tasks', async () => {
  return HttpResponse.error();
});`,
  flaky: `// Flaky (1 in 3 fails) scenario handler
let counter = 0;
http.get('*/tasks', async () => {
  counter++;
  if (counter % 3 === 0) {
    return HttpResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    );
  }
  return HttpResponse.json({ tasks: [...] });
});`,
};

export function CodeViewer({ visible, onClose, scenario }: CodeViewerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  if (!scenario) return null;

  const code = HANDLER_CODE[scenario];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Handler Code</Text>
          <TouchableOpacity
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={[styles.closeButton, { color: colors.tint }]}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={[styles.codeBlock, { backgroundColor: colors.surface }]}>
            <Text style={[styles.code, { color: colors.text }]}>{code}</Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              This handler is in:
            </Text>
            <Text style={[styles.path, { color: colors.muted }]}>
              apps/mobile/src/mocks/scenarios.ts
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Learn more:</Text>
            <TouchableOpacity
              style={[styles.link, { backgroundColor: colors.surface }]}
              onPress={() => Linking.openURL('https://mswjs.io/docs/')}
              accessibilityRole="link">
              <Text style={[styles.linkText, { color: colors.tint }]}>
                MSW Documentation →
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.link, { backgroundColor: colors.surface }]}
              onPress={() => Linking.openURL('https://devxtools.dev/tools/msw/')}
              accessibilityRole="link">
              <Text style={[styles.linkText, { color: colors.tint }]}>
                devxtools.dev/tools/msw →
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.note, { backgroundColor: colors.surface }]}>
            <Text style={[styles.noteText, { color: colors.muted }]}>
              💡 The same handler is used in both the Lab UI and your Jest tests. Write once, use
              everywhere.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 17,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  codeBlock: {
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.xl,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  path: {
    fontSize: 13,
    fontFamily: 'monospace',
  },
  link: {
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  note: {
    padding: spacing.lg,
    borderRadius: 12,
    marginTop: spacing.lg,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 22,
  },
});
