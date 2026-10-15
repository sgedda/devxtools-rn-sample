import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import Colors, { spacing } from '@/constants/Colors';
import { useLab, type DataSource } from '@/src/lab/LabContext';
import { scenarios, scenarioLabels, type ScenarioName } from '@/src/mocks/scenarios';
import { CodeViewer } from '@/components/CodeViewer';

export default function LabModal() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { dataSource, scenario, setDataSource, selectScenario, requestLog } = useLab();
  const params = useLocalSearchParams<{ scenario?: string }>();
  const [showCodeViewer, setShowCodeViewer] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioName | undefined>();

  // Handle deep link scenario parameter
  useEffect(() => {
    if (params.scenario && params.scenario in scenarios) {
      selectScenario(params.scenario as ScenarioName);
    }
  }, [params.scenario]);

  const handleDataSourceChange = (source: DataSource) => {
    if (source === 'mockifyer') {
      // Mockifyer is stubbed for now
      return;
    }
    setDataSource(source);
  };

  const handleScenarioChange = (newScenario: ScenarioName) => {
    selectScenario(newScenario);
  };

  const handleShowCode = (scenarioKey: ScenarioName) => {
    setSelectedScenario(scenarioKey);
    setShowCodeViewer(true);
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Lab',
          headerLeft: () => (
            <TouchableOpacity
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.headerButton, { color: colors.tint }]}>Close</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}>
        {/* Data Source Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Source</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
            Your app code didn't change. Only the network layer did.
          </Text>

          <View style={styles.segmentedControl}>
            {(['real', 'msw', 'mockifyer'] as DataSource[]).map(source => (
              <TouchableOpacity
                key={source}
                style={[
                  styles.segment,
                  {
                    backgroundColor: dataSource === source ? colors.tint : colors.surface,
                    borderColor: dataSource === source ? colors.tint : colors.border,
                  },
                  source === 'mockifyer' && styles.segmentDisabled,
                ]}
                onPress={() => handleDataSourceChange(source)}
                disabled={source === 'mockifyer'}
                accessibilityRole="button"
                accessibilityState={{ selected: dataSource === source }}>
                <Text
                  style={[
                    styles.segmentText,
                    {
                      color:
                        dataSource === source
                          ? '#fff'
                          : source === 'mockifyer'
                            ? colors.muted
                            : colors.text,
                    },
                  ]}>
                  {source === 'real' ? 'Real' : source === 'msw' ? 'MSW' : 'Mockifyer*'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.note, { color: colors.muted }]}>
            * Mockifyer replay is stubbed in this demo
          </Text>
        </View>

        {/* Scenario Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Scenarios</Text>
          {dataSource === 'real' && (
            <View style={[styles.warningBox, { backgroundColor: colors.surface }]}>
              <Text style={[styles.warningText, { color: colors.muted }]}>
                Try reproducing a 500 error with the real API… you can't easily. That's why
                mocking exists.
              </Text>
            </View>
          )}

          <View style={styles.chipContainer}>
            {(Object.keys(scenarios) as ScenarioName[]).map(scenarioKey => (
              <View key={scenarioKey} style={styles.chipWrapper}>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        scenario === scenarioKey ? colors.tint : colors.surface,
                      borderColor: scenario === scenarioKey ? colors.tint : colors.border,
                    },
                    dataSource === 'real' && styles.chipDisabled,
                  ]}
                  onPress={() => handleScenarioChange(scenarioKey)}
                  disabled={dataSource === 'real'}
                  accessibilityRole="button"
                  accessibilityState={{ selected: scenario === scenarioKey }}>
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          scenario === scenarioKey
                            ? '#fff'
                            : dataSource === 'real'
                              ? colors.muted
                              : colors.text,
                      },
                    ]}>
                    {scenarioLabels[scenarioKey]}
                  </Text>
                </TouchableOpacity>
                {dataSource === 'msw' && (
                  <TouchableOpacity
                    onPress={() => handleShowCode(scenarioKey)}
                    style={styles.showCodeButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Show code for ${scenarioLabels[scenarioKey]}`}>
                    <Text style={[styles.showCodeText, { color: colors.tint }]}>
                      Show code
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Request Log */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Request Log</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
            Last {requestLog.length} requests
          </Text>

          {requestLog.length === 0 ? (
            <View style={[styles.emptyLog, { backgroundColor: colors.surface }]}>
              <Text style={[styles.emptyLogText, { color: colors.muted }]}>
                No requests yet. Refresh the Tasks screen to see activity.
              </Text>
            </View>
          ) : (
            <View style={styles.logContainer}>
              {requestLog.slice(0, 10).map(entry => (
                <View
                  key={entry.id}
                  style={[styles.logEntry, { backgroundColor: colors.surface }]}>
                  <View style={styles.logHeader}>
                    <Text style={[styles.logMethod, { color: colors.text }]}>
                      {entry.method}
                    </Text>
                    <Text style={[styles.logUrl, { color: colors.text }]}>{entry.url}</Text>
                    <View
                      style={[
                        styles.logSourceBadge,
                        {
                          backgroundColor:
                            entry.source === 'real'
                              ? colors.success
                              : entry.source === 'msw'
                                ? colors.tint
                                : '#f59e0b',
                        },
                      ]}>
                      <Text style={styles.logSourceText}>
                        {entry.source === 'real'
                          ? 'Real'
                          : entry.source === 'msw'
                            ? 'MSW'
                            : 'Mockifyer'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.logDetails}>
                    <Text style={[styles.logDetailText, { color: colors.muted }]}>
                      {entry.status
                        ? `${entry.status} · ${entry.duration}ms`
                        : `${entry.duration}ms`}
                    </Text>
                    {entry.scenario && (
                      <Text style={[styles.logDetailText, { color: colors.muted }]}>
                        Scenario: {scenarioLabels[entry.scenario as ScenarioName]}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Links */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Learn More</Text>
          <TouchableOpacity
            style={[styles.linkButton, { backgroundColor: colors.surface }]}
            onPress={() => Linking.openURL('https://mswjs.io/docs/')}
            accessibilityRole="link">
            <Text style={[styles.linkText, { color: colors.tint }]}>
              MSW Documentation →
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.linkButton, { backgroundColor: colors.surface }]}
            onPress={() => Linking.openURL('https://devxtools.dev/tools/msw/')}
            accessibilityRole="link">
            <Text style={[styles.linkText, { color: colors.tint }]}>
              devxtools.dev/tools/msw →
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CodeViewer
        visible={showCodeViewer}
        onClose={() => setShowCodeViewer(false)}
        scenario={selectedScenario}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: spacing.md,
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  segmentDisabled: {
    opacity: 0.5,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  warningBox: {
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chipWrapper: {
    alignItems: 'center',
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipDisabled: {
    opacity: 0.5,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  showCodeButton: {
    marginTop: 4,
  },
  showCodeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  logContainer: {
    gap: spacing.sm,
  },
  logEntry: {
    padding: spacing.md,
    borderRadius: 8,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  logMethod: {
    fontSize: 12,
    fontWeight: '600',
  },
  logUrl: {
    fontSize: 12,
    flex: 1,
  },
  logSourceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  logSourceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  logDetails: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  logDetailText: {
    fontSize: 11,
  },
  emptyLog: {
    padding: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyLogText: {
    fontSize: 14,
    textAlign: 'center',
  },
  linkButton: {
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  headerButton: {
    fontSize: 17,
  },
});
