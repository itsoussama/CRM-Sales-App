export type PaymentStatus = 'paid' | 'unpaid' | 'canceled';

export type SubscriptionPeriod = '1month' | '3months' | '6months' | '1year' | 'lifetime' | 'custom';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  phoneRegion: string;
  serviceId: string;
  price: number;
  subscriptionPeriod: SubscriptionPeriod;
  customPeriodMonths?: number | null;
  isJoined: boolean;
  dateJoined: string;
  lastPaidDate?: string;
  paymentStatus: PaymentStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  name: string;
  totalQuantity: number;
  usedQuantity: number;
  lowStockThreshold: number;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: 'new_client' | 'payment_received' | 'low_stock' | 'payment_pending';
  title: string;
  message: string;
  clientId?: string;
  serviceId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AppSettings {
  notificationsEnabled: boolean;
  lowStockAlertEnabled: boolean;
  paymentReminderEnabled: boolean;
  autoResetCanceledClients: boolean;
  canceledResetIntervalHours: number;
  theme: 'light' | 'dark' | 'auto';
  currency: 'USD' | 'MAD' | 'EUR';
  language: 'en' | 'fr' | 'ar';
  lastCanceledReset?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}
