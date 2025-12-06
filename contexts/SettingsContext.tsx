import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings } from '@/types/crm';

import { changeLanguage } from '@/i18n';

const SETTINGS_STORAGE_KEY = 'crm_settings';

const DEFAULT_SETTINGS: AppSettings = {
  notificationsEnabled: true,
  lowStockAlertEnabled: true,
  paymentReminderEnabled: true,
  autoResetCanceledClients: true,
  canceledResetIntervalHours: 48,
  theme: 'light',
  currency: 'USD',
  language: 'en',
  lastCanceledReset: undefined,
};

export const [SettingsContext, useSettings] = createContextHook(() => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      console.log('[SettingsContext] Loading settings from storage');
      const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        console.log('[SettingsContext] Loaded settings:', parsedSettings);
        // Merge with defaults to ensure new fields (like currency) are present
        return { ...DEFAULT_SETTINGS, ...parsedSettings };
      }
      console.log('[SettingsContext] No stored settings, using defaults');
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (updatedSettings: AppSettings) => {
      console.log('[SettingsContext] Saving settings to storage:', updatedSettings);
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));
      return updatedSettings;
    },
  });

  useEffect(() => {
    if (settingsQuery.data) {
      setSettings(settingsQuery.data);
    }
  }, [settingsQuery.data]);



  const updateSettings = (updates: Partial<AppSettings>) => {
    console.log('[SettingsContext] Updating settings:', updates);
    const updated = { ...settings, ...updates };
    setSettings(updated);
    saveMutation.mutate(updated);

    // Sync language with i18n
    if (updates.language) {
      changeLanguage(updates.language);
    }
  };

  return {
    settings,
    isLoading: settingsQuery.isLoading,
    updateSettings,
  };
});
