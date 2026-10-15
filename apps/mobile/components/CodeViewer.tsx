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
import { SCENARIO_SNIPPETS } from '@/src/mocks/scenarios.snippets';

interface CodeViewerProps {
  visible: boolean;
  onClose: () => void;
  scenario?: ScenarioName;
}

export function CodeViewer({ visible, onClose, scenario }: CodeViewerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  if (!scenario) return null;

  const snippet = SCENARIO_SNIPPETS[scenario];
  
  if (!snippet) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Handler: {scenario}</Text>
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
            <Text style={[styles.code, { color: colors.text }]}>
              {typeof snippet.code === 'string' ? snippet.code : JSON.stringify(snippet.code)}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              This handler is defined in:
            </Text>
            <TouchableOpacity
              style={[styles.link, { backgroundColor: colors.surface }]}
              onPress={() =>
                Linking.openURL(
                  `https://github.com/sgedda/devxtools-rn-sample/blob/cursor/implement-ux-review-e0f5/apps/mobile/src/mocks/scenarios.ts#L${snippet.line}`
                )
              }
              accessibilityRole="link">
              <Text style={[styles.path, { color: colors.tint }]}>
                apps/mobile/src/mocks/scenarios.ts:{snippet.line}
              </Text>
              <Text style={[styles.linkText, { color: colors.tint }]}>View on GitHub →</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.teachingBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.teachingTitle, { color: colors.text }]}>💡 Teaching Point</Text>
            <Text style={[styles.teachingText, { color: colors.muted }]}>
              This is the SAME handler used in:
            </Text>
            <Text style={[styles.teachingBullet, { color: colors.muted }]}>
              • This Lab UI (network interception)
            </Text>
            <Text style={[styles.teachingBullet, { color: colors.muted }]}>
              • Jest tests (component & API tests)
            </Text>
            <Text style={[styles.teachingBullet, { color: colors.muted }]}>
              • Deep links (devxtools://lab?scenario={scenario})
            </Text>
            <Text style={[styles.teachingText, { color: colors.muted, marginTop: 12 }]}>
              Write once, use everywhere.
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
  infoBox: {
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  infoText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
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
    marginBottom: spacing.xs,
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
  teachingBox: {
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.xl,
  },
  teachingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  teachingText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  teachingBullet: {
    fontSize: 14,
    lineHeight: 22,
    marginLeft: spacing.sm,
  },
});
