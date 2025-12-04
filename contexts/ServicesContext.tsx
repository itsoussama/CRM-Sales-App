import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Service } from '@/types/crm';
import { INITIAL_SERVICES } from '@/mocks/services';

const SERVICES_STORAGE_KEY = 'crm_services';

export const [ServicesContext, useServices] = createContextHook(() => {
  const [services, setServices] = useState<Service[]>([]);

  const servicesQuery = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      console.log('[ServicesContext] Loading services from storage');
      const stored = await AsyncStorage.getItem(SERVICES_STORAGE_KEY);
      if (stored) {
        const parsedServices = JSON.parse(stored);
        console.log('[ServicesContext] Loaded services:', parsedServices.length);
        return parsedServices;
      }
      console.log('[ServicesContext] No stored services, using initial data');
      await AsyncStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(INITIAL_SERVICES));
      return INITIAL_SERVICES;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (updatedServices: Service[]) => {
      console.log('[ServicesContext] Saving services to storage:', updatedServices.length);
      await AsyncStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(updatedServices));
      return updatedServices;
    },
  });

  useEffect(() => {
    if (servicesQuery.data) {
      setServices(servicesQuery.data);
    }
  }, [servicesQuery.data]);

  const updateServiceQuantity = (id: string, change: number) => {
    console.log('[ServicesContext] Updating service quantity:', id, change);
    const updated = services.map(service =>
      service.id === id
        ? {
            ...service,
            usedQuantity: Math.max(0, Math.min(service.totalQuantity, service.usedQuantity + change)),
            updatedAt: new Date().toISOString(),
          }
        : service
    );
    setServices(updated);
    saveMutation.mutate(updated);
  };

  const increaseServiceStock = (id: string, amount: number) => {
    console.log('[ServicesContext] Increasing service stock:', id, amount);
    const updated = services.map(service =>
      service.id === id
        ? {
            ...service,
            totalQuantity: service.totalQuantity + amount,
            updatedAt: new Date().toISOString(),
          }
        : service
    );
    setServices(updated);
    saveMutation.mutate(updated);
  };

  const getServiceById = (id: string) => {
    return services.find(s => s.id === id);
  };

  const getLowStockServices = () => {
    return services.filter(service => 
      (service.totalQuantity - service.usedQuantity) <= service.lowStockThreshold
    );
  };

  const getAvailableQuantity = (id: string) => {
    const service = getServiceById(id);
    if (!service) return 0;
    return service.totalQuantity - service.usedQuantity;
  };

  return {
    services,
    isLoading: servicesQuery.isLoading,
    isSaving: saveMutation.isPending,
    updateServiceQuantity,
    increaseServiceStock,
    getServiceById,
    getLowStockServices,
    getAvailableQuantity,
  };
});
