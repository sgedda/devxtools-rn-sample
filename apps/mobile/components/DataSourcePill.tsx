import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useLab, type DataSource } from '@/src/lab/LabContext';
import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';
import { scenarioLabels, type ScenarioName } from '@/src/mocks/scenarios';

export function DataSourcePill() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { dataSource, scenario } = useLab();

  const getLabel = () => {
    const sourceLabels: Record<DataSource, string> = {
      real: 'Real API',
      msw: 'Mocked',
      mockifyer: 'Recorded',
    };

    const baseLabel = sourceLabels[dataSource];
    if (scenario && dataSource === 'msw') {
      return `${baseLabel} · ${scenarioLabels[scenario as ScenarioName]}`;
    }
    return baseLabel;
  };

  const getColor = () => {
    switch (dataSource) {
      case 'real':
        return colors.success;
      case 'msw':
        return colors.tint;
      case 'mockifyer':
        return '#f59e0b';
    }
  };

  const getAccessibilityLabel = () => {
    let label = `Data source: ${dataSource === 'real' ? 'Real API' : dataSource === 'msw' ? 'Mocked by MSW' : 'Recorded by Mockifyer'}`;
    if (scenario) {
      label += `, scenario: ${scenarioLabels[scenario as ScenarioName]}`;
    }
    label += '. Double-tap to change';
    return label;
  };

  return (
    <TouchableOpacity
      style={[styles.pill, { backgroundColor: colors.surface }]}
      onPress={() => router.push('/lab')}
      accessibilityRole="button"
      accessibilityLabel={getAccessibilityLabel()}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
      <View style={[styles.indicator, { backgroundColor: getColor() }]} />
      <Text style={[styles.label, { color: colors.text }]}>{getLabel()}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    minHeight: 32,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
