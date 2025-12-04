import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Notification } from '@/types/crm';

const NOTIFICATIONS_STORAGE_KEY = 'crm_notifications';

export const [NotificationsContext, useNotifications] = createContextHook(() => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      console.log('[NotificationsContext] Loading notifications from storage');
      const stored = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        const parsedNotifications = JSON.parse(stored);
        console.log('[NotificationsContext] Loaded notifications:', parsedNotifications.length);
        return parsedNotifications;
      }
      console.log('[NotificationsContext] No stored notifications');
      return [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (updatedNotifications: Notification[]) => {
      console.log('[NotificationsContext] Saving notifications to storage:', updatedNotifications.length);
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updatedNotifications));
      return updatedNotifications;
    },
  });

  useEffect(() => {
    if (notificationsQuery.data) {
      setNotifications(notificationsQuery.data);
    }
  }, [notificationsQuery.data]);

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    console.log('[NotificationsContext] Adding notification:', newNotification.type);
    const updated = [newNotification, ...notifications];
    setNotifications(updated);
    saveMutation.mutate(updated);
  };

  const markAsRead = (id: string) => {
    console.log('[NotificationsContext] Marking notification as read:', id);
    const updated = notifications.map(notif =>
      notif.id === id ? { ...notif, isRead: true } : notif
    );
    setNotifications(updated);
    saveMutation.mutate(updated);
  };

  const markAllAsRead = () => {
    console.log('[NotificationsContext] Marking all notifications as read');
    const updated = notifications.map(notif => ({ ...notif, isRead: true }));
    setNotifications(updated);
    saveMutation.mutate(updated);
  };

  const deleteNotification = (id: string) => {
    console.log('[NotificationsContext] Deleting notification:', id);
    const updated = notifications.filter(notif => notif.id !== id);
    setNotifications(updated);
    saveMutation.mutate(updated);
  };

  const clearAll = () => {
    console.log('[NotificationsContext] Clearing all notifications');
    setNotifications([]);
    saveMutation.mutate([]);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    isLoading: notificationsQuery.isLoading,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };
});
