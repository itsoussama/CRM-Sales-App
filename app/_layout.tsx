import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ClientsContext } from '@/contexts/ClientsContext';
import { ServicesContext } from '@/contexts/ServicesContext';
import { NotificationsContext } from '@/contexts/NotificationsContext';
import { SettingsContext } from '@/contexts/SettingsContext';
import { AuthContext, useAuth } from '@/contexts/AuthContext';
import { SafeAreaViewBase } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import '@/i18n'; // Initialize i18n

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)';

    if (!isAuthenticated && inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login');
    } else if (isAuthenticated && !inAuthGroup) {
      // Redirect to app if authenticated
      router.replace('/(tabs)/dashboard');
    }
  }, [isAuthenticated, isLoading, segments]);

  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext>
        <SettingsContext>
          <NotificationsContext>
            <ServicesContext>
              <ClientsContext>      
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <RootLayoutNav />
                </GestureHandlerRootView>
              </ClientsContext>
            </ServicesContext>
          </NotificationsContext>
        </SettingsContext>
      </AuthContext>
    </QueryClientProvider>
  );
}
