import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Stack } from 'expo-router';
import { Package, Plus, Minus, TrendingUp } from 'lucide-react-native';
import { useServices } from '@/contexts/ServicesContext';
import { useClients } from '@/contexts/ClientsContext';

export default function ServicesScreen() {
  const { services, updateServiceQuantity, increaseServiceStock } = useServices();
  const { clients } = useClients();
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [stockToAdd, setStockToAdd] = useState('');

  const selectedService = services.find(s => s.id === selectedServiceId);

  const handleAddStock = () => {
    if (selectedServiceId && stockToAdd) {
      increaseServiceStock(selectedServiceId, parseInt(stockToAdd));
      setShowModal(false);
      setStockToAdd('');
      setSelectedServiceId(null);
    }
  };

  const getClientsForService = (serviceId: string) => {
    return clients.filter(c => c.serviceId === serviceId).length;
  };

  const getServiceStatus = (service: typeof services[0]) => {
    const available = service.totalQuantity - service.usedQuantity;
    if (available <= service.lowStockThreshold) {
      return { color: '#EF4444', text: 'Low Stock' };
    }
    if (available <= service.lowStockThreshold * 2) {
      return { color: '#F59E0B', text: 'Medium' };
    }
    return { color: '#10B981', text: 'In Stock' };
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: 'Services',
        headerStyle: { backgroundColor: '#1F2937' },
        headerTintColor: '#FFFFFF',
        headerShadowVisible: false,
      }} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Services</Text>
            <Text style={styles.summaryValue}>{services.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Inventory</Text>
            <Text style={styles.summaryValue}>
              {services.reduce((sum, s) => sum + s.totalQuantity, 0)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>In Use</Text>
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
            <View key={service.id} style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <View style={styles.serviceIcon}>
                  <Package size={24} color="#3B82F6" />
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.servicePrice}>${service.price.toFixed(2)}</Text>
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
                        width: `${percentage}%`,
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
                  <Text style={styles.statLabel}>Available</Text>
                  <Text style={[styles.statValue, { color: status.color }]}>
                    {available}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Clients</Text>
                  <Text style={styles.statValue}>{clientCount}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Alert at</Text>
                  <Text style={styles.statValue}>{service.lowStockThreshold}</Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.decreaseButton}
                  onPress={() => updateServiceQuantity(service.id, 1)}
                >
                  <Plus size={20} color="#10B981" />
                  <Text style={styles.decreaseButtonText}>Use</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.increaseButton}
                  onPress={() => updateServiceQuantity(service.id, -1)}
                >
                  <Minus size={20} color="#EF4444" />
                  <Text style={styles.increaseButtonText}>Return</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addStockButton}
                  onPress={() => {
                    setSelectedServiceId(service.id);
                    setShowModal(true);
                  }}
                >
                  <TrendingUp size={20} color="#FFFFFF" />
                  <Text style={styles.addStockButtonText}>Add Stock</Text>
                </TouchableOpacity>
              </View>
            </View>
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
              <Text style={styles.modalTitle}>Add Stock</Text>
            </View>

            {selectedService && (
              <View style={styles.modalService}>
                <Text style={styles.modalServiceName}>{selectedService.name}</Text>
                <Text style={styles.modalServiceInfo}>
                  Current: {selectedService.totalQuantity} units
                </Text>
              </View>
            )}

            <TextInput
              style={styles.stockInput}
              placeholder="Quantity to add"
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
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleAddStock}>
                <Text style={styles.confirmButtonText}>Add Stock</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
    backgroundColor: '#064E3B',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  decreaseButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#10B981',
  },
  increaseButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7F1D1D',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  increaseButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#EF4444',
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
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
