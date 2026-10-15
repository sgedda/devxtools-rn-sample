import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { apiClient, ApiError } from '@/src/api/client';
import type { Task } from '@devxtools/shared';
import { useColorScheme } from '@/components/useColorScheme';
import Colors, { spacing } from '@/constants/Colors';

const MAX_TITLE_LENGTH = 200;

export default function NewTaskModal() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const queryClient = useQueryClient();
  const inputRef = useRef<TextInput>(null);

  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Auto-focus the input when modal opens
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const createMutation = useMutation({
    mutationFn: (taskTitle: string) => apiClient.createTask(taskTitle),
    onMutate: async taskTitle => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      // Optimistic update with temporary task
      const tempId = `temp-${Date.now()}`;
      const tempTask: Task = {
        id: tempId,
        title: taskTitle,
        completed: false,
        createdAt: new Date().toISOString(),
      };

      const previousTasks = queryClient.getQueryData<Task[]>(['tasks']);
      queryClient.setQueryData<Task[]>(['tasks'], old => [tempTask, ...(old || [])]);

      return { previousTasks, tempId };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }

      const errorMessage =
        err instanceof ApiError ? err.message : 'Failed to create task. Please try again.';
      setError(errorMessage);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
    onSuccess: (newTask, variables, context) => {
      // Replace temp task with real one
      queryClient.setQueryData<Task[]>(['tasks'], old => {
        if (!old) return [newTask];
        return old.map(task => (task.id === context?.tempId ? newTask : task));
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    },
  });

  const handleSave = () => {
    const trimmedTitle = title.trim();

    setError(null);

    if (!trimmedTitle) {
      setError('Title cannot be empty');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (trimmedTitle.length > MAX_TITLE_LENGTH) {
      setError(`Title must be ${MAX_TITLE_LENGTH} characters or less`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    createMutation.mutate(trimmedTitle);
  };

  const canSave = title.trim().length > 0 && title.trim().length <= MAX_TITLE_LENGTH;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'New task',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              disabled={createMutation.isPending}
            >
              <Text style={[styles.headerButton, { color: colors.tint }]}>Cancel</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSave}
              disabled={!canSave || createMutation.isPending}
              accessibilityRole="button"
              accessibilityLabel="Save task"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {createMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.tint} />
              ) : (
                <Text
                  style={[
                    styles.headerButton,
                    styles.headerButtonSave,
                    { color: canSave ? colors.tint : colors.muted },
                  ]}
                >
                  Save
                </Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.container, { backgroundColor: colors.background }]}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.text }]} maxFontSizeMultiplier={1.2}>
              Task title
            </Text>
            <TextInput
              ref={inputRef}
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.surface,
                  borderColor: error ? colors.danger : colors.border,
                },
              ]}
              placeholder="What needs to be done?"
              placeholderTextColor={colors.muted}
              value={title}
              onChangeText={text => {
                setTitle(text);
                setError(null);
              }}
              maxLength={MAX_TITLE_LENGTH + 10} // Allow typing past limit to show error
              returnKeyType="done"
              onSubmitEditing={handleSave}
              enablesReturnKeyAutomatically
              editable={!createMutation.isPending}
              accessibilityLabel="Task title input"
            />

            <View style={styles.inputFooter}>
              <View style={{ flex: 1 }}>
                {error && (
                  <Text
                    style={[styles.errorText, { color: colors.danger }]}
                    maxFontSizeMultiplier={1.2}
                    accessibilityLiveRegion="polite"
                    accessibilityRole="alert"
                  >
                    {error}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.characterCount,
                  {
                    color: title.length > MAX_TITLE_LENGTH ? colors.danger : colors.muted,
                  },
                ]}
                maxFontSizeMultiplier={1.1}
              >
                {title.length}/{MAX_TITLE_LENGTH}
              </Text>
            </View>

            <Text style={[styles.hint, { color: colors.muted }]} maxFontSizeMultiplier={1.1}>
              Tip: Keep it short and actionable
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  form: {
    padding: spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  input: {
    fontSize: 16,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  characterCount: {
    fontSize: 12,
  },
  hint: {
    fontSize: 14,
    marginTop: spacing.md,
  },
  headerButton: {
    fontSize: 17,
  },
  headerButtonSave: {
    fontWeight: '600',
  },
});
