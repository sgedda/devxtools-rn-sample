import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import * as Haptics from 'expo-haptics';
import { Swipeable } from 'react-native-gesture-handler';
import { apiClient, ApiError, API_BASE_URL } from '@/src/api/client';
import type { Task } from '@devxtools/shared';
import { useColorScheme } from '@/components/useColorScheme';
import Colors, { spacing } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLab } from '@/src/lab/LabContext';
import { scenarioLabels } from '@/src/mocks/scenarios';

type UndoAction = {
  type: 'delete';
  task: Task;
  timeoutId: ReturnType<typeof setTimeout>;
};

export default function TasksScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { addLogEntry, dataSource, scenario } = useLab();
  const [isOnline, setIsOnline] = React.useState(true);
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);
  const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set());

  // Monitor network status
  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true);
    });
    return () => unsubscribe();
  }, []);

  // Invalidate tasks query when data source or scenario changes
  React.useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  }, [dataSource, scenario, queryClient]);

  const {
    data: tasks = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const startTime = Date.now();
      try {
        const result = await apiClient.getTasks();
        const duration = Date.now() - startTime;

        addLogEntry({
          id: `${Date.now()}`,
          timestamp: Date.now(),
          method: 'GET',
          url: '/tasks',
          status: 200,
          duration,
          source: dataSource === 'real' ? 'real' : dataSource === 'msw' ? 'msw' : 'mockifyer',
          scenario: scenario || undefined,
        });

        return result;
      } catch (err) {
        const duration = Date.now() - startTime;
        addLogEntry({
          id: `${Date.now()}`,
          timestamp: Date.now(),
          method: 'GET',
          url: '/tasks',
          status: err instanceof ApiError ? err.status : undefined,
          duration,
          source: dataSource === 'real' ? 'real' : dataSource === 'msw' ? 'msw' : 'mockifyer',
          scenario: scenario || undefined,
        });
        throw err;
      }
    },
    retry: 1,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      apiClient.toggleTask(id, completed),
    onMutate: async ({ id, completed }) => {
      await Haptics.selectionAsync();

      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks']);

      queryClient.setQueryData<Task[]>(['tasks'], old =>
        old?.map(task => (task.id === id ? { ...task, completed } : task))
      );

      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', "Couldn't update task. Please try again.");
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteTask(id),
    onMutate: async id => {
      setPendingDeletes(prev => new Set(prev).add(id));
      return { id };
    },
    onError: (err, id, context) => {
      setPendingDeletes(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      if (context?.id && undoAction?.task.id === context.id) {
        queryClient.setQueryData<Task[]>(['tasks'], old => {
          if (!old) return [undoAction.task];
          return [...old, undoAction.task].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', "Couldn't delete task. Please try again.");
    },
    onSuccess: (_, id) => {
      setPendingDeletes(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      queryClient.setQueryData<Task[]>(['tasks'], old => old?.filter(t => t.id !== id));
    },
  });

  const handleToggle = (task: Task) => {
    toggleMutation.mutate({ id: task.id, completed: !task.completed });
  };

  const handleDelete = (task: Task) => {
    if (undoAction) {
      clearTimeout(undoAction.timeoutId);
      deleteMutation.mutate(undoAction.task.id);
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    queryClient.setQueryData<Task[]>(['tasks'], old => old?.filter(t => t.id !== task.id));

    const timeoutId = setTimeout(() => {
      deleteMutation.mutate(task.id);
      setUndoAction(null);
    }, 5000);

    setUndoAction({ type: 'delete', task, timeoutId });
  };

  const handleUndo = () => {
    if (!undoAction) return;

    clearTimeout(undoAction.timeoutId);
    queryClient.setQueryData<Task[]>(['tasks'], old => {
      if (!old) return [undoAction.task];
      return [...old, undoAction.task].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
    setUndoAction(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
    task: Task
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.deleteAction}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Text
            style={styles.deleteActionText}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${task.title}`}
          >
            Delete
          </Text>
        </Animated.View>
      </View>
    );
  };

  const renderTask = ({ item: task }: { item: Task }) => {
    const isDeleting = pendingDeletes.has(task.id);

    return (
      <Swipeable
        renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, task)}
        onSwipeableOpen={() => handleDelete(task)}
        overshootRight={false}
        enabled={!isDeleting}
      >
        <View
          style={[
            styles.taskItem,
            { backgroundColor: colors.card, borderBottomColor: colors.border },
            isDeleting && styles.taskDeleting,
          ]}
        >
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => handleToggle(task)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: task.completed }}
            accessibilityLabel={task.title}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View
              style={[
                styles.checkboxCircle,
                {
                  borderColor: task.completed ? colors.tint : colors.border,
                  backgroundColor: task.completed ? colors.tint : 'transparent',
                },
              ]}
            >
              {task.completed && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>

          <View style={styles.taskContent}>
            <Text
              style={[
                styles.taskTitle,
                { color: colors.text },
                task.completed && styles.taskTitleCompleted,
              ]}
              numberOfLines={2}
              maxFontSizeMultiplier={1.3}
            >
              {task.title}
            </Text>
            <Text style={[styles.taskDate, { color: colors.muted }]} maxFontSizeMultiplier={1.2}>
              {getRelativeTime(task.createdAt)}
            </Text>
          </View>
        </View>
      </Swipeable>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyContainer} testID="tasks-empty">
        <Text style={[styles.emptyTitle, { color: colors.text }]} maxFontSizeMultiplier={1.3}>
          No tasks yet
        </Text>
        <Text style={[styles.emptyText, { color: colors.muted }]} maxFontSizeMultiplier={1.2}>
          Tap the + button above to add your first task
        </Text>
      </View>
    );
  };

  const renderError = () => {
    const errorMessage =
      error instanceof ApiError ? error.message : "Couldn't load tasks. Please try again.";

    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorTitle, { color: colors.text }]} maxFontSizeMultiplier={1.3}>
          Error
        </Text>
        <Text style={[styles.errorText, { color: colors.muted }]} maxFontSizeMultiplier={1.2}>
          {errorMessage}
        </Text>
        {!isOnline && (
          <Text style={[styles.errorText, { color: colors.muted }]} maxFontSizeMultiplier={1.2}>
            You appear to be offline. Check your connection.
          </Text>
        )}
        <Text style={[styles.errorSubtext, { color: colors.muted }]} maxFontSizeMultiplier={1.1}>
          API: {API_BASE_URL}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.tint }]}
          onPress={() => refetch()}
          accessibilityRole="button"
          accessibilityLabel="Retry loading tasks"
          testID="retry-button"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.retryButtonText} maxFontSizeMultiplier={1.2}>
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSkeleton = () => (
    <View
      style={styles.skeletonContainer}
      accessibilityLabel="Loading tasks"
      testID="tasks-loading"
    >
      {[...Array(5)].map((_, i) => (
        <View
          key={i}
          style={[styles.skeletonItem, { backgroundColor: colors.surface }]}
          accessible={false}
        >
          <View style={[styles.skeletonCircle, { backgroundColor: colors.border }]} />
          <View style={styles.skeletonContent}>
            <View
              style={[
                styles.skeletonLine,
                styles.skeletonLineTitle,
                { backgroundColor: colors.border },
              ]}
            />
            <View
              style={[
                styles.skeletonLine,
                styles.skeletonLineSubtitle,
                { backgroundColor: colors.border },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderSkeleton()}
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]} testID="tasks-error">
        {renderError()}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="tasks-screen">
      {!isOnline && (
        <View
          style={[styles.offlineBanner, { backgroundColor: colors.surface }]}
          testID="offline-banner"
        >
          <Text style={[styles.offlineText, { color: colors.muted }]} maxFontSizeMultiplier={1.2}>
            You're offline
          </Text>
        </View>
      )}

      <FlatList
        testID="tasks-list"
        data={tasks}
        renderItem={renderTask}
        keyExtractor={item => item.id}
        ListEmptyComponent={renderEmpty}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, spacing.lg),
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.tint}
            colors={[colors.tint]}
          />
        }
      />

      {undoAction && (
        <View
          style={[
            styles.snackbar,
            { backgroundColor: colors.surface, bottom: Math.max(insets.bottom, spacing.md) },
          ]}
          testID="undo-snackbar"
        >
          <Text style={[styles.snackbarText, { color: colors.text }]} maxFontSizeMultiplier={1.2}>
            Task deleted
          </Text>
          <TouchableOpacity
            onPress={handleUndo}
            accessibilityRole="button"
            accessibilityLabel="Undo delete"
            testID="undo-button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.snackbarAction, { color: colors.tint }]}>Undo</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;

  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  offlineBanner: {
    padding: spacing.sm,
    alignItems: 'center',
  },
  offlineText: {
    fontSize: 14,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  taskDeleting: {
    opacity: 0.5,
  },
  checkbox: {
    marginRight: spacing.md,
  },
  checkboxCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  taskDate: {
    fontSize: 12,
  },
  deleteAction: {
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
  },
  deleteActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  errorSubtext: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 8,
    minHeight: 44,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skeletonContainer: {
    padding: spacing.lg,
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  skeletonCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: spacing.md,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
  },
  skeletonLineTitle: {
    width: '70%',
    marginBottom: 8,
  },
  skeletonLineSubtitle: {
    width: '40%',
  },
  snackbar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  snackbarText: {
    fontSize: 14,
  },
  snackbarAction: {
    fontSize: 14,
    fontWeight: '600',
  },
});
