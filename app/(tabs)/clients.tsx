import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, Animated, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Plus, Search, X as XIcon, Clock, CheckCircle, ChevronDown, UserPlus, Download } from 'lucide-react-native';
import { generateClientsCSV, shareFile } from '@/utils/export';
import { useFilteredClients, useClients } from '@/contexts/ClientsContext';
import { useServices } from '@/contexts/ServicesContext';
import { useSettings } from '@/contexts/SettingsContext';
import { PaymentStatus, SubscriptionPeriod, Client } from '@/types/crm';
import { getSubscriptionLabel, SUBSCRIPTION_PERIODS } from '@/constants/subscription-periods';
import { useTranslation } from 'react-i18next';

type FilterTab = 'all' | PaymentStatus;

export default function ClientsScreen() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const router = useRouter();
  const { clients, addClient, markAsPaid, cancelClient, renewSubscription } = useClients();
  const { services } = useServices();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClient, setNewClient] = useState<{
    name: string;
    email: string;
    phone: string;
    phoneRegion: string;
    serviceId: string;
    subscriptionPeriod: SubscriptionPeriod;
    customPeriodMonths: string;
    price: string;
    notes: string;
  }>({
    name: '',
    email: '',
    phone: '',
    phoneRegion: '+212',
    serviceId: '',
    subscriptionPeriod: '1month',
    customPeriodMonths: '',
    price: '',
    notes: '',
  });
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [fabScale] = useState(new Animated.Value(1));
  const [isExporting, setIsExporting] = useState(false);

  const regions = [
    { code: '+212', label: 'Morocco' },
    { code: '+1', label: 'USA/Canada' },
    { code: '+33', label: 'France' },
    { code: '+34', label: 'Spain' },
    { code: '+44', label: 'UK' },
    { code: '+971', label: 'UAE' },
    { code: '+966', label: 'Saudi Arabia' },
  ];

  const searchResults = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone.includes(searchQuery);
    
    const matchesFilter = activeFilter === 'all' || client.paymentStatus === activeFilter;
    
    return matchesSearch && matchesFilter;
  });

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const handleMarkPaid = async () => {
    if (selectedClientId && paymentAmount) {
      try {
        await markAsPaid(selectedClientId, parseFloat(paymentAmount));
        setShowQuickActions(false);
        setPaymentAmount('');
        Alert.alert(t('common.success'), t('clients.paymentSuccess'));
      } catch (error) {
        Alert.alert(t('common.error'), t('clients.paymentError'));
      }
    }
  };

  const handleCancel = () => {
    if (selectedClientId) {
      Alert.alert(
        t('clients.cancelTitle'),
        t('clients.cancelConfirm'),
        [
          { text: t('common.no'), style: 'cancel' },
          { 
            text: t('common.yes'), 
            style: 'destructive',
            onPress: async () => {
              try {
                await cancelClient(selectedClientId);
                setShowQuickActions(false);
              } catch (error) {
                Alert.alert(t('common.error'), t('clients.cancelError'));
              }
            }
          }
        ]
      );
    }
  };

  const handleRenew = async (months: number) => {
    if (selectedClientId) {
      try {
        await renewSubscription(selectedClientId, months);
        setShowQuickActions(false);
        Alert.alert(t('common.success'), t('clients.renewSuccess', { months }));
      } catch (error) {
        Alert.alert(t('common.error'), t('clients.renewError'));
      }
    }
  };

  const resetForm = () => {
    setNewClient({
      name: '',
      email: '',
      phone: '',
      phoneRegion: '+212',
      serviceId: '',
      subscriptionPeriod: '1month',
      customPeriodMonths: '',
      price: '',
      notes: '',
    });
  };

  const handleAddClient = async () => {
    if (!newClient.name || !newClient.email || !newClient.phone || !newClient.serviceId) {
      Alert.alert(t('common.error'), t('common.fillRequired'));
      return;
    }

    if (newClient.subscriptionPeriod === 'custom' && !newClient.customPeriodMonths) {
      Alert.alert(t('common.error'), t('clients.customPeriodRequired'));
      return;
    }

    try {
      await addClient({
        name: newClient.name!,
        email: newClient.email!,
        phone: newClient.phone,
        phoneRegion: newClient.phoneRegion,
        serviceId: newClient.serviceId!,
        subscriptionPeriod: newClient.subscriptionPeriod as SubscriptionPeriod,
        customPeriodMonths: newClient.customPeriodMonths ? parseInt(newClient.customPeriodMonths) : null,
        price: parseFloat(newClient.price || '0'),
        notes: newClient.notes,
        paymentStatus: 'paid', // Default to paid for new clients
        isJoined: true,
        dateJoined: new Date().toISOString(),
      });
      setShowAddClient(false);
      resetForm();
      Alert.alert(t('common.success'), t('clients.addSuccess'));
    } catch (error) {
      Alert.alert(t('common.error'), t('clients.addError'));
    }
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'unpaid': return '#F59E0B';
      case 'canceled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(settings.language, {
      style: 'currency',
      currency: settings.currency,
    }).format(amount);
  };

  const handleFabPress = () => {
    Animated.sequence([
      Animated.timing(fabScale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(fabScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(() => setShowAddClient(true));
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const fileUri = await generateClientsCSV(clients);
      await shareFile(fileUri);
      Alert.alert(t('common.success'), t('clients.exportSuccess'));
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(t('common.error'), t('clients.exportError'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: t('clients.title'),
        headerStyle: { backgroundColor: '#1F2937' },
        headerTintColor: '#FFFFFF',
        headerShadowVisible: false,
        headerRight: () => (
          <TouchableOpacity 
            onPress={handleExport} 
            disabled={isExporting}
            style={{ marginRight: 16 }}
          >
            <Download size={24} color={isExporting ? '#6B7280' : '#3B82F6'} />
          </TouchableOpacity>
        ),
      }} />

      <View style={styles.searchContainer}>
        <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('common.search')}
          placeholderTextColor="#6B7280"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {(['all', 'paid', 'unpaid', 'canceled'] as FilterTab[]).map(filter => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              activeFilter === filter && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[
              styles.filterText,
              activeFilter === filter && styles.filterTextActive,
            ]}>
              {t(`clients.${filter}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.clientsList} showsVerticalScrollIndicator={false}>
        {searchResults.map(client => {
          const service = services.find(s => s.id === client.serviceId);
          return (
            <TouchableOpacity
              key={client.id}
              style={styles.clientCard}
              onPress={() => {
                setSelectedClientId(client.id);
                setShowQuickActions(true);
                setPaymentAmount(client.price.toString());
              }}
            >
              <View style={styles.clientHeader}>
                <View style={styles.clientInfo}>
                  <Text style={styles.clientName}>{client.name}</Text>
                  <Text style={styles.clientEmail}>{client.email}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(client.paymentStatus) }]}>
                  <Text style={styles.statusText}>{t(`clients.${client.paymentStatus}`)}</Text>
                </View>
              </View>
              
              <View style={styles.clientDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('clients.service')}:</Text>
                  <Text style={styles.detailValue}>{service?.name || t('dashboard.unknownService')}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('clients.subscriptionPeriod')}:</Text>
                  <Text style={styles.detailValue}>
                    {getSubscriptionLabel(client.subscriptionPeriod, client.customPeriodMonths)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('clients.price')}:</Text>
                  <Text style={[styles.detailValue, styles.priceText]}>{formatCurrency(client.price)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('clients.joined')}:</Text>
                  <Text style={styles.detailValue}>{formatDate(client.dateJoined)}</Text>
                </View>
                {client.lastPaidDate && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{t('clients.lastPaid')}:</Text>
                    <Text style={styles.detailValue}>{formatDate(client.lastPaidDate)}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
        
        {searchResults.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{t('common.noData')}</Text>
          </View>
        )}
        
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <Modal
        visible={showQuickActions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQuickActions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowQuickActions(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('clients.quickActions')}</Text>
              <TouchableOpacity onPress={() => setShowQuickActions(false)}>
                <XIcon size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {selectedClient && (
              <View style={styles.modalClient}>
                <Text style={styles.modalClientName}>{selectedClient.name}</Text>
                <Text style={styles.modalClientEmail}>{selectedClient.email}</Text>
              </View>
            )}

            {selectedClient?.paymentStatus !== 'paid' && (
              <View style={styles.actionSection}>
                <Text style={styles.actionSectionTitle}>{t('clients.markAsPaid')}</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder={t('clients.amount')}
                  placeholderTextColor="#6B7280"
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  keyboardType="decimal-pad"
                />
                <TouchableOpacity style={styles.actionButton} onPress={handleMarkPaid}>
                  <CheckCircle size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>{t('clients.confirmPayment')}</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.actionSection}>
              <Text style={styles.actionSectionTitle}>{t('clients.renewSubscription')}</Text>
              <View style={styles.renewOptions}>
                {[1, 3, 6, 12].map(months => (
                  <TouchableOpacity
                    key={months}
                    style={styles.renewOption}
                    onPress={() => handleRenew(months)}
                  >
                    <Clock size={18} color="#3B82F6" />
                    <Text style={styles.renewOptionText}>+{months}m</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {selectedClient?.paymentStatus !== 'canceled' && (
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <XIcon size={20} color="#FFFFFF" />
                <Text style={styles.cancelButtonText}>{t('clients.cancelClient')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showAddClient}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddClient(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowAddClient(false)}
          >
            <View style={styles.addClientModal} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('clients.addNew')}</Text>
                <TouchableOpacity onPress={() => setShowAddClient(false)}>
                  <XIcon size={24} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.formScrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>{t('clients.name')} *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder={t('clients.namePlaceholder')}
                    placeholderTextColor="#6B7280"
                    value={newClient.name}
                    onChangeText={(text) => setNewClient({ ...newClient, name: text })}
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>{t('clients.email')} *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="client@example.com"
                    placeholderTextColor="#6B7280"
                    value={newClient.email}
                    onChangeText={(text) => setNewClient({ ...newClient, email: text })}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>{t('clients.phone')} *</Text>
                  <View style={styles.phoneContainer}>
                    <TouchableOpacity
                      style={styles.regionSelector}
                      onPress={() => setShowRegionPicker(true)}
                    >
                      <Text style={styles.regionText}>{newClient.phoneRegion}</Text>
                      <ChevronDown size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                    <TextInput
                      style={[styles.formInput, styles.phoneInput]}
                      placeholder="123456789"
                      placeholderTextColor="#6B7280"
                      value={newClient.phone}
                      onChangeText={(text) => setNewClient({ ...newClient, phone: text })}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>{t('clients.service')} *</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowServicePicker(true)}
                  >
                    <Text style={[styles.pickerButtonText, !newClient.serviceId && styles.pickerPlaceholder]}>
                      {newClient.serviceId
                        ? services.find(s => s.id === newClient.serviceId)?.name
                        : t('clients.selectService')}
                    </Text>
                    <ChevronDown size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>{t('clients.subscriptionPeriod')} *</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowPeriodPicker(true)}
                  >
                    <Text style={styles.pickerButtonText}>
                      {getSubscriptionLabel(newClient.subscriptionPeriod, parseInt(newClient.customPeriodMonths) || undefined)}
                    </Text>
                    <ChevronDown size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                {newClient.subscriptionPeriod === 'custom' && (
                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>{t('clients.customPeriod')} *</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder={t('clients.monthsPlaceholder')}
                      placeholderTextColor="#6B7280"
                      value={newClient.customPeriodMonths}
                      onChangeText={(text) => setNewClient({ ...newClient, customPeriodMonths: text })}
                      keyboardType="number-pad"
                    />
                  </View>
                )}

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>{t('clients.price')}</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="0.00"
                    placeholderTextColor="#6B7280"
                    value={newClient.price}
                    onChangeText={(text) => setNewClient({ ...newClient, price: text })}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>{t('clients.notes')}</Text>
                  <TextInput
                    style={[styles.formInput, styles.textArea]}
                    placeholder={t('clients.notesPlaceholder')}
                    placeholderTextColor="#6B7280"
                    value={newClient.notes}
                    onChangeText={(text) => setNewClient({ ...newClient, notes: text })}
                    multiline
                    numberOfLines={4}
                  />
                </View>

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleAddClient}
                >
                  <Plus size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>{t('clients.addClient')}</Text>
                </TouchableOpacity>

                <View style={styles.formBottomSpacer} />
              </ScrollView>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showServicePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowServicePicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowServicePicker(false)}
        >
          <View style={styles.pickerModal} onStartShouldSetResponder={() => true}>
            <Text style={styles.pickerTitle}>{t('clients.selectService')}</Text>
            <ScrollView style={styles.pickerList}>
              {services.map(service => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.pickerItem}
                  onPress={() => {
                    setNewClient({ ...newClient, serviceId: service.id, price: service.price.toString() });
                    setShowServicePicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{service.name}</Text>
                  <Text style={styles.pickerItemPrice}>{formatCurrency(service.price)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showPeriodPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPeriodPicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowPeriodPicker(false)}
        >
          <View style={styles.pickerModal} onStartShouldSetResponder={() => true}>
            <Text style={styles.pickerTitle}>{t('clients.selectPeriod')}</Text>
            <ScrollView style={styles.pickerList}>
              {SUBSCRIPTION_PERIODS.map(period => (
                <TouchableOpacity
                  key={period.value}
                  style={styles.pickerItem}
                  onPress={() => {
                    setNewClient({ ...newClient, subscriptionPeriod: period.value });
                    setShowPeriodPicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{period.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showRegionPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRegionPicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowRegionPicker(false)}
        >
          <View style={styles.pickerModal} onStartShouldSetResponder={() => true}>
            <Text style={styles.pickerTitle}>{t('clients.selectRegion')}</Text>
            <ScrollView style={styles.pickerList}>
              {regions.map(region => (
                <TouchableOpacity
                  key={region.code}
                  style={styles.pickerItem}
                  onPress={() => {
                    setNewClient({ ...newClient, phoneRegion: region.code });
                    setShowRegionPicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{region.code}</Text>
                  <Text style={styles.pickerItemSubtext}>{region.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Animated.View style={[styles.fabContainer, { transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity
          style={styles.fab}
          onPress={handleFabPress}
          activeOpacity={0.9}
        >
          <View style={styles.fabContent}>
            <UserPlus size={24} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.fabText}>{t('clients.addClient')}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  filterContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
    maxHeight: 50,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1F2937',
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: '#3B82F6',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#9CA3AF',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  clientsList: {
    flex: 1,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  clientCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  clientEmail: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    textTransform: 'capitalize' as const,
  },
  clientDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  priceText: {
    color: '#10B981',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  bottomSpacer: {
    height: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  modalClient: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  modalClientName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modalClientEmail: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  actionSection: {
    marginBottom: 20,
  },
  actionSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  amountInput: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  renewOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  renewOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  renewOptionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#3B82F6',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  addClientModal: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
    marginTop: 'auto',
  },
  formScrollView: {
    maxHeight: '100%',
  },
  formField: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#D1D5DB',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  phoneContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  regionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  regionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  phoneInput: {
    flex: 1,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  pickerPlaceholder: {
    color: '#6B7280',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  formBottomSpacer: {
    height: 40,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerModal: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxHeight: '60%',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  pickerList: {
    maxHeight: 400,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  pickerItemPrice: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#10B981',
  },
  pickerItemSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fab: {
    backgroundColor: '#3B82F6',
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  fabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fabText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
