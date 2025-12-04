import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ClientsContext } from '@/contexts/ClientsContext';
import { ServicesContext } from '@/contexts/ServicesContext';
import { NotificationsContext } from '@/contexts/NotificationsContext';
import { SettingsContext } from '@/contexts/SettingsContext';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
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
      <SettingsContext>
        <ServicesContext>
          <NotificationsContext>
            <ClientsContext>
              <GestureHandlerRootView>
                <RootLayoutNav />
              </GestureHandlerRootView>
            </ClientsContext>
          </NotificationsContext>
        </ServicesContext>
      </SettingsContext>
    </QueryClientProvider>
  );
}
