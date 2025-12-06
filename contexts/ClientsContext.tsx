import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Client, PaymentStatus } from '@/types/crm';
import { getSubscriptionMonths } from '@/constants/subscription-periods';
import { useNotifications } from './NotificationsContext';
import { useServices } from './ServicesContext';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';

export const [ClientsContext, useClients] = createContextHook(() => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addNotification } = useNotifications();
  const { updateUsedQuantity, getServiceById } = useServices();
  const { isAuthenticated } = useAuth();
  const { settings, updateSettings } = useSettings();

  // Real-time listener for clients
  useEffect(() => {
    if (!isAuthenticated) {
      setClients([]);
      setIsLoading(false);
      return;
    }

    console.log('[ClientsContext] Setting up clients listener');
    const q = query(collection(db, 'clients'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientsList: Client[] = [];
      snapshot.forEach((doc) => {
        clientsList.push({ id: doc.id, ...doc.data() } as Client);
      });
      console.log('[ClientsContext] Clients updated:', clientsList.length);
      setClients(clientsList);
      setIsLoading(false);
    }, (error) => {
      console.error('[ClientsContext] Error listening to clients:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  // Check and reset canceled clients logic - adapted for Firestore
  useEffect(() => {
    const checkAndResetCanceled = async () => {
      if (!settings.autoResetCanceledClients) return;

      const lastReset = settings.lastCanceledReset;
      const now = Date.now();
      const resetInterval = settings.canceledResetIntervalHours * 60 * 60 * 1000;

      if (!lastReset || now - parseInt(lastReset) > resetInterval) {
        console.log('[ClientsContext] Checking for canceled clients to reset');
        // We need to query canceled clients from Firestore
        const q = query(collection(db, 'clients'), where('paymentStatus', '==', 'canceled'));
        const querySnapshot = await getDocs(q);
        
        const batchPromises = querySnapshot.docs.map(docSnapshot => {
          const clientRef = doc(db, 'clients', docSnapshot.id);
          return updateDoc(clientRef, { paymentStatus: 'unpaid' });
        });
        
        if (batchPromises.length > 0) {
          await Promise.all(batchPromises);
          console.log(`[ClientsContext] Reset ${batchPromises.length} canceled clients`);
        }
        
        updateSettings({ lastCanceledReset: now.toString() });
      }
    };

    // Only run this check once on mount, or when settings change
    if (isAuthenticated) {
      checkAndResetCanceled();
    }
  }, [isAuthenticated, settings.autoResetCanceledClients, settings.canceledResetIntervalHours, settings.lastCanceledReset]);

  const addClient = async (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Check if service has available stock
    const service = getServiceById(client.serviceId);
    if (!service) {
      return { success: false, error: 'Service not found' };
    }

    const availableQuantity = service.totalQuantity - service.usedQuantity;
    if (availableQuantity <= 0) {
      return { 
        success: false, 
        error: 'out_of_stock',
        serviceName: service.name 
      };
    }

    try {
      console.log('[ClientsContext] Adding new client:', client.name);
      const newClientData = {
        ...client,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const docRef = await addDoc(collection(db, 'clients'), newClientData);
      const newClient = { id: docRef.id, ...newClientData };
      
      // Increment usedQuantity to track this client is using the service
      await updateUsedQuantity(newClient.serviceId, 1);
      
      // Trigger notification
      addNotification({
        type: 'new_client',
        title: 'New Client Added',
        message: `${newClient.name} subscribed to ${service?.name || 'service'}`,
        clientId: newClient.id,
        serviceId: newClient.serviceId,
      });
      
      return { success: true, client: newClient };
    } catch (error) {
      console.error('[ClientsContext] Error adding client:', error);
      return { success: false, error: 'Failed to add client' };
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    console.log('[ClientsContext] Updating client:', id, updates);
    try {
      const clientRef = doc(db, 'clients', id);
      await updateDoc(clientRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[ClientsContext] Error updating client:', error);
    }
  };

  const markAsPaid = async (id: string, amountPaid: number) => {
    console.log('[ClientsContext] Marking client as paid:', id, amountPaid);
    const client = clients.find(c => c.id === id);
    
    await updateClient(id, {
      paymentStatus: 'paid',
      lastPaidDate: new Date().toISOString(),
      price: amountPaid,
    });
    
    // Trigger notification
    if (client) {
      const service = getServiceById(client.serviceId);
      addNotification({
        type: 'payment_received',
        title: 'Payment Received',
        message: `${client.name} paid $${amountPaid.toFixed(2)} for ${service?.name || 'service'}`,
        clientId: id,
        serviceId: client.serviceId,
      });
    }
  };

  const cancelClient = async (id: string) => {
    console.log('[ClientsContext] Canceling client:', id);
    const client = clients.find(c => c.id === id);
    
    // Decrement usedQuantity when client is canceled
    if (client) {
      await updateUsedQuantity(client.serviceId, -1);
    }
    
    await updateClient(id, {
      paymentStatus: 'canceled',
    });
  };

  const renewSubscription = async (id: string, additionalMonths: number) => {
    console.log('[ClientsContext] Renewing subscription:', id, additionalMonths);
    const client = clients.find(c => c.id === id);
    if (!client) return;

    const currentMonths = getSubscriptionMonths(client.subscriptionPeriod, client.customPeriodMonths);
    const newMonths = currentMonths + additionalMonths;

    await updateClient(id, {
      subscriptionPeriod: 'custom',
      customPeriodMonths: newMonths,
      paymentStatus: 'unpaid',
    });
  };

  const deleteClient = async (id: string) => {
    console.log('[ClientsContext] Deleting client:', id);
    try {
      await deleteDoc(doc(db, 'clients', id));
    } catch (error) {
      console.error('[ClientsContext] Error deleting client:', error);
    }
  };

  return {
    clients,
    isLoading,
    isSaving: false, // Firestore handles this
    addClient,
    updateClient,
    markAsPaid,
    cancelClient,
    renewSubscription,
    deleteClient,
  };
});

export function useFilteredClients(filter: 'all' | PaymentStatus) {
  const { clients } = useClients();
  return useMemo(() => {
    if (filter === 'all') return clients;
    return clients.filter(client => client.paymentStatus === filter);
  }, [clients, filter]);
}

export function useClientById(id: string | undefined) {
  const { clients } = useClients();
  return useMemo(() => clients.find(c => c.id === id), [clients, id]);
}
