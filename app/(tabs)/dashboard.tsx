import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Stack } from 'expo-router';
import { TrendingUp, DollarSign, Users, AlertTriangle, Clock } from 'lucide-react-native';
import { useClients } from '@/contexts/ClientsContext';
import { useServices } from '@/contexts/ServicesContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { clients } = useClients();
  const { services } = useServices();
  const { settings } = useSettings();

  const paidClients = clients.filter(c => c.paymentStatus === 'paid');
  const unpaidClients = clients.filter(c => c.paymentStatus === 'unpaid');
  const canceledClients = clients.filter(c => c.paymentStatus === 'canceled');

  const totalRevenue = paidClients.reduce((sum, client) => sum + (client.price || 0), 0);
  const pendingRevenue = unpaidClients.reduce((sum, client) => sum + (client.price || 0), 0);

  const lowStockServices = services.filter(s => {
    const available = s.totalQuantity - s.usedQuantity;
    return available <= s.lowStockThreshold;
  });

  const recentClients = [...clients]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(settings.language, {
      style: 'currency',
      currency: settings.currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'unpaid': return '#F59E0B';
      case 'canceled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: t('dashboard.title'),
        headerStyle: { backgroundColor: '#1F2937' },
        headerTintColor: '#FFFFFF',
        headerShadowVisible: false,
      }} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, { backgroundColor: '#10B981' }]}>
            <View style={styles.kpiIconContainer}>
              <DollarSign size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.kpiValue}>{formatCurrency(totalRevenue)}</Text>
            <Text style={styles.kpiLabel}>{t('dashboard.totalRevenue')}</Text>
            <Text style={styles.kpiSubtext}>{t('dashboard.paidClients', { count: paidClients.length })}</Text>
          </View>

          <View style={[styles.kpiCard, { backgroundColor: '#F59E0B' }]}>
            <View style={styles.kpiIconContainer}>
              <Clock size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.kpiValue}>{formatCurrency(pendingRevenue)}</Text>
            <Text style={styles.kpiLabel}>{t('dashboard.pending')}</Text>
            <Text style={styles.kpiSubtext}>{t('dashboard.unpaidClients', { count: unpaidClients.length })}</Text>
          </View>

          <View style={[styles.kpiCard, { backgroundColor: '#3B82F6' }]}>
            <View style={styles.kpiIconContainer}>
              <Users size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.kpiValue}>{clients.length}</Text>
            <Text style={styles.kpiLabel}>{t('dashboard.totalClients')}</Text>
            <Text style={styles.kpiSubtext}>{t('dashboard.canceledClients', { count: canceledClients.length })}</Text>
          </View>

          <View style={[styles.kpiCard, { backgroundColor: '#EF4444' }]}>
            <View style={styles.kpiIconContainer}>
              <AlertTriangle size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.kpiValue}>{lowStockServices.length}</Text>
            <Text style={styles.kpiLabel}>{t('dashboard.lowStock')}</Text>
            <Text style={styles.kpiSubtext}>{t('dashboard.servicesAlert')}</Text>
          </View>
        </View>

        {lowStockServices.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AlertTriangle size={20} color="#EF4444" />
              <Text style={styles.sectionTitle}>{t('dashboard.lowStockAlerts')}</Text>
            </View>
            {lowStockServices.map(service => {
              const available = service.totalQuantity - service.usedQuantity;
              return (
                <View key={service.id} style={styles.alertCard}>
                  <View style={styles.alertLeft}>
                    <Text style={styles.alertServiceName}>{service.name}</Text>
                    <Text style={styles.alertText}>
                      {t('dashboard.remaining', { count: available, total: service.totalQuantity })}
                    </Text>
                  </View>
                  <View style={styles.alertBadge}>
                    <Text style={styles.alertBadgeText}>{available}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={20} color="#10B981" />
            <Text style={styles.sectionTitle}>{t('dashboard.recentClients')}</Text>
          </View>
          {recentClients.map(client => {
            const service = services.find(s => s.id === client.serviceId);
            return (
              <TouchableOpacity key={client.id} style={styles.clientCard}>
                <View style={styles.clientLeft}>
                  <Text style={styles.clientName}>{client.name}</Text>
                  <Text style={styles.clientService}>{service?.name || t('dashboard.unknownService')}</Text>
                  <Text style={styles.clientDate}>{formatDate(client.createdAt)}</Text>
                </View>
                <View style={styles.clientRight}>
                  <Text style={styles.clientPrice}>{formatCurrency(client.price)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(client.paymentStatus) }]}>
                    <Text style={styles.statusText}>{t(`clients.${client.paymentStatus}`)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
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
  scrollView: {
    flex: 1,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  kpiCard: {
    width: (width - 36) / 2,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  kpiIconContainer: {
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  kpiSubtext: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.7,
    marginTop: 4,
  },
  section: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  alertCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  alertLeft: {
    flex: 1,
  },
  alertServiceName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  alertBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  alertBadgeText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  clientCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  clientLeft: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  clientService: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  clientDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  clientRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  clientPrice: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#10B981',
    marginBottom: 8,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    textTransform: 'capitalize' as const,
  },
  bottomSpacer: {
    height: 24,
  },
});
