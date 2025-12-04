import { SubscriptionPeriod } from '@/types/crm';

export const SUBSCRIPTION_PERIODS: { value: SubscriptionPeriod; label: string; months: number }[] = [
  { value: '1month', label: '1 Month', months: 1 },
  { value: '3months', label: '3 Months', months: 3 },
  { value: '6months', label: '6 Months', months: 6 },
  { value: '1year', label: '1 Year', months: 12 },
  { value: 'lifetime', label: 'Lifetime', months: 0 },
  { value: 'custom', label: 'Custom', months: 0 },
];

export function getSubscriptionMonths(period: SubscriptionPeriod, customMonths?: number): number {
  const found = SUBSCRIPTION_PERIODS.find(p => p.value === period);
  if (period === 'custom' && customMonths) {
    return customMonths;
  }
  return found?.months || 0;
}

export function getSubscriptionLabel(period: SubscriptionPeriod, customMonths?: number): string {
  if (period === 'custom' && customMonths) {
    return `${customMonths} Month${customMonths > 1 ? 's' : ''}`;
  }
  const found = SUBSCRIPTION_PERIODS.find(p => p.value === period);
  return found?.label || 'Unknown';
}
