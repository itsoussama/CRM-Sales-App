import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Settings as SettingsIcon, Bell, Moon, Sun, RefreshCw, LogOut, User as UserIcon, Shield, Globe } from 'lucide-react-native';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();
  const { currentUser, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      t('settings.logout'),
      t('settings.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.logout'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: t('settings.title'),
        headerStyle: { backgroundColor: '#1F2937' },
        headerTintColor: '#FFFFFF',
        headerShadowVisible: false,
      }} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.profile')}</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileIcon}>
              {currentUser?.role === 'admin' ? (
                <Shield size={32} color="#3B82F6" />
              ) : (
                <UserIcon size={32} color="#3B82F6" />
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{currentUser?.name}</Text>
              <Text style={styles.profileEmail}>{currentUser?.email}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{currentUser?.role?.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={20} color="#3B82F6" />
            <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>{t('settings.enableNotifications')}</Text>
              <Text style={styles.settingDescription}>{t('settings.receiveAppNotifications')}</Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(value) => updateSettings({ notificationsEnabled: value })}
              trackColor={{ false: '#374151', true: '#3B82F6' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>{t('settings.lowStockAlerts')}</Text>
              <Text style={styles.settingDescription}>{t('settings.alertLowStock')}</Text>
            </View>
            <Switch
              value={settings.lowStockAlertEnabled}
              onValueChange={(value) => updateSettings({ lowStockAlertEnabled: value })}
              trackColor={{ false: '#374151', true: '#3B82F6' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>{t('settings.paymentReminders')}</Text>
              <Text style={styles.settingDescription}>{t('settings.remindPending')}</Text>
            </View>
            <Switch
              value={settings.paymentReminderEnabled}
              onValueChange={(value) => updateSettings({ paymentReminderEnabled: value })}
              trackColor={{ false: '#374151', true: '#3B82F6' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Localization Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Globe size={20} color="#3B82F6" />
            <Text style={styles.sectionTitle}>{t('settings.localization')}</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>{t('settings.currency')}</Text>
              <Text style={styles.settingDescription}>{t('settings.selectCurrency')}</Text>
            </View>
            <View style={styles.intervalButtons}>
              {['USD', 'MAD', 'EUR'].map((curr) => (
                <TouchableOpacity
                  key={curr}
                  style={[
                    styles.intervalButton,
                    settings.currency === curr && styles.intervalButtonActive,
                  ]}
                  onPress={() => updateSettings({ currency: curr as any })}
                >
                  <Text
                    style={[
                      styles.intervalButtonText,
                      settings.currency === curr && styles.intervalButtonTextActive,
                    ]}
                  >
                    {curr}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>{t('settings.language')}</Text>
              <Text style={styles.settingDescription}>{t('settings.selectLanguage')}</Text>
            </View>
            <View style={styles.intervalButtons}>
              {[
                { code: 'en', label: 'EN' },
                { code: 'fr', label: 'FR' },
                { code: 'ar', label: 'AR' },
              ].map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.intervalButton,
                    settings.language === lang.code && styles.intervalButtonActive,
                  ]}
                  onPress={() => updateSettings({ language: lang.code as any })}
                >
                  <Text
                    style={[
                      styles.intervalButtonText,
                      settings.language === lang.code && styles.intervalButtonTextActive,
                    ]}
                  >
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            {settings.theme === 'dark' ? (
              <Moon size={20} color="#3B82F6" />
            ) : (
              <Sun size={20} color="#3B82F6" />
            )}
            <Text style={styles.sectionTitle}>{t('settings.appearance')}</Text>
          </View>

          <View style={styles.themeOptions}>
            <TouchableOpacity
              style={[styles.themeOption, settings.theme === 'light' && styles.themeOptionActive]}
              onPress={() => updateSettings({ theme: 'light' })}
            >
              <Sun size={24} color={settings.theme === 'light' ? '#3B82F6' : '#9CA3AF'} />
              <Text style={[styles.themeOptionText, settings.theme === 'light' && styles.themeOptionTextActive]}>
                {t('settings.light')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.themeOption, settings.theme === 'dark' && styles.themeOptionActive]}
              onPress={() => updateSettings({ theme: 'dark' })}
            >
              <Moon size={24} color={settings.theme === 'dark' ? '#3B82F6' : '#9CA3AF'} />
              <Text style={[styles.themeOptionText, settings.theme === 'dark' && styles.themeOptionTextActive]}>
                {t('settings.dark')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.themeOption, settings.theme === 'auto' && styles.themeOptionActive]}
              onPress={() => updateSettings({ theme: 'auto' })}
            >
              <SettingsIcon size={24} color={settings.theme === 'auto' ? '#3B82F6' : '#9CA3AF'} />
              <Text style={[styles.themeOptionText, settings.theme === 'auto' && styles.themeOptionTextActive]}>
                {t('settings.auto')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Client Management Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <RefreshCw size={20} color="#3B82F6" />
            <Text style={styles.sectionTitle}>{t('settings.clientManagement')}</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>{t('settings.autoReset')}</Text>
              <Text style={styles.settingDescription}>
                {t('settings.resetInterval', { hours: settings.canceledResetIntervalHours })}
              </Text>
            </View>
            <Switch
              value={settings.autoResetCanceledClients}
              onValueChange={(value) => updateSettings({ autoResetCanceledClients: value })}
              trackColor={{ false: '#374151', true: '#3B82F6' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>{t('settings.interval')}</Text>
              <Text style={styles.settingDescription}>{t('settings.hoursBetween')}</Text>
            </View>
            <View style={styles.intervalButtons}>
              {[24, 48, 72].map((hours) => (
                <TouchableOpacity
                  key={hours}
                  style={[
                    styles.intervalButton,
                    settings.canceledResetIntervalHours === hours && styles.intervalButtonActive,
                  ]}
                  onPress={() => updateSettings({ canceledResetIntervalHours: hours })}
                >
                  <Text
                    style={[
                      styles.intervalButtonText,
                      settings.canceledResetIntervalHours === hours && styles.intervalButtonTextActive,
                    ]}
                  >
                    {hours}h
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Logout Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.logoutButtonText}>{t('settings.logout')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  profileIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#3B82F6',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingLeft: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeOptionActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#1E3A8A',
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#9CA3AF',
    marginTop: 8,
  },
  themeOptionTextActive: {
    color: '#3B82F6',
  },
  intervalButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  intervalButton: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  intervalButtonActive: {
    backgroundColor: '#3B82F6',
  },
  intervalButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#9CA3AF',
  },
  intervalButtonTextActive: {
    color: '#FFFFFF',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7F1D1D',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#EF4444',
  },
  bottomSpacer: {
    height: 24,
  },
});
