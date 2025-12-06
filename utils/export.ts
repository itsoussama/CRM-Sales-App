import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Client } from '@/types/crm';

export const generateClientsCSV = async (clients: Client[]): Promise<string> => {
    const header = 'Name,Email,Phone,Service ID,Status,Price,Subscription,Joined Date,Last Paid\n';

    const rows = clients.map(client => {
        const clean = (text: string) => `"${(text || '').replace(/"/g, '""')}"`;

        return [
            clean(client.name),
            clean(client.email),
            clean(client.phone),
            clean(client.serviceId),
            clean(client.paymentStatus),
            client.price || 0,
            clean(client.subscriptionPeriod),
            clean(client.dateJoined),
            clean(client.lastPaidDate || '')
        ].join(',');
    }).join('\n');

    const csvContent = header + rows;
    const filename = `clients_export_${new Date().toISOString().split('T')[0]}.csv`;
    // Cast to any to avoid type issues with expo-file-system exports
    const FS = FileSystem as any;
    const fileUri = (FS.documentDirectory || FS.cacheDirectory) + filename;

    await FS.writeAsStringAsync(fileUri, csvContent, {
        encoding: 'utf8',
    });

    return fileUri;
};

export const shareFile = async (fileUri: string) => {
    const isAvailable = await Sharing.isAvailableAsync();

    if (!isAvailable) {
        throw new Error('Sharing is not available on this device');
    }

    await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Clients Data',
    });
};
