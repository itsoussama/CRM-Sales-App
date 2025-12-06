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
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Notification } from '@/types/crm';

import { useAuth } from './AuthContext';

export const [NotificationsContext, useNotifications] = createContextHook(() => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  // Real-time listener for notifications
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    console.log('[NotificationsContext] Setting up notifications listener');
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsList: Notification[] = [];
      snapshot.forEach((doc) => {
        notificationsList.push({ id: doc.id, ...doc.data() } as Notification);
      });
      console.log('[NotificationsContext] Notifications updated:', notificationsList.length);
      setNotifications(notificationsList);
      setIsLoading(false);
    }, (error) => {
      console.error('[NotificationsContext] Error listening to notifications:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  const addNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    try {
      console.log('[NotificationsContext] Adding notification:', notification.type);
      const newNotificationData = {
        ...notification,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'notifications'), newNotificationData);
    } catch (error) {
      console.error('[NotificationsContext] Error adding notification:', error);
    }
  };

  const markAsRead = async (id: string) => {
    console.log('[NotificationsContext] Marking notification as read:', id);
    try {
      const notificationRef = doc(db, 'notifications', id);
      await updateDoc(notificationRef, { isRead: true });
    } catch (error) {
      console.error('[NotificationsContext] Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    console.log('[NotificationsContext] Marking all notifications as read');
    try {
      const batch = writeBatch(db);
      const unreadNotifications = notifications.filter(n => !n.isRead);
      
      unreadNotifications.forEach(notification => {
        const ref = doc(db, 'notifications', notification.id);
        batch.update(ref, { isRead: true });
      });
      
      if (unreadNotifications.length > 0) {
        await batch.commit();
      }
    } catch (error) {
      console.error('[NotificationsContext] Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    console.log('[NotificationsContext] Deleting notification:', id);
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      console.error('[NotificationsContext] Error deleting notification:', error);
    }
  };

  const clearAll = async () => {
    console.log('[NotificationsContext] Clearing all notifications');
    try {
      // Batch delete might fail if too many docs (>500), but for this app it's fine
      // Or we can just delete one by one or use a cloud function (overkill here)
      const batch = writeBatch(db);
      notifications.forEach(notification => {
        const ref = doc(db, 'notifications', notification.id);
        batch.delete(ref);
      });
      
      if (notifications.length > 0) {
        await batch.commit();
      }
    } catch (error) {
      console.error('[NotificationsContext] Error clearing notifications:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };
});
