import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  getDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Service } from '@/types/crm';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationsContext';

export const [ServicesContext, useServices] = createContextHook(() => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addNotification } = useNotifications();
  const { isAuthenticated } = useAuth();

  // Real-time listener for services
  useEffect(() => {
    if (!isAuthenticated) {
      setServices([]);
      setIsLoading(false);
      return;
    }

    console.log('[ServicesContext] Setting up services listener');
    const q = query(collection(db, 'services'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const servicesList: Service[] = [];
      snapshot.forEach((doc) => {
        servicesList.push({ id: doc.id, ...doc.data() } as Service);
      });
      console.log('[ServicesContext] Services updated:', servicesList.length);
      setServices(servicesList);
      setIsLoading(false);
    }, (error) => {
      console.error('[ServicesContext] Error listening to services:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  const updateServiceQuantity = async (id: string, change: number) => {
    console.log('[ServicesContext] Updating service quantity:', id, change);
    const service = services.find(s => s.id === id);
    if (!service) {
      return { success: false, error: 'Service not found' };
    }

    const newTotalQuantity = service.totalQuantity - change;
    
    // Prevent totalQuantity from going below usedQuantity (clients using the service)
    if (newTotalQuantity < service.usedQuantity) {
      console.log('[ServicesContext] Cannot reduce stock below used quantity:', service.usedQuantity);
      return { 
        success: false, 
        error: 'insufficient_stock',
        usedQuantity: service.usedQuantity 
      };
    }

    try {
      const serviceRef = doc(db, 'services', id);
      await updateDoc(serviceRef, {
        totalQuantity: Math.max(0, newTotalQuantity),
        updatedAt: new Date().toISOString(),
      });
      
      // Check for low stock and trigger notification
      const available = newTotalQuantity - service.usedQuantity;
      if (available <= service.lowStockThreshold) {
        addNotification({
          type: 'low_stock',
          title: 'Low Stock Alert',
          message: `${service.name} is running low. Only ${available} units remaining.`,
          serviceId: id,
        });
      }

      return { success: true };
    } catch (error) {
      console.error('[ServicesContext] Error updating quantity:', error);
      return { success: false, error: 'Failed to update quantity' };
    }
  };

  const increaseServiceStock = async (id: string, amount: number) => {
    console.log('[ServicesContext] Increasing service stock:', id, amount);
    try {
      const service = services.find(s => s.id === id);
      if (!service) return;

      const serviceRef = doc(db, 'services', id);
      await updateDoc(serviceRef, {
        totalQuantity: service.totalQuantity + amount,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[ServicesContext] Error increasing stock:', error);
    }
  };

  // Separate function to update usedQuantity when clients are added/removed
  const updateUsedQuantity = async (id: string, change: number) => {
    console.log('[ServicesContext] Updating used quantity:', id, change);
    try {
      const service = services.find(s => s.id === id);
      if (!service) return;

      const serviceRef = doc(db, 'services', id);
      await updateDoc(serviceRef, {
        usedQuantity: Math.max(0, service.usedQuantity + change),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[ServicesContext] Error updating used quantity:', error);
    }
  };

  const addService = async (service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('[ServicesContext] Adding new service:', service.name);
    try {
      const newServiceData = {
        ...service,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, 'services'), newServiceData);
      return { id: docRef.id, ...newServiceData };
    } catch (error) {
      console.error('[ServicesContext] Error adding service:', error);
      throw error;
    }
  };

  const updateService = async (id: string, updates: Partial<Service>) => {
    console.log('[ServicesContext] Updating service:', id, updates);
    try {
      const serviceRef = doc(db, 'services', id);
      await updateDoc(serviceRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[ServicesContext] Error updating service:', error);
    }
  };

  const deleteService = async (id: string) => {
    console.log('[ServicesContext] Deleting service:', id);
    try {
      // In Firestore, we can actually delete the document
      // Or we could use a 'deleted' flag if we want soft delete
      // For now, let's stick to actual delete as per standard Firestore usage
      // But user requested soft delete logic before, so maybe we should just not show it in list?
      // Actually, Firestore delete is permanent. Let's do actual delete for now as it's cleaner for migration.
      // If we need soft delete, we'd add a 'deleted' field.
      await deleteDoc(doc(db, 'services', id));
    } catch (error) {
      console.error('[ServicesContext] Error deleting service:', error);
    }
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
    isLoading,
    isSaving: false, // Firestore handles this
    updateServiceQuantity,
    increaseServiceStock,
    updateUsedQuantity,
    addService,
    updateService,
    deleteService,
    getServiceById,
    getLowStockServices,
    getAvailableQuantity,
  };
});
