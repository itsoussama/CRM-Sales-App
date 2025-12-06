import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { Package, Plus, Minus, TrendingUp, CheckCircle } from 'lucide-react-native';
import { useServices } from '@/contexts/ServicesContext';
import { useClients } from '@/contexts/ClientsContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useTranslation } from 'react-i18next';

export default function ServicesScreen() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { services, updateServiceQuantity, increaseServiceStock, addService, updateService, deleteService } = useServices();
  const { clients } = useClients();
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
  const [stockToAdd, setStockToAdd] = useState('');
  
  const [newService, setNewService] = useState({
    name: '',
    totalQuantity: '',
    lowStockThreshold: '',
    price: '',
  });

  const [editService, setEditService] = useState({
    price: '',
  });

  const selectedService = services.find(s => s.id === selectedServiceId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(settings.language, {
      style: 'currency',
      currency: settings.currency,
    }).format(amount);
  };

  const handleAddStock = () => {
    if (selectedServiceId && stockToAdd) {
      increaseServiceStock(selectedServiceId, parseInt(stockToAdd));
      setShowModal(false);
      setStockToAdd('');
      setSelectedServiceId(null);
    }
  };

  const handleAddService = () => {
    if (!newService.name.trim() || !newService.totalQuantity || !newService.price) {
      return;
    }

    addService({
      name: newService.name.trim(),
      totalQuantity: parseInt(newService.totalQuantity),
      usedQuantity: 0,
      lowStockThreshold: parseInt(newService.lowStockThreshold) || 10,
      price: parseFloat(newService.price),
    });

    setShowAddServiceModal(false);
    setNewService({
      name: '',
      totalQuantity: '',
      lowStockThreshold: '',
      price: '',
    });
  };

  const handleEditService = () => {
    if (selectedServiceId && editService.price) {
      updateService(selectedServiceId, {
        price: parseFloat(editService.price),
      });
      setShowEditServiceModal(false);
      setEditService({ price: '' });
      setSelectedServiceId(null);
    }
  };

  const handleDeleteService = () => {
    if (selectedServiceId) {
      const clientCount = getClientsForService(selectedServiceId);
      if (clientCount > 0) {
        // Show confirmation that clients will be preserved
        Alert.alert(
          t('common.delete'),
          t('services.deleteConfirm', { count: clientCount }),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { 
              text: t('common.delete'), 
              style: 'destructive',
              onPress: () => {
                deleteService(selectedServiceId);
                setShowEditServiceModal(false);
                setSelectedServiceId(null);
              }
            }
          ]
        );
      } else {
        deleteService(selectedServiceId);
        setShowEditServiceModal(false);
        setSelectedServiceId(null);
      }
    }
  };

  const getClientsForService = (serviceId: string) => {
    return clients.filter(c => c.serviceId === serviceId).length;
  };

  const getServiceStatus = (service: typeof services[0]) => {
    const available = service.totalQuantity - service.usedQuantity;
    if (available <= service.lowStockThreshold) {
      return { color: '#EF4444', text: t('services.lowStock') };
    }
    if (available <= service.lowStockThreshold * 2) {
      return { color: '#F59E0B', text: t('services.medium') };
    }
    return { color: '#10B981', text: t('services.inStock') };
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: t('services.title'),
        headerStyle: { backgroundColor: '#1F2937' },
        headerTintColor: '#FFFFFF',
        headerShadowVisible: false,
      }} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('services.totalServices')}</Text>
            <Text style={styles.summaryValue}>{services.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('services.totalInventory')}</Text>
            <Text style={styles.summaryValue}>
              {services.reduce((sum, s) => sum + s.totalQuantity, 0)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('services.inUse')}</Text>
            <Text style={styles.summaryValue}>
              {services.reduce((sum, s) => sum + s.usedQuantity, 0)}
            </Text>
          </View>
        </View>

        {services.map(service => {
          const available = service.totalQuantity - service.usedQuantity;
          const percentage = (service.usedQuantity / service.totalQuantity) * 100;
          const status = getServiceStatus(service);
          const clientCount = getClientsForService(service.id);

          return (
            <TouchableOpacity 
              key={service.id} 
              style={styles.serviceCard}
              onPress={() => {
                setSelectedServiceId(service.id);
                setEditService({ price: service.price.toString() });
                setShowEditServiceModal(true);
              }}
            >
              <View style={styles.serviceHeader}>
                <View style={styles.serviceIcon}>
                  <Package size={24} color="#3B82F6" />
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.servicePrice}>{formatCurrency(service.price)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                  <Text style={styles.statusText}>{status.text}</Text>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: status.color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {service.usedQuantity} / {service.totalQuantity}
                </Text>
              </View>

              <View style={styles.serviceStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>{t('services.available')}</Text>
                  <Text style={[styles.statValue, { color: status.color }]}>
                    {available}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>{t('services.clients')}</Text>
                  <Text style={styles.statValue}>{clientCount}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>{t('services.alertAt')}</Text>
                  <Text style={styles.statValue}>{service.lowStockThreshold}</Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.decreaseButton}
                  onPress={async () => {
                    const result = await updateServiceQuantity(service.id, 1);
                    if (result && !result.success && result.error === 'insufficient_stock') {
                      Alert.alert(
                        t('services.cannotRemove'),
                        t('services.cannotRemoveMessage', { count: result.usedQuantity }),
                        [{ text: t('common.success') }] // Assuming OK maps to success or just OK
                      );
                    }
                  }}
                >
                  <Minus size={20} color="#EF4444" />
                  <Text style={styles.decreaseButtonText}>{t('services.remove')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.increaseButton}
                  onPress={() => updateServiceQuantity(service.id, -1)}
                >
                  <Plus size={20} color="#10B981" />
                  <Text style={styles.increaseButtonText}>{t('services.add')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addStockButton}
                  onPress={() => {
                    setSelectedServiceId(service.id);
                    setShowModal(true);
                  }}
                >
                  <TrendingUp size={20} color="#FFFFFF" />
                  <Text style={styles.addStockButtonText}>{t('services.bulkAdd')}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('services.addStockTitle')}</Text>
            </View>

            {selectedService && (
              <View style={styles.modalService}>
                <Text style={styles.modalServiceName}>{selectedService.name}</Text>
                <Text style={styles.modalServiceInfo}>
                  {t('services.currentUnits', { count: selectedService.totalQuantity })}
                </Text>
              </View>
            )}

            <TextInput
              style={styles.stockInput}
              placeholder={t('services.quantityPlaceholder')}
              placeholderTextColor="#6B7280"
              value={stockToAdd}
              onChangeText={setStockToAdd}
              keyboardType="number-pad"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleAddStock}>
                <Text style={styles.confirmButtonText}>{t('services.addStockTitle')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Add Service Modal */}
      <Modal
        visible={showAddServiceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddServiceModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAddServiceModal(false)}
        >
          <View style={styles.addServiceModal} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('services.addNewTitle')}</Text>
            </View>

            <ScrollView style={styles.formScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>{t('services.serviceName')}</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder={t('services.serviceNamePlaceholder')}
                  placeholderTextColor="#6B7280"
                  value={newService.name}
                  onChangeText={(text) => setNewService({ ...newService, name: text })}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>{t('services.totalQuantity')}</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder={t('services.quantityExample')}
                  placeholderTextColor="#6B7280"
                  value={newService.totalQuantity}
                  onChangeText={(text) => setNewService({ ...newService, totalQuantity: text })}
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>{t('services.lowStockThreshold')}</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder={t('services.thresholdExample')}
                  placeholderTextColor="#6B7280"
                  value={newService.lowStockThreshold}
                  onChangeText={(text) => setNewService({ ...newService, lowStockThreshold: text })}
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>{t('services.price')}</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder={t('services.priceExample')}
                  placeholderTextColor="#6B7280"
                  value={newService.price}
                  onChangeText={(text) => setNewService({ ...newService, price: text })}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowAddServiceModal(false)}
                >
                  <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmButton} onPress={handleAddService}>
                  <Plus size={20} color="#FFFFFF" />
                  <Text style={styles.confirmButtonText}>{t('services.addService')}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Service Modal */}
      <Modal
        visible={showEditServiceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditServiceModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowEditServiceModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('services.editTitle')}</Text>
            </View>

            {selectedService && (
              <View style={styles.modalService}>
                <Text style={styles.modalServiceName}>{selectedService.name}</Text>
                <Text style={styles.modalServiceInfo}>
                  {t('services.clientsUsing', { count: getClientsForService(selectedService.id) })}
                </Text>
              </View>
            )}

            <View style={styles.formField}>
              <Text style={styles.formLabel}>{t('services.updatePrice')}</Text>
              <TextInput
                style={styles.formInput}
                placeholder={t('services.priceExample')}
                placeholderTextColor="#6B7280"
                value={editService.price}
                onChangeText={(text) => setEditService({ price: text })}
                keyboardType="decimal-pad"
              />
            </View>

            <TouchableOpacity style={[styles.confirmButton, { flex: 0 }]} onPress={handleEditService}>
              <CheckCircle size={20} color="#FFFFFF" />
              <Text style={styles.confirmButtonText}>{t('services.updatePrice')}</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('services.dangerZone')}</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteService}>
              <Text style={styles.deleteButtonText}>{t('services.deleteService')}</Text>
            </TouchableOpacity>
            <Text style={styles.deleteWarning}>
              {t('services.deleteWarning')}
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* FAB Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddServiceModal(true)}
      >
        <Plus size={28} color="#FFFFFF" strokeWidth={2.5} />
      </TouchableOpacity>
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
  summaryCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  serviceCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 14,
    color: '#10B981',
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
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  serviceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#374151',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  decreaseButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7F1D1D',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  decreaseButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#EF4444',
  },
  increaseButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#064E3B',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  increaseButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#10B981',
  },
  addStockButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  addStockButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  bottomSpacer: {
    height: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 24,
    padding: 24,
    width: '85%',
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  modalService: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  modalServiceName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modalServiceInfo: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  stockInput: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  addServiceModal: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
  formScrollView: {
    maxHeight: 500,
  },
  formField: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#374151',
  },
  dividerText: {
    fontSize: 12,
    color: '#EF4444',
    marginHorizontal: 12,
    fontWeight: '600' as const,
  },
  deleteButton: {
    backgroundColor: '#7F1D1D',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#EF4444',
  },
  deleteWarning: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
