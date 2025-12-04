import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Client, PaymentStatus } from '@/types/crm';
import { INITIAL_CLIENTS } from '@/mocks/clients';
import { getSubscriptionMonths } from '@/constants/subscription-periods';

const CLIENTS_STORAGE_KEY = 'crm_clients';
const LAST_RESET_KEY = 'crm_last_canceled_reset';

export const [ClientsContext, useClients] = createContextHook(() => {
  const [clients, setClients] = useState<Client[]>([]);

  const clientsQuery = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      console.log('[ClientsContext] Loading clients from storage');
      const stored = await AsyncStorage.getItem(CLIENTS_STORAGE_KEY);
      if (stored) {
        const parsedClients = JSON.parse(stored);
        console.log('[ClientsContext] Loaded clients:', parsedClients.length);
        return parsedClients;
      }
      console.log('[ClientsContext] No stored clients, using initial data');
      await AsyncStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(INITIAL_CLIENTS));
      return INITIAL_CLIENTS;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (updatedClients: Client[]) => {
      console.log('[ClientsContext] Saving clients to storage:', updatedClients.length);
      await AsyncStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(updatedClients));
      return updatedClients;
    },
  });

  useEffect(() => {
    if (clientsQuery.data) {
      setClients(clientsQuery.data);
    }
  }, [clientsQuery.data]);

  const { mutate: saveClients } = saveMutation;

  useEffect(() => {
    const checkAndResetCanceled = async () => {
      const lastReset = await AsyncStorage.getItem(LAST_RESET_KEY);
      const now = Date.now();
      const resetInterval = 48 * 60 * 60 * 1000;

      if (!lastReset || now - parseInt(lastReset) > resetInterval) {
        console.log('[ClientsContext] Resetting canceled clients');
        const updatedClients = clients.map(client => 
          client.paymentStatus === 'canceled' 
            ? { ...client, paymentStatus: 'unpaid' as PaymentStatus }
            : client
        );
        setClients(updatedClients);
        saveClients(updatedClients);
        await AsyncStorage.setItem(LAST_RESET_KEY, now.toString());
      }
    };

    if (clients.length > 0) {
      checkAndResetCanceled();
    }
  }, [clients, saveClients]);

  const addClient = (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newClient: Client = {
      ...client,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    console.log('[ClientsContext] Adding new client:', newClient.name);
    const updated = [...clients, newClient];
    setClients(updated);
    saveMutation.mutate(updated);
    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    console.log('[ClientsContext] Updating client:', id, updates);
    const updated = clients.map(client =>
      client.id === id
        ? { ...client, ...updates, updatedAt: new Date().toISOString() }
        : client
    );
    setClients(updated);
    saveMutation.mutate(updated);
  };

  const markAsPaid = (id: string, amountPaid: number) => {
    console.log('[ClientsContext] Marking client as paid:', id, amountPaid);
    updateClient(id, {
      paymentStatus: 'paid',
      lastPaidDate: new Date().toISOString(),
      price: amountPaid,
    });
  };

  const cancelClient = (id: string) => {
    console.log('[ClientsContext] Canceling client:', id);
    updateClient(id, {
      paymentStatus: 'canceled',
    });
  };

  const renewSubscription = (id: string, additionalMonths: number) => {
    console.log('[ClientsContext] Renewing subscription:', id, additionalMonths);
    const client = clients.find(c => c.id === id);
    if (!client) return;

    const currentMonths = getSubscriptionMonths(client.subscriptionPeriod, client.customPeriodMonths);
    const newMonths = currentMonths + additionalMonths;

    updateClient(id, {
      subscriptionPeriod: 'custom',
      customPeriodMonths: newMonths,
      paymentStatus: 'unpaid',
    });
  };

  const deleteClient = (id: string) => {
    console.log('[ClientsContext] Deleting client:', id);
    const updated = clients.filter(client => client.id !== id);
    setClients(updated);
    saveMutation.mutate(updated);
  };

  return {
    clients,
    isLoading: clientsQuery.isLoading,
    isSaving: saveMutation.isPending,
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
