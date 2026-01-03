import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
    Lock,
    Unlock,
    Trash2,
    Eye,
    Smartphone,
    AlertCircle
} from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Admin {
    _id: string;
    name: string;
    email: string;
    deviceLimit: number;
}

interface Device {
    _id: string;
    customerName: string;
    imei1: string;
    phoneNumber: string;
    deviceModel: string;
    isLocked: boolean;
    deviceStatus?: {
        status: string;
        lastSeen?: string;
    };
}

interface AdminDevicesDialogProps {
    admin: Admin | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const AdminDevicesDialog = ({ admin, open, onOpenChange }: AdminDevicesDialogProps) => {
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const { toast } = useToast();

    const adminToken = localStorage.getItem('adminToken');

    // Fetch devices when dialog opens
    useEffect(() => {
        if (open && admin) {
            fetchDevices();
        }
    }, [open, admin]);

    const fetchDevices = async () => {
        if (!admin) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/admin/users/${admin._id}/devices`, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                },
            });

            const data = await response.json();

            if (data.success) {
                setDevices(data.devices);
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to fetch devices',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error fetching devices:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch devices',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleLockToggle = async (device: Device) => {
        setActionLoading(true);
        const action = device.isLocked ? 'unlock' : 'lock';

        try {
            const response = await fetch(`/api/admin/devices/${device._id}/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`,
                },
                body: JSON.stringify({
                    reason: `${action === 'lock' ? 'Locked' : 'Unlocked'} by Super Admin`
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: 'Success',
                    description: `Device ${action}ed successfully`,
                });

                // Refresh devices list
                fetchDevices();
            } else {
                toast({
                    title: 'Error',
                    description: data.message || `Failed to ${action} device`,
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error(`Error ${action}ing device:`, error);
            toast({
                title: 'Error',
                description: `Failed to ${action} device`,
                variant: 'destructive',
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteDevice = async () => {
        if (!selectedDevice) return;

        setActionLoading(true);

        try {
            const response = await fetch(`/api/admin/devices/${selectedDevice._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                },
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: 'Success',
                    description: 'Device removed successfully',
                });

                setDeleteDialogOpen(false);
                setSelectedDevice(null);

                // Refresh devices list
                fetchDevices();
            } else {
                toast({
                    title: 'Error',
                    description: data.message || 'Failed to remove device',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error removing device:', error);
            toast({
                title: 'Error',
                description: 'Failed to remove device',
                variant: 'destructive',
            });
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'online':
                return 'text-green-600 bg-green-50';
            case 'offline':
                return 'text-slate-600 bg-slate-50';
            case 'error':
                return 'text-red-600 bg-red-50';
            default:
                return 'text-slate-600 bg-slate-50';
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Smartphone className="h-5 w-5" />
                            {admin?.name}'s Devices
                        </DialogTitle>
                        <DialogDescription>
                            {admin?.email} • Device Limit: {admin?.deviceLimit} • Current: {devices.length}
                        </DialogDescription>
                    </DialogHeader>

                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : devices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Smartphone className="h-12 w-12 text-slate-300 mb-3" />
                            <p className="text-slate-600 font-medium">No devices found</p>
                            <p className="text-slate-400 text-sm">This admin hasn't added any devices yet</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>IMEI</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Model</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Lock</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {devices.map((device) => (
                                        <TableRow key={device._id}>
                                            <TableCell className="font-medium">{device.customerName}</TableCell>
                                            <TableCell className="font-mono text-xs">{device.imei1}</TableCell>
                                            <TableCell>{device.phoneNumber}</TableCell>
                                            <TableCell className="text-xs">{device.deviceModel || 'Unknown'}</TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-md text-xs font-semibold ${getStatusColor(device.deviceStatus?.status)}`}>
                                                    {device.deviceStatus?.status || 'Unknown'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {device.isLocked ? (
                                                    <span className="flex items-center gap-1 text-red-600 text-xs">
                                                        <Lock className="h-3 w-3" />
                                                        Locked
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-green-600 text-xs">
                                                        <Unlock className="h-3 w-3" />
                                                        Unlocked
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => handleLockToggle(device)}
                                                        disabled={actionLoading}
                                                    >
                                                        {device.isLocked ? (
                                                            <Unlock className="h-4 w-4 text-green-600" />
                                                        ) : (
                                                            <Lock className="h-4 w-4 text-orange-600" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => {
                                                            setSelectedDevice(device);
                                                            setDeleteDialogOpen(true);
                                                        }}
                                                        disabled={actionLoading}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-slate-600">
                            {devices.length} of {admin?.deviceLimit} devices used
                        </div>
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            Remove Device?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove <strong>{selectedDevice?.customerName}</strong>'s device?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteDevice}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={actionLoading}
                        >
                            {actionLoading ? 'Removing...' : 'Remove Device'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default AdminDevicesDialog;
