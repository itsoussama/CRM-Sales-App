import { Service } from '@/types/crm';

export const INITIAL_SERVICES: Service[] = [
  {
    id: '1',
    name: 'Premium VPN',
    totalQuantity: 100,
    usedQuantity: 67,
    lowStockThreshold: 20,
    price: 9.99,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Cloud Storage Pro',
    totalQuantity: 50,
    usedQuantity: 15,
    lowStockThreshold: 10,
    price: 14.99,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Email Hosting',
    totalQuantity: 200,
    usedQuantity: 145,
    lowStockThreshold: 30,
    price: 4.99,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Web Hosting',
    totalQuantity: 75,
    usedQuantity: 18,
    lowStockThreshold: 15,
    price: 19.99,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
