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
    Filter,
    Plus,
    RefreshCw,
    MapPin,
    Clock,
    User,
    AlertTriangle,
    CheckCircle,
    XCircle,
    MoreVertical
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { API_BASE_URL } from '@/config/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Device {
    _id: string;
    deviceId: string;
    platform: string;
    state: 'PENDING' | 'ACTIVE' | 'LOCKED' | 'REMOVED' | 'UNASSIGNED';
    assignedCustomerId: string | null;
    brand: string;
    model: string;
    osVersion: string;
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

const stateConfig = {
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
            setDevices(data);
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

    const handleLock = async (deviceId: string) => {
        try {
            await fetch(`${API_BASE_URL}/api/devices/${deviceId}/lock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'Locked by admin' })
            });
            toast.success('Device locked');
            fetchDevices();
            fetchStats();
        } catch (err) {
            toast.error('Failed to lock device');
        }
    };

    const handleUnlock = async (deviceId: string) => {
        try {
            await fetch(`${API_BASE_URL}/api/devices/${deviceId}/unlock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'Unlocked by admin' })
            });
            toast.success('Device unlocked');
            fetchDevices();
            fetchStats();
        } catch (err) {
            toast.error('Failed to unlock device');
        }
    };

    const handleRemove = async (deviceId: string) => {
        if (!confirm('Remove this device? It will need a new QR to be used again.')) return;

        try {
            await fetch(`${API_BASE_URL}/api/devices/${deviceId}/remove`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'Removed by admin' })
            });
            toast.success('Device removed');
            fetchDevices();
            fetchStats();
        } catch (err) {
            toast.error('Failed to remove device');
        }
    };

    const filteredDevices = devices.filter(device => {
        if (!searchQuery) return true;
        const search = searchQuery.toLowerCase();
        return (
            device.deviceId.toLowerCase().includes(search) ||
            device.brand?.toLowerCase().includes(search) ||
            device.model?.toLowerCase().includes(search) ||
            device.customer?.name?.toLowerCase().includes(search) ||
            device.customer?.phoneNo?.includes(search)
        );
    });

    const StatCard = ({ label, value, state }: { label: string; value: number; state: string | null }) => {
        const isActive = filterState === state;
        const config = state ? stateConfig[state as keyof typeof stateConfig] : null;

        return (
            <button
                onClick={() => setFilterState(isActive ? null : state)}
                className={cn(
                    "flex-1 p-4 rounded-xl border-2 transition-all text-left",
                    isActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                    config?.textColor
                )}
            >
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
            </button>
        );
    };

    const DeviceCard = ({ device }: { device: Device }) => {
        const config = stateConfig[device.state];
        const Icon = config.icon;

        return (
            <Card className={cn(
                "border-border/50 hover:border-primary/30 transition-all",
                device.state === 'REMOVED' && "opacity-60"
            )}>
                <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                        {/* Customer Photo or Device Icon */}
                        <div className={cn(
                            "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0",
                            device.customer?.photoUrl ? "" : "bg-secondary"
                        )}>
                            {device.customer?.photoUrl ? (
                                <img
                                    src={device.customer.photoUrl}
                                    alt={device.customer.name}
                                    className="w-full h-full object-cover rounded-xl"
                                />
                            ) : (
                                <Smartphone className="w-6 h-6 text-muted-foreground" />
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-foreground truncate">
                                    {device.customer?.name || device.model || 'Unknown Device'}
                                </h4>
                                <Badge className={cn("text-xs", config.color, "text-white")}>
                                    {config.label}
                                </Badge>
                            </div>

                            <p className="text-sm text-muted-foreground truncate">
                                {device.brand} {device.model}
                            </p>

                            {device.customer && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    📱 {device.customer.phoneNo}
                                </p>
                            )}

                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {device.lastSeenAt
                                        ? format(new Date(device.lastSeenAt), 'MMM d, HH:mm')
                                        : 'Never'
                                    }
                                </span>
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-medium",
                                    device.platform === 'ios' ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-600"
                                )}>
                                    {device.platform?.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="flex-shrink-0">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {device.state === 'ACTIVE' && (
                                    <DropdownMenuItem onClick={() => handleLock(device.deviceId)}>
                                        <Lock className="w-4 h-4 mr-2 text-red-500" />
                                        Lock Device
                                    </DropdownMenuItem>
                                )}
                                {device.state === 'LOCKED' && (
                                    <DropdownMenuItem onClick={() => handleUnlock(device.deviceId)}>
                                        <Unlock className="w-4 h-4 mr-2 text-green-500" />
                                        Unlock Device
                                    </DropdownMenuItem>
                                )}
                                {device.customer && (
                                    <DropdownMenuItem onClick={() => navigate(`/customers/${device.assignedCustomerId}`)}>
                                        <User className="w-4 h-4 mr-2" />
                                        View Customer
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                {device.state !== 'REMOVED' && (
                                    <DropdownMenuItem
                                        onClick={() => handleRemove(device.deviceId)}
                                        className="text-red-500"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Remove Device
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Devices</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage all enrolled devices
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => { fetchDevices(); fetchStats(); }}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                        <Button onClick={() => navigate('/add-customer')}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Customer
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
                        <StatCard label="Total" value={stats.total} state={null} />
                        <StatCard label="Active" value={stats.ACTIVE} state="ACTIVE" />
                        <StatCard label="Locked" value={stats.LOCKED} state="LOCKED" />
                        <StatCard label="Pending" value={stats.PENDING} state="PENDING" />
                        <StatCard label="Removed" value={stats.REMOVED} state="REMOVED" />
                        <StatCard label="Unassigned" value={stats.UNASSIGNED} state="UNASSIGNED" />
                    </div>
                )}

                {/* Search & Filter */}
                <div className="flex gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, phone, model..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    {filterState && (
                        <Button
                            variant="ghost"
                            onClick={() => setFilterState(null)}
                            className="text-muted-foreground"
                        >
                            Clear Filter
                        </Button>
                    )}
                </div>

                {/* Device Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <Card key={i} className="animate-pulse">
                                <CardContent className="p-4 h-32" />
                            </Card>
                        ))}
                    </div>
                ) : filteredDevices.length === 0 ? (
                    <div className="text-center py-12">
                        <Smartphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No devices found</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {filterState
                                ? `No devices with "${filterState}" status`
                                : searchQuery
                                    ? 'No devices match your search'
                                    : 'Add a customer to get started'
                            }
                        </p>
                        <Button onClick={() => navigate('/add-customer')}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Customer
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredDevices.map(device => (
                            <DeviceCard key={device._id} device={device} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
