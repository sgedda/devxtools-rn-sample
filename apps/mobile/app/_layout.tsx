import { useFonts } from 'expo-font';
import { Stack, SplashScreen } from 'expo-router';
import { useEffect } from 'react';
import { Linking } from 'react-native';
import 'react-native-reanimated';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/components/useColorScheme';
import { LabProvider } from '@/src/lab/LabContext';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 10, // 10 seconds
      retry: 1,
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
        <LabProvider>
          <QueryClientProvider client={queryClient}>
            <RootLayoutNav />
          </QueryClientProvider>
        </LabProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  // Handle deep links for lab scenarios
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url;
      console.log('[Deep Link]', url);
      // Deep link handling will be processed in the lab modal
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Handle initial URL if app was opened via deep link
    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colorScheme === 'dark' ? '#0b0b0f' : '#fff',
        },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="modal"
        options={{
          presentation: 'modal',
          headerShown: true,
          statusBarStyle: 'auto',
        }}
      />
      <Stack.Screen
        name="lab"
        options={{
          presentation: 'modal',
          headerShown: true,
          statusBarStyle: 'auto',
          title: 'Lab',
        }}
      />
      <Stack.Screen
        name="onboarding"
        options={{
          presentation: 'modal',
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}
