import React from 'react';
import { Wifi, WifiOff, Download, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Customer } from '@/types/customer';

interface DeviceStatusBadgeProps {
    customer: Customer;
}

export const DeviceStatusBadge: React.FC<DeviceStatusBadgeProps> = ({ customer }) => {
    const status = customer.deviceStatus?.status || 'pending';
    const installProgress = customer.deviceStatus?.installProgress || 0;

    const statusConfig = {
        pending: {
            icon: Clock,
            label: 'Pending Setup',
            color: 'text-yellow-500',
            bgColor: 'bg-yellow-500/10',
            borderColor: 'border-yellow-500/20'
        },
        installing: {
            icon: Download,
            label: `Installing APK (${installProgress}%)`,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
            borderColor: 'border-blue-500/20'
        },
        ADMIN_INSTALLED: {
            icon: CheckCircle,
            label: 'Enrolled',
            color: 'text-green-500',
            bgColor: 'bg-green-500/10',
            borderColor: 'border-green-500/20'
        },
        connected: {
            icon: CheckCircle,
            label: 'Connected',
            color: 'text-green-500',
            bgColor: 'bg-green-500/10',
            borderColor: 'border-green-500/20'
        },
        online: {
            icon: Wifi,
            label: 'Online',
            color: 'text-green-500',
            bgColor: 'bg-green-500/10',
            borderColor: 'border-green-500/20'
        },
        offline: {
            icon: WifiOff,
            label: 'Offline',
            color: 'text-gray-500',
            bgColor: 'bg-gray-500/10',
            borderColor: 'border-gray-500/20'
        },
        error: {
            icon: XCircle,
            label: 'Error',
            color: 'text-red-500',
            bgColor: 'bg-red-500/10',
            borderColor: 'border-red-500/20'
        }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    const lastSeen = customer.deviceStatus?.lastSeen
        ? new Date(customer.deviceStatus.lastSeen).toLocaleString()
        : 'Never';

    return (
        <div className="space-y-2">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bgColor} ${config.borderColor}`}>
                <Icon className={`w-4 h-4 ${config.color}`} />
                <span className={`text-sm font-medium ${config.color}`}>
                    {config.label}
                </span>
            </div>

            {status === 'installing' && installProgress > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                        className="bg-blue-500 h-full transition-all duration-300"
                        style={{ width: `${installProgress}%` }}
                    />
                </div>
            )}

            {customer.deviceStatus?.errorMessage && (
                <p className="text-xs text-red-500">
                    {customer.deviceStatus.errorMessage}
                </p>
            )}

            <p className="text-xs text-muted-foreground">
                Last seen: {lastSeen}
            </p>
        </div>
    );
};
