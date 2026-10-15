import { useFonts } from 'expo-font';
import { Stack, SplashScreen, useRouter } from 'expo-router';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, TouchableOpacity, Text } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import { LabProvider, useLab } from '@/src/lab/LabContext';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 10, // 10 seconds
    },
  },
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // SpaceMono removed - not needed
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <LabProvider>
            <RootLayoutNav />
          </LabProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { hasCompletedWalkthrough, labReady } = useLab();

  useEffect(() => {
    if (labReady && !hasCompletedWalkthrough) {
      router.push('/onboarding');
    }
  }, [hasCompletedWalkthrough, labReady, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colorScheme === 'dark' ? '#0b0b0f' : '#fff',
        },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="modal"
        options={{
          presentation: 'modal',
          headerShown: true,
          statusBarStyle: 'auto',
          title: 'New Task',
          ...(Platform.OS === 'web' && {
            headerLeft: (props: any) => (
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ paddingLeft: 16 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={{ fontSize: 17, color: props.tintColor || '#007AFF' }}>Cancel</Text>
              </TouchableOpacity>
            ),
          }),
        }}
      />
      <Stack.Screen
        name="lab"
        options={{
          presentation: 'modal',
          headerShown: true,
          statusBarStyle: 'auto',
          title: 'Lab',
          ...(Platform.OS === 'web' && {
            headerLeft: (props: any) => (
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ paddingLeft: 16 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={{ fontSize: 17, color: props.tintColor || '#007AFF' }}>Close</Text>
              </TouchableOpacity>
            ),
          }),
        }}
      />
      <Stack.Screen
        name="onboarding"
        options={{
          presentation: 'fullScreenModal',
          headerShown: false,
          gestureEnabled: false,
          animation: 'fade',
        }}
      />
    </Stack>
  );
}
