import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Smartphone,
    Lock,
    Unlock,
    Trash2,
    Search,
    Plus,
    RefreshCw,
    Clock,
    User,
    CheckCircle,
    XCircle,
    ChevronRight,
    Battery,
    Wifi
} from 'lucide-react';
import { API_BASE_URL } from '@/config/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import DeviceDetailsModal from '@/components/DeviceDetailsModal';

interface Device {
    _id: string;
    deviceId: string;
    platform: string;
    state: 'PENDING' | 'ACTIVE' | 'LOCKED' | 'REMOVED' | 'UNASSIGNED';
    assignedCustomerId: string | null;
    brand: string;
    model: string;
    osVersion: string;
    batteryLevel?: number;
    networkType?: string;
    lastSeenAt: string;
    customer?: {
        name: string;
        phoneNo: string;
        photoUrl?: string;
        isLocked: boolean;
    };
    enrollmentType: string;
    createdAt: string;
    updatedAt: string;
}

interface DeviceStats {
    total: number;
    PENDING: number;
    ACTIVE: number;
    LOCKED: number;
    REMOVED: number;
    UNASSIGNED: number;
}

const stateConfig: Record<string, { label: string; color: string; icon: any; textColor: string }> = {
    ACTIVE: { label: 'Active', color: 'bg-green-500', icon: CheckCircle, textColor: 'text-green-500' },
    LOCKED: { label: 'Locked', color: 'bg-red-500', icon: Lock, textColor: 'text-red-500' },
    REMOVED: { label: 'Removed', color: 'bg-gray-500', icon: XCircle, textColor: 'text-gray-500' },
    PENDING: { label: 'Pending', color: 'bg-yellow-500', icon: Clock, textColor: 'text-yellow-500' },
    UNASSIGNED: { label: 'Unassigned', color: 'bg-blue-500', icon: User, textColor: 'text-blue-500' }
};

export default function DevicesPage() {
    const navigate = useNavigate();
    const [devices, setDevices] = useState<Device[]>([]);
    const [stats, setStats] = useState<DeviceStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterState, setFilterState] = useState<string | null>(null);

    // Modal state
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        fetchDevices();
        fetchStats();
    }, [filterState]);

    const fetchDevices = async () => {
        try {
            const params = new URLSearchParams();
            if (filterState) params.append('state', filterState);

            const res = await fetch(`${API_BASE_URL}/api/devices?${params}`);
            const data = await res.json();
            setDevices(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch devices:', err);
            toast.error('Failed to load devices');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/devices/stats`);
            const data = await res.json();
            setStats(data);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    };

    const openDeviceDetails = (deviceId: string) => {
        setSelectedDeviceId(deviceId);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedDeviceId(null);
    };

    const handleRefresh = () => {
        fetchDevices();
        fetchStats();
    };

    const filteredDevices = devices.filter(device => {
        // Filter by State
        if (filterState) {
            if (device.state !== filterState) return false;
        } else {
            // By default, hide REMOVED devices
            if (device.state === 'REMOVED') return false;
        }

        if (!searchQuery) return true;
        const search = searchQuery.toLowerCase();
        return (
            device.deviceId?.toLowerCase().includes(search) ||
            device.brand?.toLowerCase().includes(search) ||
            device.model?.toLowerCase().includes(search) ||
            device.customer?.name?.toLowerCase().includes(search) ||
            device.customer?.phoneNo?.includes(search)
        );
    });

    const StatCard = ({ label, value, state }: { label: string; value: number; state: string | null }) => {
        const isActive = filterState === state;
        const config = state ? stateConfig[state] : null;

        return (
            <button
                onClick={() => setFilterState(isActive ? null : state)}
                className={cn(
                    "p-2 rounded-xl border transition-all text-center w-full",
                    isActive ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50",
                    config?.textColor
                )}
            >
                <p className="text-lg font-bold">{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
            </button>
        );
    };

    const DeviceCard = ({ device }: { device: Device }) => {
        const config = stateConfig[device.state] || stateConfig.PENDING;

        return (
            <Card
                className={cn(
                    "border-border/50 hover:border-primary/30 transition-all cursor-pointer",
                    device.state === 'REMOVED' && "opacity-60"
                )}
                onClick={() => openDeviceDetails(device.deviceId)}
            >
                <CardContent className="p-3">
                    <div className="flex items-start gap-2.5">
                        {/* Avatar/Icon */}
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden",
                            device.customer?.photoUrl ? "" : "bg-secondary"
                        )}>
                            {device.customer?.photoUrl ? (
                                <img
                                    src={device.customer.photoUrl}
                                    alt={device.customer.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Smartphone className="w-5 h-5 text-muted-foreground" />
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <h4 className="font-semibold text-foreground truncate text-sm">
                                    {device.customer?.name || device.model || device.brand || 'Unknown'}
                                </h4>
                                <Badge className={cn("text-[10px] px-1.5 h-4", config.color, "text-white")}>
                                    {config.label}
                                </Badge>
                            </div>

                            <p className="text-[10px] text-muted-foreground truncate">
                                {device.brand} {device.model}
                            </p>

                            {device.customer && (
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                    📱 {device.customer.phoneNo}
                                </p>
                            )}

                            {/* Quick stats */}
                            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {device.lastSeenAt
                                        ? format(new Date(device.lastSeenAt), 'MMM d, HH:mm')
                                        : 'Never'
                                    }
                                </span>
                                {device.batteryLevel !== undefined && (
                                    <span className="flex items-center gap-1">
                                        <Battery className="w-3 h-3" />
                                        {device.batteryLevel}%
                                    </span>
                                )}
                                {device.networkType && (
                                    <span className="flex items-center gap-1">
                                        <Wifi className="w-3 h-3" />
                                        {device.networkType}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Arrow */}
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Devices</h1>
                        <p className="text-xs text-muted-foreground">
                            Click any device to view details
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleRefresh}>
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button size="sm" onClick={() => navigate('/add-customer')}>
                            <Plus className="w-4 h-4 mr-1" />
                            Add
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        <StatCard label="Total" value={stats.total} state={null} />
                        <StatCard label="Active" value={stats.ACTIVE} state="ACTIVE" />
                        <StatCard label="Locked" value={stats.LOCKED} state="LOCKED" />
                        <StatCard label="Pending" value={stats.PENDING} state="PENDING" />
                        <StatCard label="Removed" value={stats.REMOVED} state="REMOVED" />
                        <StatCard label="Unassigned" value={stats.UNASSIGNED} state="UNASSIGNED" />
                    </div>
                )}

                {/* Search */}
                <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search devices..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    {filterState && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilterState(null)}
                        >
                            Clear
                        </Button>
                    )}
                </div>

                {/* Device List */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-3">
                        {[1, 2, 3, 4].map(i => (
                            <Card key={i} className="animate-pulse">
                                <CardContent className="p-4 h-24" />
                            </Card>
                        ))}
                    </div>
                ) : filteredDevices.length === 0 ? (
                    <div className="text-center py-12">
                        <Smartphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No devices found</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {filterState
                                ? `No "${filterState}" devices`
                                : searchQuery
                                    ? 'No matches'
                                    : 'Add a customer to get started'
                            }
                        </p>
                        <Button onClick={() => navigate('/add-customer')}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Customer
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-3">
                        {filteredDevices.map(device => (
                            <DeviceCard key={device._id} device={device} />
                        ))}
                    </div>
                )}
            </div>

            {/* Device Details Modal */}
            <DeviceDetailsModal
                deviceId={selectedDeviceId}
                isOpen={modalOpen}
                onClose={closeModal}
                onRefresh={handleRefresh}
            />
        </div>
    );
}
