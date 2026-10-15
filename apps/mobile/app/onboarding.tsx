import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import Colors, { spacing } from '@/constants/Colors';
import { useLab } from '@/src/lab/LabContext';

const CARDS = [
  {
    title: 'The Problem',
    content:
      "Your backend is down, not built yet, or can't return a 500 error on demand. Real APIs are unpredictable and slow to test.",
    highlight: 'You need a way to control the data.',
  },
  {
    title: 'The Fix',
    content:
      'Intercept requests at the network layer with MSW (Mock Service Worker). Your app code stays exactly the same.',
    highlight: 'Only the network layer changes.',
  },
  {
    title: 'Edge Cases on Demand',
    content:
      'Tap a scenario chip in the Lab: empty, slow, 500, offline. Watch your UI states instantly, no backend changes needed.',
    highlight: 'One tap = any edge case.',
  },
  {
    title: 'Same Mocks in Tests',
    content:
      'The exact same MSW handlers power both the Lab UI and your Jest tests. Write once, use everywhere.',
    highlight: 'This is the teaching moment.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { completeWalkthrough } = useLab();
  const [currentCard, setCurrentCard] = useState(0);

  const handleNext = () => {
    if (currentCard < CARDS.length - 1) {
      setCurrentCard(currentCard + 1);
    } else {
      completeWalkthrough();
      router.back();
    }
  };

  const handleSkip = () => {
    completeWalkthrough();
    router.back();
  };

  const card = CARDS[currentCard];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkip}
        accessibilityRole="button"
        accessibilityLabel="Skip walkthrough">
        <Text style={[styles.skipText, { color: colors.muted }]}>Skip</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={[styles.numberBadge, { backgroundColor: colors.tint }]}>
            <Text style={styles.numberText}>{currentCard + 1}</Text>
          </View>

          <Text style={[styles.title, { color: colors.text }]} maxFontSizeMultiplier={1.4}>
            {card.title}
          </Text>

          <Text style={[styles.content, { color: colors.text }]} maxFontSizeMultiplier={1.3}>
            {card.content}
          </Text>

          <View style={[styles.highlightBox, { backgroundColor: colors.surface }]}>
            <Text
              style={[styles.highlight, { color: colors.tint }]}
              maxFontSizeMultiplier={1.2}>
              💡 {card.highlight}
            </Text>
          </View>
        </View>

        <View style={styles.pagination}>
          {CARDS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === currentCard ? colors.tint : colors.border,
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.tint }]}
          onPress={handleNext}
          accessibilityRole="button"
          accessibilityLabel={currentCard < CARDS.length - 1 ? 'Next' : 'Get started'}>
          <Text style={styles.buttonText} maxFontSizeMultiplier={1.2}>
            {currentCard < CARDS.length - 1 ? 'Next' : 'Get Started'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: spacing.lg,
    zIndex: 10,
    padding: spacing.sm,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 100,
    paddingBottom: spacing.xxl,
  },
  card: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  numberBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  numberText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  contentText: {
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  highlightBox: {
    padding: spacing.lg,
    borderRadius: 12,
    marginTop: spacing.xl,
    width: '100%',
  },
  highlight: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  button: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderRadius: 12,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
